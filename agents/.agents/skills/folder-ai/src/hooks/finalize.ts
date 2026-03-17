/**
 * Session finalize pipeline. Runs async after session ends.
 * Waits for refines, generates TLDR, rewords commits, pushes.
 *
 * CLI: bun cli.ts hook finalize <sessionId> <projectDir>
 */

import { join, basename } from 'path'
import { homedir } from 'os'
import { existsSync, writeFileSync, readFileSync, unlinkSync } from 'fs'
import { spawnSync } from 'child_process'
import { resolveConfig } from '../lib/config'
import { gitRoot, git, headSha, hasRemote, push, currentBranch } from '../lib/git'
import { readLock, isLockStale } from '../commit/lock'
import { readWatermark, folderAiDir, refineDir } from '../lib/session-chain'
import { parseTranscript, formatTitleTranscript } from '../commit/transcript'
import {
  runTldrAgent, runRewordAgent, parseRewordOutput,
  DEFAULT_COMMAND, DEFAULT_TLDR_PROMPT, DEFAULT_REWORD_PROMPT
} from '../commit/agent'
import { getCommitTargets } from '../lib/repos'
import { encodePath, scanSessions } from '../lib/claude-projects'
import { exists, readFile, writeFile, ensureDir, listDir, removeDirRecursive, appendToFile } from '../lib/io'
import { logCommitEvent } from '../lib/registry'
import { buildSessionData } from '../watch'
import { sessionFileMd, sessionsIndexRow } from '../lib/templates'

/**
 * Acquire per-session finalize lock. Returns true if lock acquired.
 */
function acquireFinalizeLock(shortId: string): boolean {
  const lockPath = join(homedir(), '.folder-ai', `finalizing-${shortId}`)
  if (existsSync(lockPath)) {
    // Check if lock holder is still alive
    try {
      const pid = parseInt(readFileSync(lockPath, 'utf8').trim(), 10)
      if (pid && !isNaN(pid)) {
        try { process.kill(pid, 0); return false } catch {} // process dead, take over
      }
    } catch {}
  }
  writeFileSync(lockPath, String(process.pid))
  return true
}

function releaseFinalizeLock(shortId: string): void {
  try { unlinkSync(join(homedir(), '.folder-ai', `finalizing-${shortId}`)) } catch {}
}

/**
 * Main finalize pipeline entry point.
 */
export function finalize(sessionId: string, projectDir: string): void {
  if (!sessionId || !projectDir) return
  if (process.env.FOLDERAI_DISABLED) return
  if (existsSync(join(homedir(), '.folder-ai', 'disabled'))) return

  const shortId = sessionId.slice(0, 8)
  if (!acquireFinalizeLock(shortId)) return

  const root = gitRoot(projectDir)
  if (!root) return

  const config = resolveConfig(root)
  if (config.finalize?.enabled === false) return

  const fc = config.finalize || {}
  const project = basename(root)
  const branch = currentBranch(root)

  logCommitEvent('finalize-start', { project, branch, sessionId: sessionId.slice(0, 8) })

  try {
    // 1. Wait for in-flight refines
    waitForRefines(root, fc.refineTimeout ?? 90000)

    // 2. Generate TLDR
    let tldr: string | null = null
    if (fc.tldr !== false) {
      const transcriptPath = resolveTranscriptPath(projectDir, sessionId)
      if (transcriptPath) {
        tldr = generateTldr(root, fc, transcriptPath)
      }
    }

    // 3. Write TLDR to session file
    let sessionFilePath: string | null = null
    if (tldr) {
      sessionFilePath = writeSessionTldr(projectDir, sessionId, tldr, root, config)
    }

    // 4. Reword session commits
    if (fc.reword !== false) {
      rewordSessionCommits(root, sessionId, tldr, fc, project, branch)
    }

    // 5. Commit session file update
    if (sessionFilePath) {
      commitSessionFile(projectDir, sessionFilePath, sessionId)
    }

    // 6. Push all targets
    if (fc.push !== false) {
      pushAllTargets(root, config, project)
    }

    logCommitEvent('finalize-success', { project, branch, hasTldr: !!tldr })
  } catch {
    logCommitEvent('finalize-fail', { project, branch })
  } finally {
    releaseFinalizeLock(shortId)
  }
}

/**
 * Poll for in-flight refine processes to complete.
 */
function waitForRefines(root: string, timeoutMs: number): void {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    const lock = readLock(root)
    const dir = refineDir(root)
    const manifests = listDir(dir).filter(f => f.endsWith('.json'))

    // No lock and no pending manifests = all done
    if (!lock && manifests.length === 0) return

    // Stale lock with no manifests = proceed
    if (lock && isLockStale(lock) && manifests.length === 0) return

    spawnSync('sleep', ['2'])
  }

  logCommitEvent('finalize-refine-timeout', { root: basename(root) })
}

/**
 * Resolve the transcript JSONL path for a session.
 */
function resolveTranscriptPath(projectDir: string, sessionId: string): string | null {
  const claudeProjectDir = join(homedir(), '.claude', 'projects', encodePath(projectDir))
  const p = join(claudeProjectDir, sessionId + '.jsonl')
  return exists(p) ? p : null
}

/**
 * Generate a TLDR summary of the session via LLM.
 */
function generateTldr(root: string, fc: { command?: string; tldrPrompt?: string }, transcriptPath: string): string | null {
  const pairs = parseTranscript(transcriptPath)
  if (pairs.length === 0) return null

  // Build condensed transcript (user prompts + response summaries)
  const transcript = formatTitleTranscript(pairs, 30000)
  const command = fc.command || DEFAULT_COMMAND
  const prompt = fc.tldrPrompt || DEFAULT_TLDR_PROMPT

  return runTldrAgent(root, command, prompt, transcript)
}

/**
 * Write TLDR to the session .md file and to .git/folder-ai/tldr/.
 * If no session file exists yet (cron hasn't run), creates one via buildSessionData.
 */
function writeSessionTldr(projectDir: string, sessionId: string, tldr: string, root: string, config: any): string | null {
  const shortId = sessionId.slice(0, 8)
  const sessionsDir = join(projectDir, 'sessions')

  // Find existing session file by shortId
  const files = listDir(sessionsDir)
  const match = files.find(f => f.includes(shortId) && f.endsWith('.md'))

  let filePath: string

  if (!match) {
    // Session file doesn't exist yet — create it with TLDR injected
    const created = createSessionFileWithTldr(projectDir, sessionId, tldr, root, config)
    if (!created) return null
    filePath = created
  } else {
    filePath = join(sessionsDir, match)
    const content = readFile(filePath)
    if (!content) return null

    // Skip if TLDR already present
    if (content.includes('\n## TLDR\n')) {
      // Still write to tldr dir for reword step
      const tldrDir = join(folderAiDir(root), 'tldr')
      ensureDir(tldrDir)
      writeFile(join(tldrDir, sessionId + '.txt'), tldr)
      return filePath
    }

    // Insert ## TLDR section after header metadata, before ## Prompt or ## Summary
    const tldrSection = `\n## TLDR\n\n${tldr}\n`
    let newContent: string

    const promptIdx = content.indexOf('\n## Prompt')
    const summaryIdx = content.indexOf('\n## Summary')

    if (promptIdx !== -1) {
      newContent = content.slice(0, promptIdx) + tldrSection + content.slice(promptIdx)
    } else if (summaryIdx !== -1) {
      newContent = content.slice(0, summaryIdx) + tldrSection + content.slice(summaryIdx)
    } else {
      newContent = content + tldrSection
    }

    writeFile(filePath, newContent)
  }

  // Also write to .git/folder-ai/tldr/ for reword step
  const tldrDir = join(folderAiDir(root), 'tldr')
  ensureDir(tldrDir)
  writeFile(join(tldrDir, sessionId + '.txt'), tldr)

  return filePath
}

/**
 * Create session .md file from scratch when cron watcher hasn't run yet.
 * Uses the same buildSessionData logic as the watcher, with TLDR injected.
 */
function createSessionFileWithTldr(
  projectDir: string, sessionId: string, tldr: string, root: string, config: any
): string | null {
  const sessions = scanSessions(projectDir)
  const session = sessions.find(s => s.id === sessionId)
  if (!session) {
    logCommitEvent('finalize-no-session-found', { sessionId: sessionId.slice(0, 8) })
    return null
  }

  const data = buildSessionData(session, projectDir, config)
  if (!data) return null

  data.tldr = tldr

  const sessionsDir = join(projectDir, 'sessions')
  ensureDir(sessionsDir)

  // Build timestamped filename: YYYY-MM-DD-HHMM-{shortId}.md
  const ts = new Date(data.startedAt)
  const yyyy = ts.getFullYear()
  const mm = String(ts.getMonth() + 1).padStart(2, '0')
  const dd = String(ts.getDate()).padStart(2, '0')
  const hh = String(ts.getHours()).padStart(2, '0')
  const min = String(ts.getMinutes()).padStart(2, '0')
  const shortId = sessionId.slice(0, 8)
  const filePath = join(sessionsDir, `${yyyy}-${mm}-${dd}-${hh}${min}-${shortId}.md`)

  writeFile(filePath, sessionFileMd(data))

  // Update sessions.md index
  const indexFile = join(sessionsDir, 'sessions.md')
  if (exists(indexFile)) {
    const date = data.startedAt.slice(0, 10)
    const note = (data.summary || '').split('\n')[0].slice(0, 80)
    appendToFile(indexFile, sessionsIndexRow(date, shortId, data.status, data.issue || '', note))
  }

  return filePath
}

/**
 * Holistic reword of all session commits for consistency.
 * Only touches commits tracked by folder-ai watermarks.
 * Skips if stray commits are interleaved.
 */
function rewordSessionCommits(
  root: string, sessionId: string, tldr: string | null,
  fc: { command?: string; rewordPrompt?: string },
  project: string, branch: string
): void {
  const watermark = readWatermark(root, sessionId)
  if (!watermark?.commit) return

  // Collect session commits: walk back from watermark to find session range
  const commits = getSessionCommitRange(root, watermark.commit)
  if (!commits || commits.shas.length === 0) return
  if (commits.shas.length === 1) return // single commit, already refined

  // Check for interleaved stray commits
  if (commits.hasInterleaved) {
    logCommitEvent('finalize-skip-interleaved', { project, branch })
    return
  }

  // Build commits text for LLM
  const commitsText = commits.messages
    .map((msg, i) => `COMMIT ${i + 1}: ${msg}`)
    .join('\n\n')

  const command = fc.command || DEFAULT_COMMAND
  const prompt = fc.rewordPrompt || DEFAULT_REWORD_PROMPT
  const context = tldr || 'No session summary available.'

  const result = runRewordAgent(root, command, prompt, context, commitsText)
  if (!result) return

  const newMessages = parseRewordOutput(result, commits.shas.length)
  if (!newMessages) {
    logCommitEvent('finalize-reword-parse-fail', { project, branch, count: commits.shas.length })
    return
  }

  // Apply reworded messages via cherry-pick replay
  const success = applyReword(root, commits.shas, newMessages, branch)
  if (success) {
    logCommitEvent('finalize-reword-success', { project, branch, count: commits.shas.length })
  } else {
    logCommitEvent('finalize-reword-fail', { project, branch })
  }
}

interface CommitRange {
  shas: string[]        // newest → oldest
  messages: string[]    // parallel to shas
  hasInterleaved: boolean
}

/**
 * Get the range of session commits ending at watermarkSha.
 * Walks backward looking for folder-ai commit patterns.
 * Returns null if the watermark commit is not reachable from HEAD.
 */
function getSessionCommitRange(root: string, watermarkSha: string): CommitRange | null {
  try {
    // Verify watermark commit is an ancestor of HEAD
    git(`merge-base --is-ancestor ${watermarkSha} HEAD`, { cwd: root })
  } catch {
    return null
  }

  // Get commits between HEAD and some reasonable limit
  // Session commits are identified by walking back from watermark
  try {
    // Get all commits from watermark back, limit to 50
    const output = git(`log --format=%H ${watermarkSha} -50`, { cwd: root })
    if (!output.trim()) return null

    const allShas = output.trim().split('\n')
    const shas: string[] = []
    const messages: string[] = []

    for (const sha of allShas) {
      const body = git(`log -1 --format=%B ${sha}`, { cwd: root }).trim()

      // Heuristic: folder-ai commits have structured bodies with
      // "Prompt:" / "Response:" or agent-generated summaries with "TURN"/"OVERALL"
      // or continuation references, or [tc-pending] tags
      const looksLikeFolderAi = body.includes('Prompt:\n') ||
        body.includes('TURN ') ||
        body.includes('OVERALL:') ||
        body.includes('[tc-pending]') ||
        body.includes('Continuation of ')

      if (looksLikeFolderAi) {
        shas.push(sha)
        // For reword, only use the title (first line)
        messages.push(body.split('\n')[0])
      } else {
        // Stop at the first non-folder-ai commit
        break
      }
    }

    // Check for interleaving: are there any commits between HEAD and watermark
    // that aren't in our list?
    let hasInterleaved = false
    if (shas.length > 0) {
      try {
        const headToWatermark = git(`log --format=%H ${watermarkSha}..HEAD`, { cwd: root }).trim()
        if (headToWatermark) {
          // There are commits after watermark — that's OK (could be from other sessions)
          // But check if any non-folder-ai commits are between our session commits
          const betweenShas = headToWatermark.split('\n').filter(Boolean)
          for (const sha of betweenShas) {
            const body = git(`log -1 --format=%B ${sha}`, { cwd: root }).trim()
            const looksManual = !body.includes('Prompt:\n') &&
              !body.includes('TURN ') &&
              !body.includes('[tc-pending]') &&
              !body.includes('Continuation of ') &&
              !body.startsWith('chore: update session') &&
              !body.startsWith('chore: finalize session')
            if (looksManual) {
              hasInterleaved = true
              break
            }
          }
        }
      } catch {
        // Can't determine — play it safe
        hasInterleaved = true
      }
    }

    return { shas, messages, hasInterleaved }
  } catch {
    return null
  }
}

/**
 * Apply reworded commit messages via cherry-pick replay.
 * shas are newest→oldest, newMessages are parallel.
 */
function applyReword(root: string, shas: string[], newMessages: string[], branch: string): boolean {
  if (shas.length === 0) return true

  const headBefore = headSha(root)
  const oldestSha = shas[shas.length - 1]

  // Find parent of oldest commit
  let base: string
  try {
    base = git(`rev-parse ${oldestSha}~1`, { cwd: root })
  } catch {
    return false
  }

  // Create temp dir for message files
  const tmpDir = join(folderAiDir(root), 'reword-tmp')
  ensureDir(tmpDir)

  try {
    // Detach at base
    git(`checkout --detach ${base}`, { cwd: root })

    // Cherry-pick oldest→newest with new messages
    for (let i = shas.length - 1; i >= 0; i--) {
      git(`cherry-pick --no-commit ${shas[i]}`, { cwd: root })

      // Write message to temp file to avoid escaping issues
      const msgFile = join(tmpDir, `msg-${i}`)
      writeFile(msgFile, newMessages[i])
      git(`commit -F "${msgFile}" --no-verify --allow-empty`, { cwd: root })
    }

    // Move branch to new HEAD
    const newTip = headSha(root)
    git(`checkout ${branch}`, { cwd: root })
    git(`reset --hard ${newTip}`, { cwd: root })

    return true
  } catch {
    // Recovery: restore original state
    try { git('cherry-pick --abort', { cwd: root }) } catch {}
    try { git(`checkout ${branch}`, { cwd: root }) } catch {}
    try { git(`reset --hard ${headBefore}`, { cwd: root }) } catch {}
    return false
  } finally {
    removeDirRecursive(tmpDir)
  }
}

/**
 * Commit the updated session .md file.
 */
function commitSessionFile(projectDir: string, sessionFilePath: string, sessionId: string): void {
  const shortId = sessionId.slice(0, 8)
  try {
    git(`add "${sessionFilePath}"`, { cwd: projectDir })
    git(`commit -m "chore: finalize session ${shortId}" --no-verify`, { cwd: projectDir })
  } catch {
    // File might not have changes or git might not be initialized
  }
}

/**
 * Push all commit targets (workspace + child repos).
 */
function pushAllTargets(root: string, config: { autocommit: { workspace: boolean; children: Record<string, boolean> } }, project: string): void {
  const targets = getCommitTargets(root, config.autocommit)

  for (const target of targets) {
    if (!hasRemote(target.path)) continue
    try {
      push(target.path)
      logCommitEvent('finalize-push', { project: target.name, path: target.path })
    } catch {
      logCommitEvent('finalize-push-fail', { project: target.name })
    }
  }
}

import { loadJson, fileSize } from '../lib/io'
import { gitRoot, hasChanges, addAndCommit, hasCommits, currentBranch, hasRemote, push } from '../lib/git'
import { resolveConfig } from '../lib/config'
import { parseTranscript, formatBody, formatTitleTranscript, extractHeadline, extractModel, isHookFeedback, truncateHookFeedback } from '../commit/transcript'
import { runTitleAgent, runBodyAgent, runCondenseAgent } from '../commit/agent'
import { wrapText } from '../lib/wrap'
import { logCommitEvent, readRegistry } from '../lib/registry'
import { getAncestors, savePending, collectPending, cleanupConsumed, cleanupStale, readWatermark, saveWatermark, resolveParentCommit, saveRefineManifest } from '../lib/session-chain'
import { getCommitTargets } from '../lib/repos'
import { formatModelName } from '../lib/claude-projects'
import { updateLiveSession } from '../watch'
import { basename, join } from 'path'
import { homedir } from 'os'
import { spawn } from 'child_process'
import { existsSync, statSync } from 'fs'

const PENDING_TAG = '[tc-pending]'

/**
 * Read Claude Code's attribution.commit setting.
 * Returns the string value (including empty string for explicit opt-out),
 * or undefined when the setting is absent / not running under Claude Code.
 */
function readClaudeAttribution(root: string | null): string | undefined {
  if (!process.env.CLAUDECODE) return undefined
  const globalSettings = loadJson<any>(join(homedir(), '.claude', 'settings.json'))
  const projectSettings = root ? loadJson<any>(join(root, '.claude', 'settings.json')) : null
  const projectVal = projectSettings?.attribution?.commit
  const globalVal = globalSettings?.attribution?.commit
  if (projectVal !== undefined) return projectVal
  if (globalVal !== undefined) return globalVal
  return undefined
}

/**
 * Resolve the Co-Authored-By trailer value.
 * Tier 1: folder-ai config (coauthor: false -> null, string -> use it)
 * Tier 2: Claude Code attribution.commit setting
 * Tier 3: auto-detect model from transcript
 */
export function resolveCoauthor(config: any, transcriptPath: string, root: string): string | null {
  // Tier 1: explicit config (default: no trailer)
  if (config.coauthor === false || config.coauthor === undefined) return null

  if (typeof config.coauthor === 'string') {
    return `Co-Authored-By: ${config.coauthor}`
  }

  // Tier 2: Claude Code attribution setting
  const claudeAttr = readClaudeAttribution(root)
  if (claudeAttr !== undefined) {
    return claudeAttr === '' ? null : claudeAttr
  }

  // Tier 3: auto-detect from transcript
  const model = extractModel(transcriptPath)
  if (!model) return null
  const name = formatModelName(model)
  return `Co-Authored-By: ${name} <noreply@anthropic.com>`
}

/**
 * Condense verbose hook feedback in pairs via a summarizer agent.
 * Mutates pairs in place.
 */
export function condensePairs(root: string, config: any, pairs: { prompt: string; response: string }[]): void {
  const condenseCfg = config.condense || {}
  const minLength = condenseCfg.minLength || 200
  for (const pair of pairs) {
    if (!isHookFeedback(pair.prompt) || pair.prompt.length < minLength) continue
    const summary = runCondenseAgent(root, condenseCfg, pair.prompt)
    pair.prompt = summary || truncateHookFeedback(pair.prompt)
  }
}

/**
 * Spawn a detached background process to refine a pending commit.
 */
export function spawnRefine(manifestPath: string): void {
  const cliPath = join(__dirname, '..', 'cli.ts')
  const child = spawn('bun', ['run', cliPath, 'hook', 'refine', manifestPath], {
    detached: true,
    stdio: 'ignore',
    env: { ...process.env, FOLDERAI_DISABLED: '1' }
  })
  child.unref()
}

/**
 * Core auto-commit logic. Called on Stop hook event.
 * Reads hook input, checks bail conditions, iterates commit targets.
 * Always returns void -- never blocks Claude, never outputs to stdout.
 */
export function handleStop(input: string): void {
  if (process.env.FOLDERAI_DISABLED) return
  if (existsSync(join(homedir(), '.folder-ai', 'disabled'))) return

  let hookInput: any
  try {
    hookInput = JSON.parse(input)
  } catch {
    return
  }

  // Find workspace root
  const cwd = hookInput.cwd || process.cwd()
  const root = gitRoot(cwd)
  if (!root) return

  // Resolve config (global + project merged with defaults)
  const config = resolveConfig(root)
  if (!config.enabled) return

  // Update live session file on every turn
  const sessionId = hookInput.session_id
  if (sessionId && hookInput.transcript_path) {
    try {
      // Find registered project matching this workspace
      const projectPath = readRegistry().find(e => root.startsWith(e.path) || e.path.startsWith(root))?.path
      if (projectPath) {
        updateLiveSession(sessionId, hookInput.transcript_path, projectPath)
      }
    } catch {}
  }

  // Parse transcript
  const pairs = parseTranscript(hookInput.transcript_path)

  // Watermark slicing: only include new pairs since last commit in this session
  const watermark = sessionId ? readWatermark(root, sessionId) : null
  const newPairs = watermark ? pairs.slice(watermark.pairs) : pairs
  const effectivePairs = newPairs.length > 0 ? newPairs : pairs

  // Get all commit targets (workspace + child repos)
  const targets = getCommitTargets(root, config.autocommit || { workspace: true, children: {} })

  // Check if ANY target has changes
  const targetsWithChanges = targets.filter(t => {
    try {
      return !hasCommits(t.path) || hasChanges(t.path)
    } catch {
      return false
    }
  })

  // Early exit: no changes across all targets
  if (targetsWithChanges.length === 0) {
    if (sessionId) {
      savePending(root, sessionId, formatBody(effectivePairs))
    }
    logCommitEvent('skip', { project: basename(root), branch: currentBranch(root) })
    cleanupStale(root)
    return
  }

  try {
    // Resolve continuation + pending (instant, no LLM)
    let continuation = ''
    let pendingSections: string[] = []
    if (sessionId) {
      const parentCommit = resolveParentCommit(root, sessionId)
      continuation = parentCommit
        ? `Continuation of ${parentCommit.slice(0, 7)}\n\n`
        : ''
      const ancestors = getAncestors(root, sessionId)
      pendingSections = collectPending(root, [...ancestors].reverse())
    }

    // Resolve coauthor trailer (instant, no LLM)
    const coauthor = resolveCoauthor(config, hookInput.transcript_path, root)
    const coauthorTag = coauthor ? '\n\n' + coauthor : ''

    const mode = config.commitMode || 'async'

    // Iterate each target repo independently
    for (const target of targetsWithChanges) {
      const project = target.name
      const branch = currentBranch(target.path)
      let context = 0
      try { context = statSync(hookInput.transcript_path).size } catch {}

      logCommitEvent('start', { project, branch, context })

      if (mode !== 'sync') {
        // -- Async path: fast commit, background refine --
        commitAsync(target.path, project, branch, context, effectivePairs, pairs,
          continuation, pendingSections, coauthorTag, config, sessionId, hookInput)
      } else {
        // -- Sync path: blocking with agent calls --
        commitSync(target.path, project, branch, context, effectivePairs, pairs,
          continuation, pendingSections, coauthorTag, config, sessionId, hookInput)
      }
    }

    // Post-commit cleanup (once, not per-target)
    if (sessionId) {
      const ancestors = getAncestors(root, sessionId)
      cleanupConsumed(root, [...ancestors, sessionId])
    }
    cleanupStale(root)
  } catch (err) {
    logCommitEvent('fail', { project: basename(root), branch: currentBranch(root) })
    throw err
  }
}

/** Async commit: fast headline from transcript, background refine later */
function commitAsync(
  repoPath: string, project: string, branch: string, context: number,
  effectivePairs: { prompt: string; response: string }[],
  allPairs: { prompt: string; response: string }[],
  continuation: string, pendingSections: string[],
  coauthorTag: string, config: any, sessionId: string | null,
  hookInput: any
): void {
  const headline = extractHeadline(effectivePairs)
  const formattedTranscript = formatBody(effectivePairs)

  let combinedBody: string
  if (pendingSections.length > 0) {
    combinedBody = PENDING_TAG + '\n\n' + continuation +
      '## Planning\n\n' + pendingSections.join('\n\n---\n\n') +
      '\n\n## Implementation\n\n' + formattedTranscript
  } else {
    combinedBody = PENDING_TAG + '\n\n' + continuation + formattedTranscript
  }

  const wrappedBody = wrapText(combinedBody, config.body?.maxLineLength)
  const sha = addAndCommit(repoPath, headline, wrappedBody + coauthorTag)

  logCommitEvent('fast-commit', { project, branch, context, title: headline })

  if (sessionId) {
    saveWatermark(repoPath, sessionId, allPairs.length, sha)
  }

  // Save manifest for phase 2
  const manifestPath = saveRefineManifest(repoPath, sha, {
    root: repoPath,
    sha,
    sessionId,
    config,
    effectivePairs,
    continuation,
    pendingSections,
    coauthor: coauthorTag ? coauthorTag.slice(2) : null, // strip leading \n\n
    pairCount: allPairs.length,
    branch
  })

  // Spawn detached background refine process
  spawnRefine(manifestPath)
}

/** Sync commit: blocking agent calls for title + body */
function commitSync(
  repoPath: string, project: string, branch: string, context: number,
  effectivePairs: { prompt: string; response: string }[],
  allPairs: { prompt: string; response: string }[],
  continuation: string, pendingSections: string[],
  coauthorTag: string, config: any, sessionId: string | null,
  hookInput: any
): void {
  if (config.condense?.enabled !== false) {
    condensePairs(repoPath, config, effectivePairs)
  }

  const formattedTranscript = formatBody(effectivePairs)

  let headline: string | null = null
  if (config.title?.type !== 'transcript') {
    const titleTranscript = formatTitleTranscript(effectivePairs)
    headline = runTitleAgent(repoPath, config.title || {}, titleTranscript)
  }
  headline = headline || extractHeadline(effectivePairs)

  let body: string | null = null
  if (config.body?.type !== 'transcript') {
    body = runBodyAgent(repoPath, config.body || {}, formattedTranscript)
  }
  body = body || formattedTranscript

  let combinedBody: string
  if (pendingSections.length > 0) {
    combinedBody = continuation + '## Planning\n\n' +
      pendingSections.join('\n\n---\n\n') +
      '\n\n## Implementation\n\n' + body
  } else {
    combinedBody = continuation + body
  }

  const wrappedBody = wrapText(combinedBody, config.body?.maxLineLength)
  const sha = addAndCommit(repoPath, headline, wrappedBody + coauthorTag)

  if (config.autoPush && !config.finalize?.enabled && hasRemote(repoPath)) {
    try {
      push(repoPath)
    } catch {
      logCommitEvent('push-fail', { project, branch })
    }
  }

  logCommitEvent('success', { project, branch, context, title: headline })

  if (sessionId) {
    saveWatermark(repoPath, sessionId, allPairs.length, sha)
  }
}

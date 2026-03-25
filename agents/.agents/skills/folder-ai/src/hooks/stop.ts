import { loadJson } from '../lib/io'
import { gitRoot, hasChanges, addAndCommit, hasCommits, currentBranch, hasRemote, push } from '../lib/git'
import { resolveConfig } from '../lib/config'
import { parseTranscript, formatBody, formatTitleTranscript, extractHeadline, extractModel, isHookFeedback, truncateHookFeedback } from '../commit/transcript'
import { runTitleAgent, runBodyAgent, runCondenseAgent } from '../commit/agent'
import { wrapText } from '../lib/wrap'
import { logCommitEvent, readRegistry } from '../lib/registry'
import { getAncestors, savePending, collectPending, cleanupConsumed, cleanupStale, readWatermark, saveWatermark, resolveParentCommit, saveRefineManifest } from '../lib/session-chain'
import { getCommitTargets } from '../lib/repos'
import { formatModelName, formatOpenAIModelName } from '../lib/claude-projects'
import { updateLiveSession } from '../watch'
import { basename, join } from 'path'
import { homedir } from 'os'
import { spawn } from 'child_process'
import { existsSync, statSync } from 'fs'
import type { TranscriptPair } from '../commit/transcript'

const PENDING_TAG = '[tc-pending]'

export interface CommitCoreInput {
  root: string
  config: any
  sessionId: string | null
  effectivePairs: TranscriptPair[]
  allPairsCount: number
  transcriptPath: string | null
  agent: 'claude' | 'codex'
  model: string | null
}

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
export function resolveCoauthor(config: any, agent: 'claude' | 'codex', model: string | null, root: string): string | null {
  // Tier 1: explicit config (default: no trailer)
  if (config.coauthor === false || config.coauthor === undefined) return null

  if (typeof config.coauthor === 'string') {
    return `Co-Authored-By: ${config.coauthor}`
  }

  if (agent === 'claude') {
    // Tier 2: Claude Code attribution setting
    const claudeAttr = readClaudeAttribution(root)
    if (claudeAttr !== undefined) {
      return claudeAttr === '' ? null : claudeAttr
    }
  }

  // Tier 3: auto-detect from model
  if (!model) return null
  if (agent === 'codex') {
    const name = formatOpenAIModelName(model)
    return `Co-Authored-By: ${name} <noreply@openai.com>`
  }
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
 * Claude Code Stop hook adapter.
 * Parses Claude-specific input, then delegates to commitCore().
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

  const cwd = hookInput.cwd || process.cwd()
  const root = gitRoot(cwd)
  if (!root) return

  const config = resolveConfig(root)
  if (!config.enabled) return

  // Update live session file (Claude-specific)
  const sessionId = hookInput.session_id
  if (sessionId && hookInput.transcript_path) {
    try {
      const projectPath = readRegistry().find(e => root.startsWith(e.path) || e.path.startsWith(root))?.path
      if (projectPath) {
        updateLiveSession(sessionId, hookInput.transcript_path, projectPath)
      }
    } catch {}
  }

  const pairs = parseTranscript(hookInput.transcript_path)

  const watermark = sessionId ? readWatermark(root, sessionId) : null
  const newPairs = watermark ? pairs.slice(watermark.pairs) : pairs
  const effectivePairs = newPairs.length > 0 ? newPairs : pairs

  const model = extractModel(hookInput.transcript_path)

  commitCore({
    root,
    config,
    sessionId,
    effectivePairs,
    allPairsCount: pairs.length,
    transcriptPath: hookInput.transcript_path,
    agent: 'claude',
    model
  })
}

/**
 * Shared commit logic for both Claude and Codex.
 * Finds targets with changes, resolves coauthor, commits each target.
 */
export function commitCore(input: CommitCoreInput): void {
  const { root, config, sessionId, effectivePairs, allPairsCount, transcriptPath, agent, model } = input

  const targets = getCommitTargets(root, config.autocommit || { workspace: true, children: {} })

  const targetsWithChanges = targets.filter(t => {
    try {
      return !hasCommits(t.path) || hasChanges(t.path)
    } catch {
      return false
    }
  })

  if (targetsWithChanges.length === 0) {
    if (sessionId && agent === 'claude') {
      savePending(root, sessionId, formatBody(effectivePairs))
    }
    logCommitEvent('skip', { project: basename(root), branch: currentBranch(root) })
    cleanupStale(root)
    return
  }

  try {
    // Session chains (Claude only — Codex has no continuation/pending)
    let continuation = ''
    let pendingSections: string[] = []
    if (sessionId && agent === 'claude') {
      const parentCommit = resolveParentCommit(root, sessionId)
      continuation = parentCommit
        ? `Continuation of ${parentCommit.slice(0, 7)}\n\n`
        : ''
      const ancestors = getAncestors(root, sessionId)
      pendingSections = collectPending(root, [...ancestors].reverse())
    }

    const coauthor = resolveCoauthor(config, agent, model, root)
    const coauthorTag = coauthor ? '\n\n' + coauthor : ''

    const mode = config.commitMode || 'async'

    for (const target of targetsWithChanges) {
      const project = target.name
      const branch = currentBranch(target.path)
      let context = 0
      if (transcriptPath) {
        try { context = statSync(transcriptPath).size } catch {}
      }

      logCommitEvent('start', { project, branch, context })

      if (mode !== 'sync') {
        commitAsync(target.path, project, branch, context, effectivePairs,
          allPairsCount, continuation, pendingSections, coauthorTag, config, sessionId)
      } else {
        commitSync(target.path, project, branch, context, effectivePairs,
          allPairsCount, continuation, pendingSections, coauthorTag, config, sessionId)
      }
    }

    if (sessionId && agent === 'claude') {
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
  allPairsCount: number,
  continuation: string, pendingSections: string[],
  coauthorTag: string, config: any, sessionId: string | null
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
    saveWatermark(repoPath, sessionId, allPairsCount, sha)
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
    pairCount: allPairsCount,
    branch
  })

  // Spawn detached background refine process
  spawnRefine(manifestPath)
}

/** Sync commit: blocking agent calls for title + body */
function commitSync(
  repoPath: string, project: string, branch: string, context: number,
  effectivePairs: { prompt: string; response: string }[],
  allPairsCount: number,
  continuation: string, pendingSections: string[],
  coauthorTag: string, config: any, sessionId: string | null
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
    saveWatermark(repoPath, sessionId, allPairsCount, sha)
  }
}

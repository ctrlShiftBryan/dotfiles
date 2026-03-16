/**
 * Background refinement phase 2: runs agents then amends the commit.
 */

import { basename } from 'path'
import { readRefineManifest, cleanupRefineManifest, saveWatermark } from '../lib/session-chain'
import { headSha, amendCommit, hasRemote, push } from '../lib/git'
import { runTitleAgent, runBodyAgent, runCondenseAgent, type AgentConfig } from './agent'
import { formatBody, formatTitleTranscript, extractHeadline, isHookFeedback, truncateHookFeedback, type TranscriptPair } from './transcript'
import { wrapText } from '../lib/wrap'
import { acquireLock, releaseLock } from './lock'
import { logCommitEvent } from '../lib/registry'

export interface RefineConfig {
  title?: AgentConfig
  body?: AgentConfig & { maxLineLength?: number; type?: string }
  condense?: AgentConfig & { minLength?: number; enabled?: boolean }
  autoPush?: boolean
}

export interface RefineManifest {
  root: string
  sha: string
  sessionId?: string
  config: RefineConfig
  effectivePairs: TranscriptPair[]
  continuation?: string
  pendingSections?: string[]
  coauthor?: string
  pairCount?: number
  branch?: string
}

/**
 * Condense verbose hook feedback in pairs via a summarizer agent.
 * Mutates pairs in place.
 */
export function condensePairs(root: string, config: RefineConfig, pairs: TranscriptPair[]): void {
  const condenseCfg = config.condense || {}
  const minLength = condenseCfg.minLength || 200
  for (const pair of pairs) {
    if (!isHookFeedback(pair.prompt) || pair.prompt.length < minLength) continue
    const summary = runCondenseAgent(root, condenseCfg, pair.prompt)
    pair.prompt = summary || truncateHookFeedback(pair.prompt)
  }
}

/**
 * Phase 2: background refine. Reads manifest, runs agents, amends commit.
 */
export function refine(manifestPath: string): void {
  const manifest = readRefineManifest(manifestPath) as RefineManifest | null
  if (!manifest) return

  const { root, sha, sessionId, config, effectivePairs, continuation,
    pendingSections, coauthor, pairCount } = manifest

  const project = basename(root)
  const branch = manifest.branch || 'unknown'

  if (!acquireLock(root, sha)) {
    logCommitEvent('refine-skip', { project, branch, reason: 'lock-timeout' })
    return
  }

  try {
    // Verify HEAD hasn't moved
    const currentHead = headSha(root)
    if (currentHead !== sha) {
      logCommitEvent('refine-skip', { project, branch, reason: 'head-moved' })
      return
    }

    const pairs = effectivePairs

    // Condense hook feedback if enabled
    if (config.condense?.enabled !== false) {
      condensePairs(root, config, pairs)
    }

    const formattedTranscript = formatBody(pairs)

    // Title: agent by default, transcript if opted out
    let headline: string | null = null
    if (config.title?.type !== 'transcript') {
      const titleTranscript = formatTitleTranscript(pairs)
      headline = runTitleAgent(root, config.title || {}, titleTranscript)
    }
    headline = headline || extractHeadline(pairs)

    // Body: structured summaries by default, transcript if opted out
    let body: string | null = null
    if (config.body?.type !== 'transcript') {
      body = runBodyAgent(root, config.body || {}, formattedTranscript)
    }
    body = body || formattedTranscript

    // Rebuild full body with continuation + pending sections
    let combinedBody: string
    if (pendingSections && pendingSections.length > 0) {
      combinedBody = (continuation || '') + '## Planning\n\n' +
        pendingSections.join('\n\n---\n\n') +
        '\n\n## Implementation\n\n' + body
    } else {
      combinedBody = (continuation || '') + body
    }

    const wrappedBody = wrapText(combinedBody, config.body?.maxLineLength)
    const tag = coauthor ? '\n\n' + coauthor : ''

    const newSha = amendCommit(root, headline, wrappedBody + tag)

    if (sessionId) {
      saveWatermark(root, sessionId, pairCount || pairs.length, newSha)
    }

    if (config.autoPush && hasRemote(root)) {
      try {
        push(root)
      } catch {
        logCommitEvent('push-fail', { project, branch })
      }
    }

    logCommitEvent('refine-success', { project, branch, title: headline })
  } catch {
    logCommitEvent('refine-fail', { project, branch })
  } finally {
    cleanupRefineManifest(manifestPath)
    releaseLock(root)
  }
}

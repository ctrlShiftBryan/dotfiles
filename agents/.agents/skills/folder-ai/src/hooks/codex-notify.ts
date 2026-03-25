/**
 * Codex CLI notify handler for auto-commits.
 * Codex passes JSON as argv[1] (not stdin like Claude Code).
 */

import { gitRoot } from '../lib/git'
import { resolveConfig } from '../lib/config'
import { readWatermark } from '../lib/session-chain'
import { parseCodexMessages } from '../commit/transcript'
import { commitCore } from './stop'
import { join } from 'path'
import { homedir } from 'os'
import { existsSync, readFileSync } from 'fs'

/**
 * Read the top-level `model` value from ~/.codex/config.toml.
 * Simple line-based extraction — no TOML parser needed.
 */
function readCodexModel(): string | null {
  const configPath = join(homedir(), '.codex', 'config.toml')
  try {
    const content = readFileSync(configPath, 'utf8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      // Stop at first table header — only want root-level model
      if (trimmed.startsWith('[')) break
      const match = trimmed.match(/^model\s*=\s*"([^"]+)"/)
      if (match) return match[1]
    }
  } catch {}
  return null
}

/**
 * Handle Codex CLI notify event.
 * Called with JSON payload as first argument (argv[1]).
 */
export function handleCodexNotify(jsonArg: string): void {
  if (process.env.FOLDERAI_DISABLED) return
  if (existsSync(join(homedir(), '.folder-ai', 'disabled'))) return

  let payload: any
  try {
    payload = JSON.parse(jsonArg)
  } catch {
    return
  }

  if (payload.type !== 'agent-turn-complete') return

  const cwd = payload.cwd || process.cwd()
  const root = gitRoot(cwd)
  if (!root) return

  const config = resolveConfig(root)
  if (!config.enabled) return

  const pairs = parseCodexMessages(payload)
  if (pairs.length === 0) return

  // Use thread-id for watermark tracking across turns
  const sessionId = payload['thread-id'] || null

  const watermark = sessionId ? readWatermark(root, sessionId) : null
  const newPairs = watermark ? pairs.slice(watermark.pairs) : pairs
  const effectivePairs = newPairs.length > 0 ? newPairs : pairs

  const model = readCodexModel()

  commitCore({
    root,
    config,
    sessionId,
    effectivePairs,
    allPairsCount: pairs.length,
    transcriptPath: null,
    agent: 'codex',
    model
  })
}

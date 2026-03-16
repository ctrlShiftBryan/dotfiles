import { ensureDir } from '../lib/io'
import { gitDir } from '../lib/git'
import { join, dirname } from 'path'
import { appendFileSync, readFileSync, unlinkSync } from 'fs'

const FILE_PATH_KEYS = ['file_path', 'filePath', 'path', 'file', 'notebook_path']

/** Directory under .git where folder-ai stores tracking state */
export function trackingDir(root: string): string {
  const dir = gitDir(root)
  return join(dir || join(root, '.git'), 'folder-ai', 'tracking')
}

export function trackingPath(root: string, sessionId: string): string {
  return join(trackingDir(root), sessionId + '.jsonl')
}

/** Extract a file path from tool_input, probing known keys */
export function extractFilePath(toolInput: Record<string, any> | null): string | null {
  if (!toolInput || typeof toolInput !== 'object') return null
  for (const key of FILE_PATH_KEYS) {
    if (typeof toolInput[key] === 'string' && toolInput[key].length > 0) {
      return toolInput[key]
    }
  }
  return null
}

/**
 * PreToolUse handler. Appends a tracking entry for potentially-modifying tools.
 * Always returns void (never blocks tool execution).
 */
export function handleTrack(input: string, root: string): void {
  if (!root) return

  let hookInput: any
  try {
    hookInput = JSON.parse(input)
  } catch {
    return
  }

  const sessionId = hookInput.session_id
  if (!sessionId) return

  const toolName = hookInput.tool_name
  if (!toolName) return

  const toolInput = hookInput.tool_input || {}

  const entry: Record<string, any> = { tool: toolName, t: Date.now() }

  // Extract file path for file-modifying tools
  const filePath = extractFilePath(toolInput)
  if (filePath) {
    entry.file = filePath
  }

  // For Bash, record the command
  if (toolName === 'Bash' && typeof toolInput.command === 'string') {
    entry.command = toolInput.command
  }

  // Skip Bash with no command (malformed input). All other non-Bash tools
  // passed the PreToolUse matcher, so they're known modifying tools even if
  // we can't extract a specific file path (e.g. MultiEdit nests paths in edits[]).
  if (toolName === 'Bash' && typeof toolInput.command !== 'string') return

  const file = trackingPath(root, sessionId)
  ensureDir(dirname(file))
  appendFileSync(file, JSON.stringify(entry) + '\n')
}

/**
 * Check whether a session has tracked any file-modifying tool calls.
 * Bash entries alone don't count -- too noisy (ls, git status, etc.)
 * The definitive signal comes from Write/Edit/NotebookEdit/MCP tools.
 */
export function hasTrackedModifications(root: string, sessionId: string): boolean {
  const file = trackingPath(root, sessionId)
  try {
    const data = readFileSync(file, 'utf8')
    if (!data) return false
    const lines = data.trim().split('\n')
    return lines.some(line => {
      try {
        const entry = JSON.parse(line)
        return entry.tool !== 'Bash'
      } catch {
        return false
      }
    })
  } catch {
    return false
  }
}

/** Delete tracking file after commit or cleanup */
export function cleanupTracking(root: string, sessionId: string): void {
  try {
    unlinkSync(trackingPath(root, sessionId))
  } catch {}
}

/** CLI entry point — resolves git root and delegates to handleTrack */
export function handlePreToolUseHook(input: string): void {
  const { gitRoot } = require('../lib/git') as typeof import('../lib/git')
  const root = gitRoot()
  if (root) handleTrack(input, root)
}

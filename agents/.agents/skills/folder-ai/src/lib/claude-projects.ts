import { join, basename } from 'path'
import { homedir } from 'os'
import { readFile, listDir, exists, loadJson, fileMtime } from './io'

const CLAUDE_PROJECTS_DIR = join(homedir(), '.claude', 'projects')

/** Encode a path for Claude Code's project directory naming: /Users/foo → -Users-foo */
export function encodePath(p: string): string {
  return p.replace(/\//g, '-')
}

/** Decode a Claude Code project dir name back to path: -Users-foo → /Users/foo */
export function decodePath(encoded: string): string {
  // First char is always '-' representing leading '/'
  if (!encoded.startsWith('-')) return encoded
  return encoded.replace(/-/g, '/')
}

/** Get the Claude projects directory for a workspace path */
export function projectDir(workspacePath: string): string {
  return join(CLAUDE_PROJECTS_DIR, encodePath(workspacePath))
}

export interface SessionMetrics {
  cost_usd: number
  session_duration_ms: number
  model?: string
  tokens?: Record<string, number>
}

export interface SessionInfo {
  id: string
  jsonlPath: string
  metricsPath: string
  summaryPath: string
  hasMetrics: boolean
  hasSummary: boolean
  metrics: SessionMetrics | null
  status: 'completed' | 'abandoned' | 'active' | 'empty' | 'worker'
}

/** Known folder-ai prompt prefixes (from agent.ts templates) */
const FOLDER_AI_PROMPT_PREFIXES = [
  'You have 10 seconds. Write a single-line git commit headline',
  'Given this transcript of a coding session, write summaries',
  'Summarize this coding session. Focus on WHAT was accomplished',
  'Review these git commits from one coding session',
  'Summarize this CI/build/lint output in 2-4 sentences',
  'Summarize what was accomplished in 1-2 sentences',
  'Summarize this coding session in 2-3 lines',
]

/** Check if a session is a worker/automation session (queue-operation or folder-ai spawned) */
function isWorkerSession(jsonlPath: string): boolean {
  const content = readFile(jsonlPath)
  if (!content) return false
  const lines = content.split('\n').filter(Boolean)
  const firstLine = lines[0]
  if (!firstLine) return false
  try {
    const entry = JSON.parse(firstLine)
    // queue-operation type (turbocommit workers)
    if (entry.type === 'queue-operation') return true
  } catch {
    return false
  }

  // Check for folder-ai spawned sessions: haiku model + matches prompt templates
  let model: string | null = null
  let firstUserContent: string | null = null
  let userTurns = 0

  for (const line of lines) {
    try {
      const entry = JSON.parse(line)
      if (entry.type === 'assistant' && entry.message?.model && !model) {
        model = entry.message.model
      }
      if (entry.type === 'user' && typeof entry.message?.content === 'string') {
        userTurns++
        if (!firstUserContent) firstUserContent = entry.message.content
      }
    } catch { continue }
  }

  // Structural match: haiku model + single user turn + prompt matches folder-ai template
  if (model?.includes('haiku') && userTurns <= 2 && firstUserContent) {
    for (const prefix of FOLDER_AI_PROMPT_PREFIXES) {
      if (firstUserContent.startsWith(prefix)) return true
    }
  }

  return false
}

/** Get first event timestamp from JSONL */
export function getSessionStart(jsonlPath: string): string | null {
  const content = readFile(jsonlPath)
  if (!content) return null
  const firstLine = content.split('\n')[0]
  if (!firstLine) return null
  try {
    const entry = JSON.parse(firstLine)
    return entry.timestamp || entry.ts || null
  } catch {
    return null
  }
}

/** Get last event timestamp from JSONL */
export function getSessionEnd(jsonlPath: string): string | null {
  const content = readFile(jsonlPath)
  if (!content) return null
  const lines = content.trim().split('\n')
  for (let i = lines.length - 1; i >= 0; i--) {
    if (!lines[i]) continue
    try {
      const entry = JSON.parse(lines[i])
      if (entry.timestamp || entry.ts) return entry.timestamp || entry.ts
    } catch {
      continue
    }
  }
  return null
}

/** Extract model from JSONL transcript (first assistant entry) */
export function extractModelFromJsonl(jsonlPath: string): string | null {
  const content = readFile(jsonlPath)
  if (!content) return null
  for (const line of content.split('\n')) {
    if (!line.trim()) continue
    try {
      const entry = JSON.parse(line)
      if (entry.type === 'assistant' && entry.message?.model) {
        return entry.message.model
      }
    } catch {
      continue
    }
  }
  return null
}

/** Read session-memory/summary.md if available */
export function readSessionMemorySummary(sessionDir: string): string | null {
  const summaryPath = join(sessionDir, 'session-memory', 'summary.md')
  return readFile(summaryPath)
}

/** Extract title from session-memory summary.md */
export function extractSummaryTitle(summaryContent: string): string | null {
  const lines = summaryContent.split('\n')
  for (const line of lines) {
    const match = line.match(/^#\s+(.+)/)
    if (match) return match[1].trim()
  }
  return null
}

/** Scan a Claude projects directory for all sessions */
export function scanSessions(workspacePath: string, staleTimeoutMs = 7200000): SessionInfo[] {
  const dir = projectDir(workspacePath)
  if (!exists(dir)) return []

  const files = listDir(dir)
  const jsonlFiles = files.filter(f => f.endsWith('.jsonl'))
  const sessions: SessionInfo[] = []

  for (const jsonlFile of jsonlFiles) {
    const id = jsonlFile.replace('.jsonl', '')
    const jsonlPath = join(dir, jsonlFile)
    const metricsPath = join(dir, `${id}.metrics.json`)
    const summaryDir = join(dir, id)
    const summaryPath = join(summaryDir, 'session-memory', 'summary.md')
    const hasMetrics = exists(metricsPath)
    const hasSummary = exists(summaryPath)

    // Check for worker sessions
    if (isWorkerSession(jsonlPath)) {
      sessions.push({
        id, jsonlPath, metricsPath, summaryPath,
        hasMetrics, hasSummary,
        metrics: null,
        status: 'worker'
      })
      continue
    }

    let metrics: SessionMetrics | null = null
    let status: SessionInfo['status'] = 'active'

    if (hasMetrics) {
      metrics = loadJson<SessionMetrics>(metricsPath)
      if (metrics && metrics.cost_usd === 0) {
        status = 'empty'
      } else {
        status = 'completed'
      }
    } else {
      // No metrics — check if stale
      const mtime = fileMtime(jsonlPath)
      if (mtime > 0) {
        const age = Date.now() - mtime
        if (age > staleTimeoutMs) {
          status = 'abandoned'
        }
      }
    }

    sessions.push({
      id, jsonlPath, metricsPath, summaryPath,
      hasMetrics, hasSummary, metrics, status
    })
  }

  return sessions
}

/** List all project directories in ~/.claude/projects/ */
export function listClaudeProjects(): { encoded: string; decoded: string; path: string }[] {
  if (!exists(CLAUDE_PROJECTS_DIR)) return []
  return listDir(CLAUDE_PROJECTS_DIR)
    .filter(d => d.startsWith('-'))
    .map(d => ({
      encoded: d,
      decoded: decodePath(d),
      path: join(CLAUDE_PROJECTS_DIR, d)
    }))
}

/** Extract first user prompt (string content, not tool_result arrays) */
export function extractFirstUserPrompt(jsonlPath: string): string | null {
  const content = readFile(jsonlPath)
  if (!content) return null
  for (const line of content.split('\n')) {
    if (!line.trim()) continue
    try {
      const entry = JSON.parse(line)
      if (entry.type === 'user' && typeof entry.message?.content === 'string') {
        return entry.message.content
      }
    } catch {
      continue
    }
  }
  return null
}

/** Extract last assistant text block */
export function extractLastAssistantText(jsonlPath: string): string | null {
  const content = readFile(jsonlPath)
  if (!content) return null
  const lines = content.trim().split('\n')
  for (let i = lines.length - 1; i >= 0; i--) {
    if (!lines[i]) continue
    try {
      const entry = JSON.parse(lines[i])
      if (entry.type === 'assistant' && Array.isArray(entry.message?.content)) {
        for (const block of entry.message.content) {
          if (block.type === 'text' && block.text) return block.text
        }
      }
    } catch {
      continue
    }
  }
  return null
}

export interface SessionStats {
  userTurns: number
  assistantTurns: number
  toolCalls: Record<string, number>
  filesModified: string[]
}

/** Single-pass extraction of session stats from JSONL */
export function extractSessionStats(jsonlPath: string): SessionStats | null {
  const content = readFile(jsonlPath)
  if (!content) return null

  let userTurns = 0
  let assistantTurns = 0
  const toolCalls: Record<string, number> = {}
  const filesModified = new Set<string>()

  for (const line of content.split('\n')) {
    if (!line.trim()) continue
    try {
      const entry = JSON.parse(line)
      if (entry.type === 'user' && typeof entry.message?.content === 'string') {
        userTurns++
      } else if (entry.type === 'assistant' && Array.isArray(entry.message?.content)) {
        let hasText = false
        for (const block of entry.message.content) {
          if (block.type === 'text') hasText = true
          if (block.type === 'tool_use' && block.name) {
            toolCalls[block.name] = (toolCalls[block.name] || 0) + 1
            // Track files from Edit/Write tools
            if ((block.name === 'Edit' || block.name === 'Write') && block.input?.file_path) {
              filesModified.add(block.input.file_path)
            }
          }
        }
        if (hasText) assistantTurns++
      }
    } catch {
      continue
    }
  }

  return { userTurns, assistantTurns, toolCalls, filesModified: [...filesModified] }
}

/**
 * Format model ID to friendly name.
 * claude-opus-4-6 → Claude Opus 4.6
 */
export function formatModelName(modelId: string | null): string | null {
  if (!modelId) return null
  const stripped = modelId.replace(/^claude-/, '')
  if (stripped === modelId) return modelId
  const withoutDate = stripped.replace(/-\d{8}$/, '')
  const parts = withoutDate.split('-')
  const alpha = parts.filter(p => /^[a-z]+$/i.test(p))
  const numeric = parts.filter(p => /^\d+$/.test(p))
  if (alpha.length === 0 || numeric.length === 0) return modelId
  const tier = alpha.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  const version = numeric.join('.')
  return `Claude ${tier} ${version}`
}

/**
 * Format OpenAI model ID to friendly name.
 * gpt-5.4 → GPT-5.4, o3 → O3
 */
export function formatOpenAIModelName(modelId: string): string {
  return modelId.replace(/^gpt-/i, 'GPT-').replace(/^o(\d)/, 'O$1')
}

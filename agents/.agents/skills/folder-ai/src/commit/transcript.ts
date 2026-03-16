/**
 * JSONL transcript parsing for commit message generation.
 */

import { readFile, exists } from '../lib/io'

export interface TranscriptPair {
  prompt: string
  response: string
}

/**
 * Parse a JSONL transcript file into prompt/response pairs.
 */
export function parseTranscript(filePath: string): TranscriptPair[] {
  if (!filePath || !exists(filePath)) return []

  const content = readFile(filePath)
  if (!content) return []

  const lines = content.split('\n')
  const pairs: TranscriptPair[] = []
  let prompt: string | null = null
  let response = ''

  for (const line of lines) {
    if (!line.trim()) continue
    let entry: any
    try {
      entry = JSON.parse(line)
    } catch {
      continue
    }

    if (entry.type === 'user' && typeof entry.message?.content === 'string') {
      if (prompt !== null) {
        pairs.push({ prompt, response })
      }
      prompt = entry.message.content
      response = ''
    } else if (entry.type === 'assistant' && Array.isArray(entry.message?.content)) {
      const hasToolUse = entry.message.content.some((b: any) => b.type === 'tool_use')
      if (hasToolUse) continue
      const texts = entry.message.content
        .filter((b: any) => b.type === 'text')
        .map((b: any) => b.text)
      response += texts.join('')
    }
  }

  if (prompt !== null) {
    pairs.push({ prompt, response })
  }

  return pairs
}

/**
 * Format a single prompt/response pair.
 */
export function formatPair(p: TranscriptPair): string {
  return `Prompt:\n${p.prompt}\n\nResponse:\n${p.response}`
}

/**
 * Format prompt/response pairs into a commit body.
 */
export function formatBody(pairs: TranscriptPair[]): string {
  if (pairs.length === 0) return '(no transcript)'
  return pairs.map(formatPair).join('\n\n---\n\n')
}

/**
 * Format a condensed transcript for title generation.
 * Returns full transcript when it fits within budget, otherwise
 * samples first, middle, and last pairs with gap markers.
 */
export function formatTitleTranscript(pairs: TranscriptPair[], budget: number = 20000): string {
  if (pairs.length === 0) return '(no transcript)'

  const full = formatBody(pairs)
  if (full.length <= budget) return full

  const sep = '\n\n---\n\n'
  const cap = (text: string, max: number): string =>
    text.length > max ? text.slice(0, max) + '...' : text
  const fmt = (p: TranscriptPair): string =>
    `Prompt:\n${cap(p.prompt, 500)}\n\nResponse:\n${cap(p.response, 2000)}`

  // Pick first, middle, and last — deduplicated and in order
  const indices = [...new Set([0, Math.floor(pairs.length / 2), pairs.length - 1])]

  const parts: string[] = []
  let prev = -1
  for (const i of indices) {
    const skipped = i - prev - 1
    if (skipped > 0) parts.push(`[... ${skipped} turns omitted ...]`)
    parts.push(fmt(pairs[i]))
    prev = i
  }

  return parts.join(sep)
}

/**
 * Extract a headline from the last user prompt.
 * Falls back to a timestamped default.
 */
export function extractHeadline(pairs: TranscriptPair[]): string {
  if (pairs.length === 0) return fallbackHeadline()
  const lastPrompt = pairs[pairs.length - 1].prompt
  if (!lastPrompt) return fallbackHeadline()
  const firstLine = lastPrompt.split('\n')[0]
  return firstLine.slice(0, 72) || fallbackHeadline()
}

/**
 * Timestamped default headline.
 */
export function fallbackHeadline(): string {
  const now = new Date()
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `auto-commit ${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
}

/**
 * Extract the model ID from the first assistant entry in a JSONL transcript.
 */
export function extractModel(filePath: string): string | null {
  if (!filePath || !exists(filePath)) return null

  const content = readFile(filePath)
  if (!content) return null

  const lines = content.split('\n')
  for (const line of lines) {
    if (!line.trim()) continue
    let entry: any
    try {
      entry = JSON.parse(line)
    } catch {
      continue
    }
    if (entry.type === 'assistant' && entry.message?.model) {
      return entry.message.model
    }
  }
  return null
}

/**
 * Returns true if text is hook feedback from Claude Code's stop hook.
 */
export function isHookFeedback(text: string): boolean {
  return typeof text === 'string' && text.startsWith('Stop hook feedback:\n')
}

/**
 * Truncate hook feedback to the first N lines plus a marker.
 */
export function truncateHookFeedback(text: string, maxLines: number = 4): string {
  const lines = text.split('\n')
  if (lines.length <= maxLines) return text
  return lines.slice(0, maxLines).join('\n') + `\n[... ${lines.length - maxLines} lines truncated]`
}

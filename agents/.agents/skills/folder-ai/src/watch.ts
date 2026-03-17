#!/usr/bin/env bun

import { readRegistry, logEvent } from './lib/registry'
import { scanSessions, readSessionMemorySummary, extractSummaryTitle, extractModelFromJsonl, getSessionStart, getSessionEnd, extractFirstUserPrompt, extractLastAssistantText, extractSessionStats, type SessionInfo } from './lib/claude-projects'
import { resolveConfig } from './lib/config'
import { sessionFileMd, sessionsIndexRow, type SessionFileData } from './lib/templates'
import { gitLog, gitRoot } from './lib/git'
import { parseRepositoriesMd } from './lib/repos'
import { join, basename, dirname } from 'path'
import { exists, writeFile, appendToFile, ensureDir, listDir, removeFile, readFile } from './lib/io'
import { tryRun } from './lib/io'

export async function runWatcher(backfill = false): Promise<void> {
  const entries = readRegistry()
  if (entries.length === 0) return

  let processed = 0

  for (const entry of entries) {
    const projectPath = entry.path
    const config = resolveConfig(projectPath)
    if (!config.enabled) continue

    // Ensure project is a git repo
    if (!gitRoot(projectPath)) {
      tryRun('git init', { cwd: projectPath })
    }

    // Ensure sessions directory exists
    const sessionsDir = join(projectPath, 'sessions')
    ensureDir(sessionsDir)

    // Scan Claude Code sessions for this project
    const sessions = scanSessions(projectPath, config.staleTimeoutMs)

    for (const session of sessions) {
      // Skip workers, empty, and active sessions
      if (session.status === 'worker' || session.status === 'empty' || session.status === 'active') continue

      // Skip if already processed (check both old uuid.md and new timestamped format)
      const shortId = session.id.slice(0, 8)
      const oldPath = join(sessionsDir, `${session.id}.md`)
      const alreadyExists = exists(oldPath) || listDir(sessionsDir).some(f => f.includes(shortId) && f.endsWith('.md'))
      if (alreadyExists && !backfill) continue

      // Process completed or abandoned sessions
      const data = buildSessionData(session, projectPath, config)
      if (!data) continue

      // Build timestamped filename: YYYY-MM-DD-HHMM-{shortId}.md
      const ts = new Date(data.startedAt)
      const yyyy = ts.getFullYear()
      const mm = String(ts.getMonth() + 1).padStart(2, '0')
      const dd = String(ts.getDate()).padStart(2, '0')
      const hh = String(ts.getHours()).padStart(2, '0')
      const min = String(ts.getMinutes()).padStart(2, '0')
      const sessionMdPath = join(sessionsDir, `${yyyy}-${mm}-${dd}-${hh}${min}-${shortId}.md`)

      // Remove old-format file if backfilling
      if (backfill && exists(oldPath)) {
        removeFile(oldPath)
      }

      // Write session .md file
      writeFile(sessionMdPath, sessionFileMd(data))

      // Update sessions.md index
      const indexFile = join(sessionsDir, 'sessions.md')
      if (exists(indexFile)) {
        const date = data.startedAt.slice(0, 10)
        const shortId = session.id.slice(0, 8)
        const note = (data.summary || '').split('\n')[0].slice(0, 80)
        const costStr = data.cost != null ? `$${data.cost.toFixed(4)}` : ''
        appendToFile(indexFile, sessionsIndexRow(date, shortId, data.status, data.issue || '', note))
      }

      logEvent(data.status === 'abandoned' ? 'abandoned' : 'summarized', {
        project: basename(projectPath),
        session: session.id,
        detail: (data.summary || '').split('\n')[0].slice(0, 60)
      })

      processed++
    }
  }

  if (processed > 0) {
    console.log(`Processed ${processed} sessions.`)
  }
}

export function readBindingIssue(sessionId: string, projectPath: string): string | null {
  const shortId = sessionId.slice(0, 8)
  const bindingPath = join(projectPath, 'session-issues', `${shortId}.md`)
  if (exists(bindingPath)) {
    const content = readFile(bindingPath)
    if (content) {
      const match = content.match(/^\*\*Issue:\*\*\s+(.+)$/m)
      if (match) return match[1].trim()
    }
  }
  return null
}

export function buildSessionData(session: SessionInfo, projectPath: string, config: any): SessionFileData | null {
  const shortId = session.id.slice(0, 8)

  // Read session-issue binding
  const issue = readBindingIssue(session.id, projectPath)

  // Get timestamps
  const startedAt = getSessionStart(session.jsonlPath) || new Date().toISOString()
  let endedAt: string | undefined

  if (session.metrics) {
    // Calculate end time from start + duration
    const startMs = new Date(startedAt).getTime()
    if (session.metrics.session_duration_ms) {
      endedAt = new Date(startMs + session.metrics.session_duration_ms).toISOString()
    }
  }
  if (!endedAt) {
    endedAt = getSessionEnd(session.jsonlPath) || undefined
  }

  // Get model
  const model = session.metrics?.model || extractModelFromSession(session)

  // Build summary using priority chain
  const summary = buildSummary(session, projectPath, startedAt, endedAt, config)

  // Build activity per-repo
  const activity = buildActivity(projectPath, startedAt, endedAt)

  // Extract prompt, outcome, stats from JSONL
  const prompt = extractFirstUserPrompt(session.jsonlPath)
  const lastText = extractLastAssistantText(session.jsonlPath)
  const outcome = lastText ? summarizeOutcome(lastText) : null
  const stats = extractSessionStats(session.jsonlPath)

  return {
    shortId,
    startedAt,
    endedAt,
    model,
    cost: session.metrics?.cost_usd,
    durationMs: session.metrics?.session_duration_ms,
    issue,
    status: session.status as 'completed' | 'abandoned',
    prompt,
    outcome,
    stats,
    summary,
    activity
  }
}

function extractModelFromSession(session: SessionInfo): string | null {
  return extractModelFromJsonl(session.jsonlPath)
}

/** Summary priority chain: session-memory > git > fallback */
function buildSummary(session: SessionInfo, projectPath: string, start: string, end?: string, _config?: any): string {
  // 1. Try session-memory/summary.md
  if (session.hasSummary) {
    const summaryDir = join(dirname(session.summaryPath), '..')
    const summaryContent = readSessionMemorySummary(summaryDir)
    if (summaryContent) {
      const title = extractSummaryTitle(summaryContent)
      if (title) return title
      const lines = summaryContent.split('\n').filter(l => l.trim() && !l.startsWith('#'))
      if (lines.length > 0) return lines.slice(0, 3).join(' ').slice(0, 200)
    }
  }

  // 2. Try git log
  const gitSummary = buildGitSummary(projectPath, start, end)
  if (gitSummary) return gitSummary

  // 3. Fallback
  return 'No code changes recorded.'
}

function buildGitSummary(projectPath: string, start: string, end?: string): string | null {
  const commits = gitLog(projectPath, start, end)
  if (!commits) return null

  const lines = commits.split('\n').filter(Boolean)
  const count = lines.length
  if (count === 0) return null

  const titles = lines.slice(0, 5).map(l => l.replace(/^[a-f0-9]+\s+/, '')).join(', ')
  return `${count} commits: ${titles}.`
}

function summarizeOutcome(_text: string): string | null {
  // LLM calls removed — was spawning claude -p sessions that caused cascade
  return null
}

function buildActivity(projectPath: string, start: string, end?: string): { name: string; detail: string }[] {
  const activity: { name: string; detail: string }[] = []

  // Workspace repo
  const wsName = basename(projectPath)
  const wsCommits = gitLog(projectPath, start, end)
  if (wsCommits) {
    const lines = wsCommits.split('\n').filter(Boolean)
    const titles = lines.slice(0, 5).map(l => l.replace(/^[a-f0-9]+\s+/, '')).join(', ')
    activity.push({ name: `${wsName} (workspace)`, detail: `${lines.length} commits: ${titles}.` })
  } else {
    activity.push({ name: `${wsName} (workspace)`, detail: 'No changes.' })
  }

  // Child repos
  const children = parseRepositoriesMd(projectPath)
  for (const child of children) {
    if (!exists(child.localPath)) continue
    const commits = gitLog(child.localPath, start, end)
    if (commits) {
      const lines = commits.split('\n').filter(Boolean)
      const titles = lines.slice(0, 5).map(l => l.replace(/^[a-f0-9]+\s+/, '')).join(', ')
      activity.push({ name: child.name, detail: `${lines.length} commits: ${titles}.` })
    } else {
      activity.push({ name: child.name, detail: 'No changes.' })
    }
  }

  return activity
}

/**
 * Update session .md from live JSONL during an active session.
 * Called from stop hook on each turn. No LLM calls — fast path only.
 */
export function updateLiveSession(sessionId: string, jsonlPath: string, projectPath: string): void {
  const shortId = sessionId.slice(0, 8)
  const sessionsDir = join(projectPath, 'sessions')
  ensureDir(sessionsDir)

  // Ensure project is a git repo
  if (!gitRoot(projectPath)) {
    tryRun('git init', { cwd: projectPath })
  }

  const startedAt = getSessionStart(jsonlPath) || new Date().toISOString()
  const endedAt = getSessionEnd(jsonlPath) || undefined
  const model = extractModelFromJsonl(jsonlPath)
  const prompt = extractFirstUserPrompt(jsonlPath)
  const stats = extractSessionStats(jsonlPath)

  // Read session-issue binding
  const issue = readBindingIssue(sessionId, projectPath)

  // Git summary from session timeframe
  const gitSummary = buildGitSummary(projectPath, startedAt, endedAt)
  const activity = buildActivity(projectPath, startedAt, endedAt)

  const data: SessionFileData = {
    shortId,
    startedAt,
    endedAt,
    model,
    issue,
    status: 'active',
    prompt,
    outcome: null, // skip LLM call for speed
    stats,
    summary: gitSummary || 'Session in progress.',
    activity
  }

  // Build timestamped filename
  const ts = new Date(startedAt)
  const yyyy = ts.getFullYear()
  const mm = String(ts.getMonth() + 1).padStart(2, '0')
  const dd = String(ts.getDate()).padStart(2, '0')
  const hh = String(ts.getHours()).padStart(2, '0')
  const min = String(ts.getMinutes()).padStart(2, '0')
  const sessionMdPath = join(sessionsDir, `${yyyy}-${mm}-${dd}-${hh}${min}-${shortId}.md`)

  writeFile(sessionMdPath, sessionFileMd(data))

  // No auto-commit — finalize commits the final version at session end
}

// If run directly
if (import.meta.main) {
  runWatcher().catch(e => {
    console.error(e)
    process.exitCode = 1
  })
}

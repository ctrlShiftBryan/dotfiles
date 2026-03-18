import { join, basename } from 'path'
import { readRegistry } from '../lib/registry'
import { scanSessions, extractFirstUserPrompt, extractModelFromJsonl, extractSessionStats } from '../lib/claude-projects'
import { exists, listDir, removeFile, readFile, writeFile } from '../lib/io'

/** Known folder-ai prompt prefixes */
const FOLDER_AI_PROMPT_PREFIXES = [
  'You have 10 seconds. Write a single-line git commit headline',
  'Given this transcript of a coding session, write summaries',
  'Summarize this coding session. Focus on WHAT was accomplished',
  'Review these git commits from one coding session',
  'Summarize this CI/build/lint output in 2-4 sentences',
  'Summarize what was accomplished in 1-2 sentences',
  'Summarize this coding session in 2-3 lines',
]

function isJunkSession(jsonlPath: string): boolean {
  const model = extractModelFromJsonl(jsonlPath)
  const prompt = extractFirstUserPrompt(jsonlPath)
  const stats = extractSessionStats(jsonlPath)

  // haiku model + <=2 user turns + 0 files modified + matches prompt template
  if (model?.includes('haiku') && stats && stats.userTurns <= 2 && stats.filesModified.length === 0 && prompt) {
    for (const prefix of FOLDER_AI_PROMPT_PREFIXES) {
      if (prompt.startsWith(prefix)) return true
    }
  }

  return false
}

export function cmdCleanup(dryRun = false): void {
  const entries = readRegistry()
  let totalRemoved = 0

  for (const entry of entries) {
    const sessionsDir = join(entry.path, 'sessions')
    if (!exists(sessionsDir)) continue

    const files = listDir(sessionsDir).filter(f => f.endsWith('.md') && f !== 'sessions.md')
    const removed: string[] = []

    // Scan sessions once per project (not per file)
    const sessions = scanSessions(entry.path)
    const sessionMap = new Map(sessions.map(s => [s.id.slice(0, 8), s]))

    for (const file of files) {
      // Extract shortId from filename (YYYY-MM-DD-HHMM-{shortId}.md)
      const match = file.match(/-([a-f0-9]{8})\.md$/)
      if (!match) continue
      const shortId = match[1]

      const session = sessionMap.get(shortId)

      if (session) {
        if (session.status === 'worker' || isJunkSession(session.jsonlPath)) {
          const filePath = join(sessionsDir, file)
          if (dryRun) {
            console.log(`  [dry-run] would remove: ${file}`)
          } else {
            removeFile(filePath)
          }
          removed.push(file)
        }
      }
    }

    if (removed.length > 0) {
      console.log(`${basename(entry.path)}: removed ${removed.length} junk session files`)
      totalRemoved += removed.length
    }
  }

  if (totalRemoved === 0) {
    console.log('No junk sessions found.')
  } else {
    console.log(`\nTotal: removed ${totalRemoved} junk session files`)

    // Rebuild sessions.md indexes
    if (!dryRun) {
      rebuildIndexes()
    }
  }
}

function rebuildIndexes(): void {
  const entries = readRegistry()
  for (const entry of entries) {
    const sessionsDir = join(entry.path, 'sessions')
    const indexPath = join(sessionsDir, 'sessions.md')
    if (!exists(indexPath)) continue

    const files = listDir(sessionsDir)
      .filter(f => f.endsWith('.md') && f !== 'sessions.md')
      .sort()

    const header = '# Sessions\n\n| Date | Session | Status | Issue | Note |\n|------|---------|--------|-------|------|\n'
    const rows: string[] = []

    for (const file of files) {
      const content = readFile(join(sessionsDir, file))
      if (!content) continue
      const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2})/)
      const idMatch = file.match(/-([a-f0-9]{8})\.md$/)
      if (!dateMatch || !idMatch) continue

      const statusMatch = content.match(/status:\s*(\w+)/)
      const status = statusMatch ? statusMatch[1] : 'unknown'

      // Extract first line of summary as note
      const summaryMatch = content.match(/## Summary\n\n(.+)/)
      const note = summaryMatch ? summaryMatch[1].slice(0, 80) : ''

      rows.push(`| ${dateMatch[1]} | ${idMatch[1]} | ${status} | | ${note} |`)
    }

    writeFile(indexPath, header + rows.join('\n') + '\n')
    console.log(`  Rebuilt index: ${indexPath}`)
  }
}

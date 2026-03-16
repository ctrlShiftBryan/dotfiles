import { formatModelName } from './claude-projects'

export function repositoriesMd(): string {
  return `# Repositories

## Strategy Definitions

| Strategy | Description |
|----------|-------------|
| trunk | Commit directly to main, no branching |
| worktree | Git worktree for changes, merge locally, no PR |
| pullrequest | Git worktree + create a pull request |

## Repos

| Repo | Local Path | Strategy | Notes |
|------|-----------|----------|-------|
| | | | |

> **Rule:** Always make sure main is up to date before starting work.
`
}

export function peopleMd(): string {
  return `# People

| Name | Role | Context |
|------|------|---------|
| | | |
`
}

export function learningsMd(): string {
  return `# Learnings

Accumulated knowledge for this project. Claude reads this every session and appends new entries when something noteworthy is discovered.

## Gotchas

## Patterns

## Architectural Decisions

## Debugging Insights

## TILs
`
}

export function issuesReadmeMd(): string {
  return `# Issues

Flexible issue tracking. Drop anything here:

- GitHub issue links or numbers
- JIRA tickets
- Notion page links
- Teams chat references
- Free-form task descriptions in markdown

No rigid format required. One file per issue or group however you prefer.
`
}

export function sessionsMd(): string {
  return `# Sessions

| Date | Session ID | Status | Cost | Issue | Notes |
|------|-----------|--------|------|-------|-------|
`
}

export function sessionsIndexRow(date: string, shortId: string, status: string, issue?: string, notes?: string): string {
  return `| ${date} | ${shortId} | ${status} | | ${issue || ''} | ${notes || ''} |\n`
}

export interface SessionFileData {
  shortId: string
  startedAt: string
  endedAt?: string
  model?: string | null
  cost?: number
  durationMs?: number
  issue?: string | null
  status: 'completed' | 'abandoned' | 'active'
  prompt?: string | null
  outcome?: string | null
  stats?: {
    userTurns: number
    assistantTurns: number
    toolCalls: Record<string, number>
    filesModified: string[]
  } | null
  summary?: string
  activity?: { name: string; detail: string }[]
}

/** New session file format — created AFTER session ends with real data */
export function sessionFileMd(data: SessionFileData): string {
  const modelName = data.model ? (formatModelName(data.model) || data.model) : 'unknown'
  const costStr = data.cost != null ? `$${Number(data.cost).toFixed(4)}` : 'unknown'
  const durationStr = data.durationMs ? `${(data.durationMs / 60000).toFixed(1)} min` : 'unknown'

  let md = `# Session ${data.shortId}

**Started:** ${data.startedAt}
`
  if (data.endedAt) {
    md += `**Ended:** ${data.endedAt}\n`
  }
  md += `**Model:** ${modelName}
**Cost:** ${costStr}
**Duration:** ${durationStr}
**Status:** ${data.status}
`
  if (data.issue) {
    md += `**Issue:** ${data.issue}\n`
  }

  // Prompt section
  if (data.prompt) {
    const truncated = data.prompt.length > 500 ? data.prompt.slice(0, 500) + '...' : data.prompt
    md += `\n## Prompt\n\n> ${truncated.split('\n').join('\n> ')}\n`
  }

  // Outcome section
  if (data.outcome) {
    md += `\n## Outcome\n\n${data.outcome}\n`
  }

  // Stats section
  if (data.stats) {
    const totalTools = Object.values(data.stats.toolCalls).reduce((a, b) => a + b, 0)
    md += `\n## Stats\n\n`
    md += `| Metric | Value |\n|--------|-------|\n`
    md += `| User turns | ${data.stats.userTurns} |\n`
    md += `| Assistant turns | ${data.stats.assistantTurns} |\n`
    md += `| Tool calls | ${totalTools} |\n`
    md += `| Files modified | ${data.stats.filesModified.length} |\n`

    // Tool usage breakdown
    const sorted = Object.entries(data.stats.toolCalls).sort((a, b) => b[1] - a[1])
    if (sorted.length > 0) {
      md += `\n### Tool Usage\n| Tool | Count |\n|------|-------|\n`
      for (const [tool, count] of sorted) {
        md += `| ${tool} | ${count} |\n`
      }
    }

    // Files modified list
    if (data.stats.filesModified.length > 0) {
      md += `\n### Files Modified\n`
      for (const f of data.stats.filesModified) {
        // Show just filename relative to home
        const short = f.replace(/^\/Users\/[^/]+\//, '~/')
        md += `- ${short}\n`
      }
    }
  }

  md += `\n## Summary\n\n${data.summary || 'No code changes recorded.'}\n`

  if (data.activity && data.activity.length > 0) {
    md += '\n## Activity\n\n'
    for (const act of data.activity) {
      md += `### ${act.name}\n${act.detail}\n\n`
    }
  }

  return md
}

export function claudeMdSection(version: string): string {
  return `
## folder-ai Context

> **folder-ai** is a Claude Code skill at \`~/.agents/skills/folder-ai/\`. Version: ${version}. Check with: \`bun ~/.agents/skills/folder-ai/src/cli.ts --version\`

| Context | File | When to read |
|---------|------|-------------|
| Repositories | repositories.md | Working with any repo, git operations |
| People | people.md | When someone is mentioned by name |
| Learnings | learnings.md | Every session start (read), when discovering something noteworthy (append) |
| Issues | issues/*.md | Current work items, task context |
| Sessions | sessions/sessions.md | Session history overview |
| Session detail | sessions/{id}.md | Specific session context |

**Repository rule:** Always make sure main is up to date before starting work.

**Commit rule:** Do NOT create git commits unless the user explicitly asks. folder-ai auto-commits via stop hooks on every turn.

**Strategies:**
- **trunk** — commit directly to main, no branching
- **worktree** — git worktree for changes, merge locally, no PR
- **pullrequest** — git worktree + create a pull request
`
}

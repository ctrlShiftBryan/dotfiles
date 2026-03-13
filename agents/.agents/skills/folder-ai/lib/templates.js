function repositoriesMd () {
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

function peopleMd () {
  return `# People

| Name | Role | Context |
|------|------|---------|
| | | |
`
}

function learningsMd () {
  return `# Learnings

Accumulated knowledge for this project. Claude reads this every session and appends new entries when something noteworthy is discovered.

## Gotchas

## Patterns

## Architectural Decisions

## Debugging Insights

## TILs
`
}

function issuesReadmeMd () {
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

function sessionsMd () {
  return `# Sessions

| Date | Session ID | Status | Cost | Notes |
|------|-----------|--------|------|-------|
`
}

function sessionFileMd (sessionId, model, timestamp) {
  return `# Session ${sessionId}

**Started:** ${timestamp}
**Model:** ${model || 'unknown'}
**Status:** active

## Log

Session initialized.
`
}

function sessionsIndexRow (date, shortId, status, notes) {
  return `| ${date} | ${shortId} | ${status} | | ${notes || ''} |\n`
}

function sessionCompleted (endTimestamp, cost, durationMs) {
  const durationMin = durationMs ? (durationMs / 60000).toFixed(1) : '?'
  const costStr = cost != null ? `$${Number(cost).toFixed(4)}` : '?'
  return `\n**Ended:** ${endTimestamp}\n**Cost:** ${costStr}\n**Duration:** ${durationMin} min\n**Status:** completed\n`
}

function claudeMdSection () {
  return `
## folder-ai Context

| Context | File | When to read |
|---------|------|-------------|
| Repositories | repositories.md | Working with any repo, git operations |
| People | people.md | When someone is mentioned by name |
| Learnings | learnings.md | Every session start (read), when discovering something noteworthy (append) |
| Issues | issues/*.md | Current work items, task context |
| Sessions | sessions/sessions.md | Session history overview |
| Session detail | sessions/{id}.md | Specific session context |

**Repository rule:** Always make sure main is up to date before starting work.

**Strategies:**
- **trunk** — commit directly to main, no branching
- **worktree** — git worktree for changes, merge locally, no PR
- **pullrequest** — git worktree + create a pull request
`
}

module.exports = {
  repositoriesMd,
  peopleMd,
  learningsMd,
  issuesReadmeMd,
  sessionsMd,
  sessionFileMd,
  sessionsIndexRow,
  sessionCompleted,
  claudeMdSection
}

const path = require('path')
const { ensureDir, writeFile, exists, readFile } = require('./io')
const t = require('./templates')

function createStructure (root) {
  ensureDir(path.join(root, 'sessions'))
  ensureDir(path.join(root, 'issues'))
  writeFile(path.join(root, 'issues', 'README.md'), t.issuesReadmeMd())
  if (!exists(path.join(root, 'sessions', 'sessions.md'))) {
    writeFile(path.join(root, 'sessions', 'sessions.md'), t.sessionsMd())
  }
}

function writeRepositories (root, repos) {
  let content = t.repositoriesMd()
  if (repos && repos.length > 0) {
    // Replace the empty row with actual repos
    const rows = repos.map(r =>
      `| ${r.name || ''} | ${r.path || ''} | ${r.strategy || 'trunk'} | ${r.notes || ''} |`
    ).join('\n')
    content = content.replace('| | | | |', rows)
  }
  writeFile(path.join(root, 'repositories.md'), content)
}

function writePeople (root, people) {
  let content = t.peopleMd()
  if (people && people.length > 0) {
    const rows = people.map(p =>
      `| ${p.name || ''} | ${p.role || ''} | ${p.context || ''} |`
    ).join('\n')
    content = content.replace('| | | |', rows)
  }
  writeFile(path.join(root, 'people.md'), content)
}

function writeLearnings (root) {
  if (!exists(path.join(root, 'learnings.md'))) {
    writeFile(path.join(root, 'learnings.md'), t.learningsMd())
  }
}

function appendClaudeMd (root) {
  const claudeMdPath = path.join(root, 'CLAUDE.md')
  const section = t.claudeMdSection()
  const marker = '## folder-ai Context'

  if (exists(claudeMdPath)) {
    const content = readFile(claudeMdPath)
    if (content && content.includes(marker)) {
      return { alreadyPresent: true }
    }
    writeFile(claudeMdPath, content + '\n' + section)
  } else {
    writeFile(claudeMdPath, '# CLAUDE.md\n' + section)
  }
  return { alreadyPresent: false }
}

function status (root) {
  const checks = {
    repositories: exists(path.join(root, 'repositories.md')),
    people: exists(path.join(root, 'people.md')),
    learnings: exists(path.join(root, 'learnings.md')),
    issues: exists(path.join(root, 'issues')),
    sessions: exists(path.join(root, 'sessions')),
    claudeMd: exists(path.join(root, 'CLAUDE.md'))
  }

  let sessionCount = 0
  let issueCount = 0

  if (checks.sessions) {
    const fs = require('fs')
    try {
      sessionCount = fs.readdirSync(path.join(root, 'sessions'))
        .filter(f => f.endsWith('.md') && f !== 'sessions.md').length
    } catch {}
  }

  if (checks.issues) {
    const fs = require('fs')
    try {
      issueCount = fs.readdirSync(path.join(root, 'issues'))
        .filter(f => f.endsWith('.md') && f !== 'README.md').length
    } catch {}
  }

  return { ...checks, sessionCount, issueCount }
}

module.exports = { createStructure, writeRepositories, writePeople, writeLearnings, appendClaudeMd, status }

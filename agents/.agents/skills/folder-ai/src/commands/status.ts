import { join } from 'path'
import { exists, listDir } from '../lib/io'
import { resolveConfig } from '../lib/config'
import { isRegistered } from '../lib/registry'
import { gitRoot } from '../lib/git'

export function cmdStatus(): void {
  const root = process.cwd()
  const config = resolveConfig(root)
  const git = gitRoot(root)

  const pkg = require('../../package.json')
  console.log(`folder-ai v${pkg.version} workspace status:`)
  console.log(`  git root:        ${git || 'none'}`)
  console.log(`  registered:      ${isRegistered(root) ? 'yes' : 'no'}`)
  console.log(`  repositories.md: ${exists(join(root, 'repositories.md')) ? 'yes' : 'no'}`)
  console.log(`  people.md:       ${exists(join(root, 'people.md')) ? 'yes' : 'no'}`)
  console.log(`  learnings.md:    ${exists(join(root, 'learnings.md')) ? 'yes' : 'no'}`)
  console.log(`  issues/:         ${exists(join(root, 'issues')) ? `yes (${listDir(join(root, 'issues')).filter(f => f.endsWith('.md') && f !== 'README.md').length} issues)` : 'no'}`)
  console.log(`  sessions/:       ${exists(join(root, 'sessions')) ? `yes (${listDir(join(root, 'sessions')).filter(f => f.endsWith('.md') && f !== 'sessions.md').length} sessions)` : 'no'}`)
  console.log(`  CLAUDE.md:       ${exists(join(root, 'CLAUDE.md')) ? 'yes' : 'no'}`)
  console.log(`  autocommit:      workspace=${config.autocommit.workspace}`)
  console.log(`  commitMode:      ${config.commitMode}`)
}

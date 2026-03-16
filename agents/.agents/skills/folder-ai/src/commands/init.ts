import { join } from 'path'
import { ensureDir, writeFile, exists, readFile } from '../lib/io'
import * as t from '../lib/templates'
import { registerProject } from '../lib/registry'

export function cmdInit(root?: string): void {
  root = root || process.cwd()

  // Create directories
  ensureDir(join(root, 'sessions'))
  ensureDir(join(root, 'issues'))

  // Create files (don't overwrite existing)
  const files = [
    { path: join(root, 'issues', 'README.md'), content: t.issuesReadmeMd(), overwrite: true },
    { path: join(root, 'sessions', 'sessions.md'), content: t.sessionsMd(), overwrite: false },
    { path: join(root, 'repositories.md'), content: t.repositoriesMd(), overwrite: false },
    { path: join(root, 'people.md'), content: t.peopleMd(), overwrite: false },
    { path: join(root, 'learnings.md'), content: t.learningsMd(), overwrite: false },
  ]

  for (const f of files) {
    if (!f.overwrite && exists(f.path)) continue
    writeFile(f.path, f.content)
  }

  // Append to CLAUDE.md
  appendClaudeMd(root)

  // Register project
  registerProject(root)

  console.log('folder-ai workspace initialized.')
  console.log(`  Root: ${root}`)
}

function appendClaudeMd(root: string): void {
  const claudeMdPath = join(root, 'CLAUDE.md')
  const section = t.claudeMdSection('1.0.0')
  const marker = '## folder-ai Context'

  if (exists(claudeMdPath)) {
    const content = readFile(claudeMdPath) || ''
    if (content.includes(marker)) return
    writeFile(claudeMdPath, content + '\n' + section)
  } else {
    writeFile(claudeMdPath, '# CLAUDE.md\n' + section)
  }
}

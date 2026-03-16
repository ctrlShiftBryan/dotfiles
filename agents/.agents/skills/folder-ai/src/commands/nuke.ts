import { join } from 'path'
import { rmSync, readdirSync } from 'fs'
import { execSync } from 'child_process'
import { exists } from '../lib/io'
import { unregisterProject, readRegistry, isRegistered } from '../lib/registry'
import { folderAiDir } from '../lib/session-chain'
import { cmdUninstall } from './install'

const SKILL_DIR = join(import.meta.dir, '..', '..')

interface NukeFlags {
  force: boolean
  remote: boolean
  dryRun: boolean
}

function parseFlags(argv: string[]): NukeFlags {
  return {
    force: argv.includes('--force') || argv.includes('-f'),
    remote: argv.includes('--remote'),
    dryRun: argv.includes('--dry-run') || argv.includes('-n'),
  }
}

function getGitRemote(): string | null {
  try {
    return execSync('git remote get-url origin', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
  } catch {
    return null
  }
}

function repoFromRemote(url: string): string | null {
  // git@github.com:user/repo.git or https://github.com/user/repo.git
  const m = url.match(/github\.com[:/](.+?)(?:\.git)?$/)
  return m ? m[1] : null
}

function countFiles(dir: string): number {
  try {
    let count = 0
    const entries = readdirSync(dir, { withFileTypes: true, recursive: true })
    for (const e of entries) if (e.isFile()) count++
    return count
  } catch {
    return 0
  }
}

export function cmdNuke(argv: string[]): void {
  const flags = parseFlags(argv)
  const projectDir = process.cwd()
  const prefix = flags.dryRun ? 'folder-ai nuke (dry run)' : 'folder-ai nuke'

  // Validate: must be a folder-ai project
  const hasJsonl = exists(join(projectDir, '.folder-ai.jsonl'))
  const registered = isRegistered(projectDir)
  if (!hasJsonl && !registered) {
    console.error('Not a folder-ai project (no .folder-ai.jsonl and not registered)')
    process.exitCode = 1
    return
  }

  // Detect GitHub remote
  const remote = getGitRemote()
  const repo = remote ? repoFromRemote(remote) : null

  // Confirmation
  if (!flags.force && !flags.dryRun) {
    const fileCount = countFiles(projectDir)
    console.log(`${prefix}: ${projectDir}`)
    console.log(`  ${fileCount} files will be deleted`)
    if (flags.remote && repo) console.log(`  GitHub repo ${repo} will be deleted`)
    const answer = prompt('Proceed? [y/N]')
    if (answer?.toLowerCase() !== 'y') {
      console.log('Aborted.')
      return
    }
  } else {
    console.log(`${prefix}: ${projectDir}`)
  }

  const log = (msg: string) => console.log(`  ${msg}`)

  // 1. Unregister
  if (flags.dryRun) {
    log('would unregister from watcher')
  } else {
    unregisterProject(projectDir)
    log('unregistered from watcher')
  }

  // 2. Remove .git/folder-ai/
  const stateDir = folderAiDir(projectDir)
  if (exists(stateDir)) {
    if (flags.dryRun) {
      log('would remove .git/folder-ai/')
    } else {
      try { rmSync(stateDir, { recursive: true, force: true }) } catch {}
      log('removed .git/folder-ai/')
    }
  }

  // 3. Auto-cleanup if last project
  const remaining = readRegistry()
  if (remaining.length === 0) {
    if (flags.dryRun) {
      log('would uninstall hooks (last project)')
      log('would remove cron watcher (last project)')
    } else {
      cmdUninstall()
      log('last project — uninstalled hooks')
      try {
        execSync(`bash "${SKILL_DIR}/scripts/install-cron.sh" uninstall`, { encoding: 'utf8', stdio: 'pipe' })
        log('last project — removed cron watcher')
      } catch {
        log('last project — cron removal failed (may not be installed)')
      }
    }
  } else {
    log(`${remaining.length} other project(s) still registered — hooks/cron kept`)
  }

  // 4. Delete project directory
  if (flags.dryRun) {
    log(`would delete ${projectDir}`)
  } else {
    try { rmSync(projectDir, { recursive: true, force: true }) } catch {}
    log(`deleted ${projectDir}`)
  }

  // 5. Delete GitHub repo (--remote only)
  if (flags.remote) {
    if (!repo) {
      log('no GitHub remote found — skipping repo deletion')
    } else if (flags.dryRun) {
      log(`would delete GitHub repo ${repo}`)
    } else {
      try {
        execSync(`gh repo delete ${repo} --yes`, { encoding: 'utf8', stdio: 'pipe' })
        log(`deleted GitHub repo ${repo}`)
      } catch (e: any) {
        log(`failed to delete GitHub repo: ${e.message}`)
      }
    }
  }

  if (!flags.dryRun) {
    console.log('Done. Run: cd ..')
  }
}

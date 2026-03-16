import { execSync } from 'child_process'
import { resolve, isAbsolute } from 'path'

export function git(args: string, opts: { cwd?: string } = {}): string {
  const cwd = opts.cwd || process.cwd()
  return execSync(`git ${args}`, {
    cwd,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  }).trimEnd()
}

export function gitRoot(cwd?: string): string | null {
  try {
    return git('rev-parse --show-toplevel', { cwd })
  } catch {
    return null
  }
}

export function gitDir(cwd?: string): string | null {
  try {
    const result = git('rev-parse --git-dir', { cwd })
    return isAbsolute(result) ? result : resolve(cwd || process.cwd(), result)
  } catch {
    return null
  }
}

export function hasChanges(cwd?: string): boolean {
  try {
    git('diff --quiet HEAD', { cwd })
  } catch {
    return true
  }
  try {
    git('diff --cached --quiet', { cwd })
  } catch {
    return true
  }
  const untracked = git('ls-files --others --exclude-standard', { cwd })
  return untracked.length > 0
}

export function addAndCommit(cwd: string, headline: string, body: string): string {
  git('add -A', { cwd })
  git(`commit -m "${esc(headline)}" -m "${esc(body)}" --no-verify`, { cwd })
  return git('rev-parse HEAD', { cwd })
}

export function amendCommit(cwd: string, headline: string, body: string): string {
  git('add -A', { cwd })
  git(`commit --amend -m "${esc(headline)}" -m "${esc(body)}" --no-verify`, { cwd })
  return git('rev-parse HEAD', { cwd })
}

export function hasCommits(cwd?: string): boolean {
  try {
    git('rev-parse HEAD', { cwd })
    return true
  } catch {
    return false
  }
}

export function currentBranch(cwd?: string): string {
  try {
    return git('branch --show-current', { cwd }) || 'HEAD'
  } catch {
    return 'HEAD'
  }
}

export function hasRemote(cwd?: string): boolean {
  try {
    return git('remote', { cwd }).length > 0
  } catch {
    return false
  }
}

export function headSha(cwd?: string): string {
  return git('rev-parse HEAD', { cwd })
}

export function push(cwd?: string): void {
  const branch = currentBranch(cwd)
  if (branch === 'HEAD') return
  git(`push origin ${branch}`, { cwd })
}

export function gitLog(cwd: string, since?: string, until?: string, maxCount = 20): string {
  const args = ['log', '--oneline']
  if (since) args.push(`--since="${since}"`)
  if (until) args.push(`--until="${until}"`)
  args.push(`-${maxCount}`)
  try {
    return git(args.join(' '), { cwd })
  } catch {
    return ''
  }
}

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\$/g, '\\$').replace(/`/g, '\\`')
}

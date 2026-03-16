import { readFile, exists } from './io'
import { join, basename } from 'path'
import { homedir } from 'os'
import { gitRoot } from './git'

export interface RepoEntry {
  name: string
  localPath: string
  strategy: string
  notes: string
}

/**
 * Parse repositories.md to extract child repo entries.
 * Expects a markdown table with columns: Repo | Local Path | Strategy | Notes
 */
export function parseRepositoriesMd(projectRoot: string): RepoEntry[] {
  const p = join(projectRoot, 'repositories.md')
  const content = readFile(p)
  if (!content) return []

  const lines = content.split('\n')
  const repos: RepoEntry[] = []

  // Find the Repos table (after "## Repos" header)
  let inTable = false
  let headerPassed = false

  for (const line of lines) {
    if (line.trim().startsWith('## Repos')) {
      inTable = true
      continue
    }
    if (!inTable) continue

    // Skip table header row
    if (line.includes('| Repo ') || line.includes('|---')) {
      headerPassed = true
      continue
    }
    if (!headerPassed) continue

    // Stop at next section
    if (line.startsWith('#')) break

    // Parse table row
    if (!line.includes('|')) continue
    const cells = line.split('|').map(c => c.trim()).filter(Boolean)
    if (cells.length < 2) continue

    const name = cells[0]
    const localPath = cells[1]
    if (!name || !localPath) continue

    repos.push({
      name,
      localPath: expandPath(localPath),
      strategy: cells[2] || 'trunk',
      notes: cells[3] || ''
    })
  }

  return repos
}

/** Expand ~ to homedir */
function expandPath(p: string): string {
  if (p.startsWith('~/') || p === '~') {
    return join(homedir(), p.slice(2))
  }
  return p
}

/** Get all repo paths that should be auto-committed (workspace + children) */
export function getCommitTargets(
  projectRoot: string,
  autocommitConfig: { workspace: boolean; children: Record<string, boolean> }
): { path: string; name: string; isWorkspace: boolean }[] {
  const targets: { path: string; name: string; isWorkspace: boolean }[] = []

  // Workspace repo
  if (autocommitConfig.workspace) {
    const root = gitRoot(projectRoot)
    if (root) {
      targets.push({ path: root, name: basename(root), isWorkspace: true })
    }
  }

  // Child repos
  const children = parseRepositoriesMd(projectRoot)
  for (const child of children) {
    const childPath = child.localPath
    // Check autocommit config — default to true if not explicitly set
    const enabled = autocommitConfig.children[childPath] ?? autocommitConfig.children[child.localPath] ?? true
    if (!enabled) continue
    if (!exists(childPath)) continue
    targets.push({ path: childPath, name: child.name, isWorkspace: false })
  }

  return targets
}

/** Map a file path to its owning repo (workspace or child) */
export function fileToRepo(
  filePath: string,
  projectRoot: string
): { path: string; name: string } | null {
  const children = parseRepositoriesMd(projectRoot)

  // Check children first (more specific paths)
  for (const child of children) {
    if (filePath.startsWith(child.localPath + '/') || filePath === child.localPath) {
      return { path: child.localPath, name: child.name }
    }
  }

  // Check workspace
  const root = gitRoot(projectRoot)
  if (root && (filePath.startsWith(root + '/') || filePath === root)) {
    return { path: root, name: basename(root) }
  }

  return null
}

/**
 * Session continuity: breadcrumbs, chains, watermarks, pending transcripts.
 * Port of turbocommit's session.js — state dir is .git/folder-ai/.
 */

import { join } from 'path'
import { ensureDir, readFile, writeFile, listDir, removeFile, removeDir, fileMtime, loadJson } from '../lib/io'
import { gitDir } from '../lib/git'

export const BREADCRUMB_THRESHOLD_MS = 2000
export const STALE_TTL_MS = 24 * 60 * 60 * 1000

// --- Directory helpers ---

export function folderAiDir(root: string): string {
  const dir = gitDir(root)
  return join(dir || join(root, '.git'), 'folder-ai')
}

export function breadcrumbDir(root: string): string {
  return join(folderAiDir(root), 'breadcrumbs')
}

export function chainDir(root: string): string {
  return join(folderAiDir(root), 'chains')
}

export function pendingDir(root: string): string {
  return join(folderAiDir(root), 'pending')
}

export function watermarkDir(root: string): string {
  return join(folderAiDir(root), 'watermarks')
}

export function refineDir(root: string): string {
  return join(folderAiDir(root), 'refine')
}

// --- Refine manifest ---

export function saveRefineManifest(root: string, sha: string, data: Record<string, any>): string {
  const dir = refineDir(root)
  ensureDir(dir)
  const p = join(dir, sha + '.json')
  writeFile(p, JSON.stringify(data) + '\n')
  return p
}

export function readRefineManifest(manifestPath: string): Record<string, any> | null {
  return loadJson(manifestPath)
}

export function cleanupRefineManifest(manifestPath: string): void {
  removeFile(manifestPath)
}

// --- Session lifecycle ---

export interface BreadcrumbData {
  session_id: string
  timestamp: number
}

export interface ChainData {
  parent: string
  ancestors: string[]
}

export interface WatermarkData {
  pairs: number
  commit: string
}

/**
 * SessionEnd handler. Writes a breadcrumb for the ending session.
 */
export function handleSessionEnd(input: string, root: string): void {
  if (!root) return

  let hookInput: any
  try {
    hookInput = JSON.parse(input)
  } catch {
    return
  }

  const sessionId = hookInput.session_id
  if (!sessionId) return

  const dir = breadcrumbDir(root)
  ensureDir(dir)
  const data: BreadcrumbData = { session_id: sessionId, timestamp: Date.now() }
  writeFile(join(dir, sessionId + '.json'), JSON.stringify(data) + '\n')
}

/**
 * SessionStart handler. Matches breadcrumbs for /clear and resume continuations.
 */
export function handleSessionStart(input: string, root: string): void {
  if (!root) return

  let hookInput: any
  try {
    hookInput = JSON.parse(input)
  } catch {
    return
  }

  const sessionId: string | undefined = hookInput.session_id
  if (!sessionId) return

  const source: string | undefined = hookInput.source
  if (source !== 'clear' && source !== 'resume') return

  const dir = breadcrumbDir(root)
  const files = listDir(dir)
  if (files.length === 0) return

  // Scan breadcrumbs for closest match
  const now = Date.now()
  let best: BreadcrumbData | null = null
  let bestGap = Infinity

  for (const file of files) {
    if (!file.endsWith('.json')) continue
    const data = loadJson<BreadcrumbData>(join(dir, file))
    if (!data) continue
    const gap = Math.abs(now - data.timestamp)
    if (gap < bestGap) {
      bestGap = gap
      best = data
    }
  }

  if (!best || bestGap > BREADCRUMB_THRESHOLD_MS) return

  // Claim the breadcrumb
  removeFile(join(dir, best.session_id + '.json'))

  // Read predecessor's chain to get full ancestry
  const predecessorChain = readChain(root, best.session_id)
  const ancestors = [best.session_id, ...(predecessorChain ? predecessorChain.ancestors : [])]

  // Write chain for this session
  const cDir = chainDir(root)
  ensureDir(cDir)
  const chain: ChainData = { parent: best.session_id, ancestors }
  writeFile(join(cDir, sessionId + '.json'), JSON.stringify(chain) + '\n')
}

// --- Chain ---

export function readChain(root: string, sessionId: string): ChainData | null {
  return loadJson<ChainData>(join(chainDir(root), sessionId + '.json'))
}

/**
 * Get ordered ancestor list for a session (nearest first).
 */
export function getAncestors(root: string, sessionId: string): string[] {
  const chain = readChain(root, sessionId)
  return chain ? chain.ancestors : []
}

// --- Pending ---

let pendingSeq = 0

/**
 * Save formatted transcript to pending directory for later pickup.
 */
export function savePending(root: string, sessionId: string, transcript: string): void {
  const dir = join(pendingDir(root), sessionId)
  ensureDir(dir)
  const timestamp = String(Date.now()) + '-' + String(pendingSeq++).padStart(4, '0')
  writeFile(join(dir, timestamp + '.txt'), transcript)
}

/**
 * Collect pending transcripts for a list of session IDs, in order
 * (oldest ancestor first). Returns array of strings.
 */
export function collectPending(root: string, sessionIds: string[]): string[] {
  const results: string[] = []
  for (const sid of sessionIds) {
    const dir = join(pendingDir(root), sid)
    const files = listDir(dir).sort()
    for (const file of files) {
      if (!file.endsWith('.txt')) continue
      const content = readFile(join(dir, file))
      if (content && content.trim()) results.push(content)
    }
  }
  return results
}

// --- Watermark ---

/**
 * Read watermark for a session. Returns { pairs, commit } or null.
 */
export function readWatermark(root: string, sessionId: string): WatermarkData | null {
  return loadJson<WatermarkData>(join(watermarkDir(root), sessionId + '.json'))
}

/**
 * Save watermark after a commit: pair count and commit SHA.
 */
export function saveWatermark(root: string, sessionId: string, pairs: number, commit: string): void {
  const dir = watermarkDir(root)
  ensureDir(dir)
  writeFile(join(dir, sessionId + '.json'), JSON.stringify({ pairs, commit } satisfies WatermarkData) + '\n')
}

/**
 * Resolve parent commit SHA for continuation references.
 * Checks own watermark first, then walks chain ancestors nearest-first.
 */
export function resolveParentCommit(root: string, sessionId: string): string | null {
  const own = readWatermark(root, sessionId)
  if (own) return own.commit

  const ancestors = getAncestors(root, sessionId)
  for (const aid of ancestors) {
    const wm = readWatermark(root, aid)
    if (wm) return wm.commit
  }
  return null
}

// --- Cleanup ---

/**
 * Delete consumed pending + chain files after commit.
 */
export function cleanupConsumed(root: string, sessionIds: string[]): void {
  for (const sid of sessionIds) {
    const dir = join(pendingDir(root), sid)
    const files = listDir(dir)
    for (const file of files) {
      removeFile(join(dir, file))
    }
    removeDir(dir)
  }
}

/**
 * Remove stale orphaned files older than maxAgeMs (default 24h).
 */
export function cleanupStale(root: string, maxAgeMs?: number): void {
  const ttl = maxAgeMs != null ? maxAgeMs : STALE_TTL_MS
  const now = Date.now()
  const base = folderAiDir(root)

  for (const sub of ['breadcrumbs', 'chains', 'tracking', 'watermarks', 'refine']) {
    const dir = join(base, sub)
    const files = listDir(dir)
    for (const file of files) {
      const fp = join(dir, file)
      const mtime = fileMtime(fp)
      if (mtime > 0 && now - mtime > ttl) {
        removeFile(fp)
      }
    }
  }

  // Clean stale pending directories
  const pDir = join(base, 'pending')
  const pdirs = listDir(pDir)
  for (const sid of pdirs) {
    const dir = join(pDir, sid)
    const mtime = fileMtime(dir)
    if (mtime > 0 && now - mtime > ttl) {
      const files = listDir(dir)
      for (const file of files) {
        removeFile(join(dir, file))
      }
      removeDir(dir)
    }
  }
}

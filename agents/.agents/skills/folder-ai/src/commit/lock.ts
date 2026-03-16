/**
 * Refine process locking to prevent concurrent amends.
 */

import { join, dirname } from 'path'
import { spawnSync } from 'child_process'
import { ensureDir, loadJson, removeFile, writeFile } from '../lib/io'
import { folderAiDir } from '../lib/session-chain'

export const STALE_AGE_MS = 5 * 60 * 1000 // 5 minutes

export interface LockData {
  pid: number
  sha: string
  started: number
}

/**
 * Path to the refine lock file.
 */
export function lockPath(root: string): string {
  return join(folderAiDir(root), 'refine.lock')
}

/**
 * Read the current lock data, or null if no lock exists.
 */
export function readLock(root: string): LockData | null {
  return loadJson<LockData>(lockPath(root))
}

/**
 * Check whether a lock is stale (>5 min or process dead).
 */
export function isLockStale(data: LockData): boolean {
  if (Date.now() - data.started > STALE_AGE_MS) return true
  try {
    process.kill(data.pid, 0)
    return false
  } catch {
    return true
  }
}

/**
 * Acquire the refine lock. Polls every 2s until timeout (default 60s).
 * Returns true if lock acquired, false on timeout.
 */
export function acquireLock(root: string, sha: string, timeoutMs: number = 60000): boolean {
  const lp = lockPath(root)
  const deadline = Date.now() + timeoutMs

  while (true) {
    const existing = readLock(root)
    if (existing && !isLockStale(existing)) {
      if (Date.now() >= deadline) return false
      spawnSync('sleep', ['2'])
      continue
    }

    // Stale or no lock — claim it
    ensureDir(dirname(lp))
    writeFile(lp, JSON.stringify({ pid: process.pid, sha, started: Date.now() } satisfies LockData) + '\n')
    return true
  }
}

/**
 * Release the refine lock.
 */
export function releaseLock(root: string): void {
  removeFile(lockPath(root))
}

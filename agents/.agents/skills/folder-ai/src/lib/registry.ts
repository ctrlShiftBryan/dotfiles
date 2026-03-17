import { join } from 'path'
import { homedir } from 'os'
import { ensureDir, readFile, writeFile, appendToFile, exists } from './io'

const FOLDER_AI_DIR = join(homedir(), '.folder-ai')
const REGISTRY_PATH = join(FOLDER_AI_DIR, 'registry.jsonl')
const EVENTS_PATH = join(FOLDER_AI_DIR, 'events.jsonl')

export interface RegistryEntry {
  path: string
  added: number
}

export function registryDir(): string {
  return FOLDER_AI_DIR
}

export function registryPath(): string {
  return REGISTRY_PATH
}

export function eventsPath(): string {
  return EVENTS_PATH
}

export function readRegistry(): RegistryEntry[] {
  const content = readFile(REGISTRY_PATH)
  if (!content) return []
  return content.trim().split('\n').filter(Boolean).map(line => {
    try {
      return JSON.parse(line) as RegistryEntry
    } catch {
      return null
    }
  }).filter((e): e is RegistryEntry => e !== null)
}

export function isRegistered(projectDir: string): boolean {
  return readRegistry().some(e => e.path === projectDir)
}

export function registerProject(projectDir: string): void {
  if (isRegistered(projectDir)) return
  ensureDir(FOLDER_AI_DIR)
  appendToFile(REGISTRY_PATH, JSON.stringify({ path: projectDir, added: Date.now() } satisfies RegistryEntry) + '\n')
}

export function unregisterProject(projectDir: string): void {
  if (!exists(REGISTRY_PATH)) return
  const entries = readRegistry().filter(e => e.path !== projectDir)
  writeFile(REGISTRY_PATH, entries.map(e => JSON.stringify(e)).join('\n') + (entries.length ? '\n' : ''))
}

export function logEvent(type: string, meta: Record<string, any> = {}): void {
  try {
    ensureDir(FOLDER_AI_DIR)
    const entry = { ts: new Date().toISOString(), type, ...meta }
    appendToFile(EVENTS_PATH, JSON.stringify(entry) + '\n')
  } catch {}
}

const MAX_REGISTRY_SIZE = 50

/** Remove entries where path no longer exists on disk */
export function pruneRegistry(): number {
  if (!exists(REGISTRY_PATH)) return 0
  const entries = readRegistry()
  const valid = entries.filter(e => exists(e.path))
  // Deduplicate by path
  const seen = new Set<string>()
  const deduped = valid.filter(e => {
    if (seen.has(e.path)) return false
    seen.add(e.path)
    return true
  })
  const removed = entries.length - deduped.length
  if (removed > 0) {
    writeFile(REGISTRY_PATH, deduped.map(e => JSON.stringify(e)).join('\n') + (deduped.length ? '\n' : ''))
  }
  if (deduped.length > MAX_REGISTRY_SIZE) {
    console.warn(`Warning: registry has ${deduped.length} entries (max recommended: ${MAX_REGISTRY_SIZE})`)
  }
  return removed
}

/** Log event to turbocommit-compatible path for commit events */
export function logCommitEvent(event: string, meta: Record<string, any> = {}): void {
  try {
    ensureDir(FOLDER_AI_DIR)
    const entry = { event, ...meta, title: meta.title || null, at: Date.now() }
    appendToFile(EVENTS_PATH, JSON.stringify(entry) + '\n')
  } catch {}
}

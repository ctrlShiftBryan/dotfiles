import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync, statSync, readdirSync, unlinkSync, rmdirSync, rmSync } from 'fs'
import { dirname } from 'path'
import { spawnSync, type SpawnSyncOptions } from 'child_process'

export function readStdin(): string {
  return readFileSync(0, 'utf8')
}

export function loadJson<T = any>(p: string): T | null {
  try {
    return JSON.parse(readFileSync(p, 'utf8'))
  } catch {
    return null
  }
}

export function writeJson(p: string, obj: unknown): void {
  ensureDir(dirname(p))
  writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8')
}

export function ensureDir(p: string): void {
  mkdirSync(p, { recursive: true })
}

export function readFile(p: string): string | null {
  try {
    return readFileSync(p, 'utf8')
  } catch {
    return null
  }
}

export function writeFile(p: string, content: string): void {
  ensureDir(dirname(p))
  writeFileSync(p, content, 'utf8')
}

export function appendToFile(p: string, content: string): void {
  ensureDir(dirname(p))
  appendFileSync(p, content, 'utf8')
}

export function exists(p: string): boolean {
  return existsSync(p)
}

export function fileSize(p: string): number {
  try {
    return statSync(p).size
  } catch {
    return 0
  }
}

export function listDir(p: string): string[] {
  try {
    return readdirSync(p)
  } catch {
    return []
  }
}

export function removeFile(p: string): void {
  try {
    unlinkSync(p)
  } catch {}
}

export function removeDir(p: string): void {
  try {
    rmdirSync(p)
  } catch {}
}

export function removeDirRecursive(p: string): void {
  try { rmSync(p, { recursive: true, force: true }) } catch {}
}

export function fileMtime(p: string): number {
  try {
    return statSync(p).mtimeMs
  } catch {
    return 0
  }
}

export interface RunResult {
  code: number
  signal: string | null
  stdout: string
  stderr: string
}

export function tryRun(cmd: string, opts: { cwd?: string; timeout?: number; input?: string; env?: Record<string, string | undefined> } = {}): RunResult {
  const { input, ...rest } = opts
  try {
    const r = spawnSync(cmd, {
      ...rest,
      ...(input != null ? { input } : {}),
      shell: true,
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024
    } as SpawnSyncOptions)
    return {
      code: r.status ?? (r.signal || r.error ? 1 : 0),
      signal: r.signal || null,
      stdout: (r.stdout as string) ?? '',
      stderr: (r.stderr as string) ?? ''
    }
  } catch {
    return { code: 1, signal: null, stdout: '', stderr: '' }
  }
}

export function mergeConfig<T extends Record<string, any>>(global: T, project: Partial<T>): T {
  const result = { ...global } as any
  for (const key of Object.keys(project)) {
    if (
      typeof result[key] === 'object' && result[key] !== null && !Array.isArray(result[key]) &&
      typeof project[key] === 'object' && project[key] !== null && !Array.isArray(project[key])
    ) {
      result[key] = { ...result[key], ...project[key] }
    } else {
      result[key] = project[key]
    }
  }
  return result
}

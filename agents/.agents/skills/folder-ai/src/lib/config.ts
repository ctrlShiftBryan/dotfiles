import { join } from 'path'
import { homedir } from 'os'
import { readFile, writeFile, appendToFile, exists, loadJson, mergeConfig } from './io'

export interface AutocommitConfig {
  workspace: boolean
  children: Record<string, boolean>
}

export interface TitleConfig {
  type?: 'agent' | 'transcript'
  command?: string
  prompt?: string
}

export interface BodyConfig {
  type?: 'agent' | 'transcript'
  command?: string
  prompt?: string
  maxLineLength?: number
}

export interface CondenseConfig {
  enabled?: boolean
  command?: string
  prompt?: string
  minLength?: number
}

export interface FolderAiConfig {
  enabled: boolean
  staleTimeoutMs: number
  summaryMode: 'session-memory' | 'git' | 'llm'
  commitMode: 'async' | 'sync'
  autoPush: boolean
  coauthor: boolean | string
  title: TitleConfig
  body: BodyConfig
  condense: CondenseConfig
  autocommit: AutocommitConfig
}

export const DEFAULT_CONFIG: FolderAiConfig = {
  enabled: true,
  staleTimeoutMs: 7200000,
  summaryMode: 'session-memory',
  commitMode: 'async',
  autoPush: false,
  coauthor: true,
  title: { type: 'agent', command: 'claude -p --model haiku' },
  body: {},
  condense: {},
  autocommit: { workspace: true, children: {} }
}

export function configPath(projectRoot: string): string {
  return join(projectRoot, '.folder-ai.jsonl')
}

export function globalConfigPath(): string {
  return join(homedir(), '.claude', 'folder-ai.json')
}

/** Read last line of .folder-ai.jsonl (newest config) */
export function readProjectConfig(projectRoot: string): Partial<FolderAiConfig> | null {
  const p = configPath(projectRoot)
  const content = readFile(p)
  if (!content) return null
  const lines = content.trim().split('\n').filter(Boolean)
  if (lines.length === 0) return null
  try {
    return JSON.parse(lines[lines.length - 1])
  } catch {
    return null
  }
}

export function writeProjectConfig(projectRoot: string, config: Partial<FolderAiConfig>): void {
  const p = configPath(projectRoot)
  // Append new config line (JSONL format - latest wins)
  const line = JSON.stringify(config) + '\n'
  if (exists(p)) {
    appendToFile(p, line)
  } else {
    writeFile(p, line)
  }
}

/** Read global config from ~/.claude/folder-ai.json */
export function readGlobalConfig(): Partial<FolderAiConfig> | null {
  return loadJson<Partial<FolderAiConfig>>(globalConfigPath())
}

/** Merge global + project config with defaults */
export function resolveConfig(projectRoot: string): FolderAiConfig {
  const global = readGlobalConfig() || {}
  const project = readProjectConfig(projectRoot) || {}
  const merged = mergeConfig(DEFAULT_CONFIG, mergeConfig(global as any, project as any))
  return merged as FolderAiConfig
}

/**
 * Migrate turbocommit config to folder-ai format.
 * Reads .claude/turbocommit.json and maps fields.
 */
export function migrateTurbocommitConfig(projectRoot: string): Partial<FolderAiConfig> | null {
  const tcConfig = loadJson<any>(join(projectRoot, '.claude', 'turbocommit.json'))
  if (!tcConfig) return null

  const result: Partial<FolderAiConfig> = {}
  if (tcConfig.enabled !== undefined) result.enabled = tcConfig.enabled
  if (tcConfig.mode) result.commitMode = tcConfig.mode
  if (tcConfig.autoPush !== undefined) result.autoPush = tcConfig.autoPush
  if (tcConfig.coauthor !== undefined) result.coauthor = tcConfig.coauthor
  if (tcConfig.title) result.title = tcConfig.title
  if (tcConfig.body) result.body = tcConfig.body
  if (tcConfig.condense) result.condense = tcConfig.condense
  return result
}

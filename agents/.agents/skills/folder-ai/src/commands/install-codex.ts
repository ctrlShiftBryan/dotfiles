/**
 * Install/uninstall folder-ai auto-commit hook into Codex CLI config.
 * Adds a `notify` line to ~/.codex/config.toml.
 */

import { join } from 'path'
import { homedir } from 'os'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'

const CONFIG_PATH = join(homedir(), '.codex', 'config.toml')

function resolveCliPath(): string {
  return join(import.meta.dir, '..', 'cli.ts')
}

function buildNotifyLine(): string {
  const cliPath = resolveCliPath()
  return `notify = ["bun", "${cliPath}", "hook", "codex-notify"]`
}

function readConfig(): string {
  try {
    return readFileSync(CONFIG_PATH, 'utf8')
  } catch {
    return ''
  }
}

function writeConfig(content: string): void {
  mkdirSync(join(homedir(), '.codex'), { recursive: true })
  writeFileSync(CONFIG_PATH, content, 'utf8')
}

function hasNotifyLine(content: string): { exists: boolean; isFolderAi: boolean } {
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('[')) break // stop at first table
    if (trimmed.startsWith('notify')) {
      return { exists: true, isFolderAi: trimmed.includes('folder-ai') }
    }
  }
  return { exists: false, isFolderAi: false }
}

export function cmdInstallCodex(): void {
  const content = readConfig()
  const { exists, isFolderAi } = hasNotifyLine(content)

  if (exists && isFolderAi) {
    console.log('folder-ai Codex hook already installed.')
    return
  }

  if (exists && !isFolderAi) {
    console.log('ERROR: ~/.codex/config.toml already has a notify config.')
    console.log('folder-ai would overwrite it. Remove the existing notify line first, or')
    console.log('wrap both in a script that chains them.')
    return
  }

  const notifyLine = buildNotifyLine()
  const lines = content.split('\n')

  // Insert before first [table] section, after root-level keys
  let insertIdx = 0
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('[')) {
      insertIdx = i
      break
    }
    insertIdx = i + 1
  }

  // Add blank line before notify if there's content above
  const before = lines.slice(0, insertIdx)
  const after = lines.slice(insertIdx)
  const needsBlankBefore = before.length > 0 && before[before.length - 1]?.trim() !== ''
  const needsBlankAfter = after.length > 0 && after[0]?.trim() !== ''

  const result = [
    ...before,
    ...(needsBlankBefore ? [''] : []),
    notifyLine,
    ...(needsBlankAfter ? [''] : []),
    ...after
  ].join('\n')

  writeConfig(result)
  console.log('folder-ai Codex hook installed.')
  console.log(`  Config: ${CONFIG_PATH}`)
  console.log('IMPORTANT: Restart Codex CLI for the hook to take effect.')
}

export function cmdUninstallCodex(): void {
  if (!existsSync(CONFIG_PATH)) {
    console.log('No Codex config found.')
    return
  }

  const content = readConfig()
  const { exists, isFolderAi } = hasNotifyLine(content)

  if (!exists || !isFolderAi) {
    console.log('folder-ai Codex hook was not installed.')
    return
  }

  // Remove the notify line containing folder-ai
  const lines = content.split('\n')
  const filtered = lines.filter(line => {
    const trimmed = line.trim()
    return !(trimmed.startsWith('notify') && trimmed.includes('folder-ai'))
  })

  // Clean up double blank lines left behind
  const cleaned: string[] = []
  for (const line of filtered) {
    if (line.trim() === '' && cleaned.length > 0 && cleaned[cleaned.length - 1].trim() === '') {
      continue
    }
    cleaned.push(line)
  }

  writeConfig(cleaned.join('\n'))
  console.log('folder-ai Codex hook uninstalled.')
}

import { join } from 'path'
import { homedir } from 'os'
import { loadJson, writeJson } from '../lib/io'

const SETTINGS_PATH = join(homedir(), '.claude', 'settings.json')

function resolveCliPath(): string {
  return join(import.meta.dir, '..', 'cli.ts')
}

function buildHookDefs() {
  const cliPath = resolveCliPath()
  const cmd = `bun "${cliPath}"`
  return {
    SessionStart: {
      hooks: [{ type: 'command', command: `${cmd} hook session-start` }]
    },
    SessionEnd: {
      hooks: [{ type: 'command', command: `${cmd} hook session-end` }]
    },
    Stop: {
      hooks: [{ type: 'command', command: `${cmd} hook stop` }]
    }
  }
}

function hasFolderAi(groups: any[]): boolean {
  if (!Array.isArray(groups)) return false
  return groups.some(g => {
    const hooks = g?.hooks || []
    return hooks.some((h: any) => h.command?.includes('folder-ai'))
  })
}

function removeOldHooks(groups: any[]): any[] {
  if (!Array.isArray(groups)) return groups
  return groups.map(g => {
    if (!g?.hooks) return g
    const filtered = g.hooks.filter((h: any) =>
      !h.command?.includes('folder-ai') && !h.command?.includes('turbocommit')
    )
    return { ...g, hooks: filtered }
  }).filter(g => g.hooks?.length > 0)
}

export function cmdInstall(): void {
  const settings = loadJson<any>(SETTINGS_PATH) || {}
  const defs = buildHookDefs()

  if (!settings.hooks) settings.hooks = {}

  // Check if already installed
  const allInstalled = Object.keys(defs).every(event => hasFolderAi(settings.hooks[event]))
  if (allInstalled) {
    console.log('folder-ai hooks already installed.')
    return
  }

  // Clean old folder-ai AND turbocommit hooks
  for (const k of Object.keys(settings.hooks)) {
    settings.hooks[k] = removeOldHooks(settings.hooks[k])
    if (Array.isArray(settings.hooks[k]) && settings.hooks[k].length === 0) {
      delete settings.hooks[k]
    }
  }

  // Install new hooks
  for (const [event, def] of Object.entries(defs)) {
    if (!settings.hooks[event]) settings.hooks[event] = []
    const group: any = { hooks: def.hooks }
    if ('matcher' in def) group.matcher = def.matcher
    settings.hooks[event].push(group)
  }

  writeJson(SETTINGS_PATH, settings)
  console.log('folder-ai hooks installed.')
  console.log(`  Settings: ${SETTINGS_PATH}`)
  console.log('IMPORTANT: Restart Claude Code for hooks to take effect.')
}

export function cmdUninstall(): void {
  const settings = loadJson<any>(SETTINGS_PATH)
  if (!settings?.hooks) {
    console.log('No hooks found.')
    return
  }

  const wasInstalled = Object.keys(settings.hooks).some(event => hasFolderAi(settings.hooks[event]))

  for (const k of Object.keys(settings.hooks)) {
    settings.hooks[k] = removeOldHooks(settings.hooks[k])
    if (Array.isArray(settings.hooks[k]) && settings.hooks[k].length === 0) {
      delete settings.hooks[k]
    }
  }

  writeJson(SETTINGS_PATH, settings)
  console.log(wasInstalled ? 'folder-ai hooks uninstalled.' : 'folder-ai hooks were not installed.')
}

const os = require('os')
const path = require('path')
const { loadJson, writeJson } = require('./io')

function resolveCliPath () {
  return path.resolve(__dirname, '..', 'cli.js')
}

function buildHookDefs (cliPath) {
  cliPath = cliPath || resolveCliPath()
  const cmd = `node "${cliPath}"`
  return {
    SessionStart: {
      hooks: [{ type: 'command', command: `${cmd} hook session-start` }]
    },
    SessionEnd: {
      hooks: [{ type: 'command', command: `${cmd} hook session-end` }]
    }
  }
}

const HOOK_EVENTS = ['SessionStart', 'SessionEnd']

function getSettingsPath () {
  return path.join(os.homedir(), '.claude', 'settings.json')
}

function hasFolderAi (groups) {
  if (!Array.isArray(groups)) return false
  return groups.some(g => {
    const hooks = g && g.hooks ? g.hooks : []
    return hooks.some(h => h.command && h.command.includes('folder-ai'))
  })
}

function isFullyInstalled (settings) {
  if (!settings || !settings.hooks) return false
  return HOOK_EVENTS.every(event =>
    hasFolderAi(settings.hooks[event])
  )
}

function removeFolderAiHooks (groups) {
  if (!Array.isArray(groups)) return groups
  return groups.map(g => {
    if (!g || !Array.isArray(g.hooks)) return g
    const filtered = g.hooks.filter(h => !h.command || !h.command.includes('folder-ai'))
    return { ...g, hooks: filtered }
  }).filter(g => g.hooks && g.hooks.length > 0)
}

function install (settingsPath, cliPath) {
  settingsPath = settingsPath || getSettingsPath()
  const settings = loadJson(settingsPath) || {}
  const defs = buildHookDefs(cliPath)

  if (!settings.hooks) settings.hooks = {}

  if (isFullyInstalled(settings)) {
    return { alreadyInstalled: true, settingsPath }
  }

  // Clean stale folder-ai entries
  for (const k of Object.keys(settings.hooks)) {
    settings.hooks[k] = removeFolderAiHooks(settings.hooks[k])
    if (Array.isArray(settings.hooks[k]) && settings.hooks[k].length === 0) {
      delete settings.hooks[k]
    }
  }

  // Install each hook event
  for (const [event, def] of Object.entries(defs)) {
    if (!settings.hooks[event]) settings.hooks[event] = []
    settings.hooks[event].push({ hooks: def.hooks })
  }

  writeJson(settingsPath, settings)
  return { alreadyInstalled: false, settingsPath }
}

function uninstall (settingsPath) {
  settingsPath = settingsPath || getSettingsPath()
  const settings = loadJson(settingsPath)

  if (!settings || !settings.hooks) {
    return { wasInstalled: false, settingsPath }
  }

  const wasInstalled = Object.keys(settings.hooks).some(event =>
    hasFolderAi(settings.hooks[event])
  )

  for (const k of Object.keys(settings.hooks)) {
    settings.hooks[k] = removeFolderAiHooks(settings.hooks[k])
    if (Array.isArray(settings.hooks[k]) && settings.hooks[k].length === 0) {
      delete settings.hooks[k]
    }
  }

  writeJson(settingsPath, settings)
  return { wasInstalled, settingsPath }
}

module.exports = { install, uninstall, hasFolderAi, isFullyInstalled, getSettingsPath, buildHookDefs, HOOK_EVENTS }

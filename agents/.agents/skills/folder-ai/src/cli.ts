#!/usr/bin/env bun

import { cmdInit } from './commands/init'
import { cmdCreate } from './commands/create'
import { cmdRegister, cmdUnregister, cmdDiscover } from './commands/register'
import { cmdStatus } from './commands/status'
import { cmdInstall, cmdUninstall } from './commands/install'
import { cmdWatch } from './commands/watch'
import { cmdNuke } from './commands/nuke'
import { cmdCleanup } from './commands/cleanup'
import { pruneRegistry } from './lib/registry'
import { handlePreToolUseHook as handlePreToolUse } from './hooks/pre-tool-use'
import { handleStop } from './hooks/stop'
import { handleSessionStartHook } from './hooks/session-start'
import { handleSessionEndHook } from './hooks/session-end'
import { refine } from './commit/refine'
import { finalize as runFinalize } from './hooks/finalize'
import { join } from 'path'
import { homedir } from 'os'
import { existsSync, writeFileSync, unlinkSync, mkdirSync } from 'fs'

const pkg = require('../package.json')
const VERSION = pkg.version

const KILL_SWITCH_PATH = join(homedir(), '.folder-ai', 'disabled')

function readStdinData(): string {
  try {
    return require('fs').readFileSync(0, 'utf8')
  } catch {
    return ''
  }
}

function printHelp(): void {
  console.log(`folder-ai v${VERSION}

Commands:
  create <name>       Create new project (mkdir, git init, init, gh repo, push, register)
  init                Create workspace structure + register
  register            Register cwd for watching
  unregister          Remove cwd from registry
  discover            Scan ~/.claude/projects/, show unregistered projects
  status              Workspace state + commit health
  install             Install hooks (SessionStart, SessionEnd, Stop)
  uninstall           Remove hooks
  enable              Remove kill switch (enable all hooks)
  disable             Create kill switch (disable all hooks instantly)
  cleanup [--dry-run] Remove junk session .md files from all projects
  prune               Remove invalid/duplicate entries from registry
  nuke                Tear down project — unregister, clean state, delete directory

  watch status        Show watcher status
  watch logs          Show recent events

  hook pre-tool-use   Hook: pre-tool-use (reads stdin)
  hook stop           Hook: stop (reads stdin)
  hook session-start  Hook: session-start (reads stdin)
  hook session-end    Hook: session-end (reads stdin)
  hook refine <path>  Hook: refine manifest
  hook finalize <sid> <dir>  Hook: finalize session

  help                Show this help
  --version, -v       Show version`)
}

const [cmd, ...argv] = process.argv.slice(2)

switch (cmd) {
  case 'create':
    cmdCreate(argv[0])
    break

  case 'init':
    cmdInit()
    break

  case 'register':
    cmdRegister()
    break

  case 'unregister':
    cmdUnregister()
    break

  case 'discover':
    cmdDiscover()
    break

  case 'status':
    cmdStatus()
    break

  case 'install':
    cmdInstall()
    break

  case 'uninstall':
    cmdUninstall()
    break

  case 'enable': {
    if (existsSync(KILL_SWITCH_PATH)) {
      unlinkSync(KILL_SWITCH_PATH)
      console.log('folder-ai enabled (kill switch removed)')
    } else {
      console.log('folder-ai already enabled')
    }
    break
  }

  case 'disable': {
    mkdirSync(join(homedir(), '.folder-ai'), { recursive: true })
    writeFileSync(KILL_SWITCH_PATH, new Date().toISOString())
    console.log('folder-ai disabled (kill switch active)')
    break
  }

  case 'cleanup':
    cmdCleanup(argv.includes('--dry-run'))
    break

  case 'prune':
    const removed = pruneRegistry()
    console.log(removed > 0 ? `Pruned ${removed} invalid/duplicate entries` : 'Registry clean')
    break

  case 'nuke':
    cmdNuke(argv)
    break

  case 'watch':
    cmdWatch(argv[0], argv.slice(1))
    break

  case 'hook': {
    const event = argv[0]
    try {
      const input = readStdinData()
      switch (event) {
        case 'pre-tool-use':
          handlePreToolUse(input)
          break
        case 'stop':
          handleStop(input)
          break
        case 'session-start':
          handleSessionStartHook(input)
          break
        case 'session-end':
          handleSessionEndHook(input)
          break
        case 'refine':
          // argv[1] is manifest path
          refine(argv[1])
          break
        case 'finalize':
          // argv[1] = sessionId, argv[2] = projectDir
          if (!process.env.FOLDERAI_DISABLED && !existsSync(KILL_SWITCH_PATH)) {
            runFinalize(argv[1], argv[2])
          }
          break
      }
    } catch {}
    break
  }

  case 'help':
  case '--help':
  case '-h':
    printHelp()
    break

  case '--version':
  case '-v':
    console.log(VERSION)
    break

  default:
    if (cmd) console.error(`Unknown command: ${cmd}`)
    printHelp()
    if (cmd) process.exitCode = 1
    break
}

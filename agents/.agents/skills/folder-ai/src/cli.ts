#!/usr/bin/env bun

import { cmdInit } from './commands/init'
import { cmdCreate } from './commands/create'
import { cmdRegister, cmdUnregister, cmdDiscover } from './commands/register'
import { cmdStatus } from './commands/status'
import { cmdInstall, cmdUninstall } from './commands/install'
import { cmdWatch } from './commands/watch'
import { cmdNuke } from './commands/nuke'
import { handlePreToolUseHook as handlePreToolUse } from './hooks/pre-tool-use'
import { handleStop } from './hooks/stop'
import { handleSessionStartHook } from './hooks/session-start'
import { handleSessionEndHook } from './hooks/session-end'
import { refine } from './commit/refine'

const pkg = require('../package.json')
const VERSION = pkg.version

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
  install             Install hooks (PreToolUse, Stop, SessionStart, SessionEnd)
  uninstall           Remove hooks
  nuke                Tear down project — unregister, clean state, delete directory

  watch install       Install cron-based session watcher
  watch uninstall     Remove cron watcher
  watch status        Show watcher status
  watch run           Run watcher once
  watch logs          Show recent events
  watch backfill      Backfill missed sessions

  hook pre-tool-use   Hook: pre-tool-use (reads stdin)
  hook stop           Hook: stop (reads stdin)
  hook session-start  Hook: session-start (reads stdin)
  hook session-end    Hook: session-end (reads stdin)
  hook refine <path>  Hook: refine manifest

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

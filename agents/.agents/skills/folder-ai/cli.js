#!/usr/bin/env node

const { readStdin } = require('./lib/io')
const { install, uninstall } = require('./lib/install')
const { createStructure, writeRepositories, writePeople, writeLearnings, appendClaudeMd, status } = require('./lib/init')
const { handleSessionStart } = require('./lib/session-start')
const { handleSessionEnd } = require('./lib/session-end')

const VERSION = require('./package.json').version

const USAGE = `folder-ai v${VERSION}
Plain folders + markdown as AI workspace context.

Commands:
  init        Create folder-ai structure in current directory
  install     Add folder-ai hooks to ~/.claude/settings.json
  uninstall   Remove folder-ai hooks
  hook        Hook entry points (session-start, session-end)
  status      Show workspace state
  help        Show this help text
  --version   Show version

Usage:
  node cli.js install   # set up global hooks
  node cli.js init      # create workspace structure
  node cli.js status    # check workspace state
`

function main (argv) {
  const cmd = argv[0]

  switch (cmd) {
    case 'install':
      return cmdInstall()
    case 'uninstall':
      return cmdUninstall()
    case 'init':
      return cmdInit()
    case 'status':
      return cmdStatus()
    case 'hook':
      return cmdHook(argv.slice(1))
    case '--version':
    case '-v':
    case 'version':
      console.log(VERSION)
      return
    case 'help':
    case '--help':
    case '-h':
    case undefined:
      console.log(USAGE)
      return
    default:
      console.error(`Unknown command: ${cmd}`)
      console.error('Run "folder-ai help" for usage.')
      process.exitCode = 1
  }
}

function cmdInstall () {
  const result = install()
  if (result.alreadyInstalled) {
    console.log('folder-ai hooks already installed.')
    console.log(`  Settings: ${result.settingsPath}`)
    return
  }
  console.log('folder-ai hooks installed.')
  console.log(`  Settings: ${result.settingsPath}`)
  console.log('')
  console.log('IMPORTANT: Restart Claude Code for hooks to take effect.')
}

function cmdUninstall () {
  const result = uninstall()
  if (!result.wasInstalled) {
    console.log('folder-ai hooks were not installed.')
    return
  }
  console.log('folder-ai hooks uninstalled.')
  console.log(`  Settings: ${result.settingsPath}`)
}

function cmdInit () {
  const root = process.cwd()
  createStructure(root)
  writeLearnings(root)
  writeRepositories(root, [])
  writePeople(root, [])
  appendClaudeMd(root)
  console.log('folder-ai workspace initialized.')
  console.log(`  Root: ${root}`)
  console.log('  Created: sessions/, issues/, repositories.md, people.md, learnings.md')
  console.log('  Updated: CLAUDE.md')
}

function cmdStatus () {
  const root = process.cwd()
  const s = status(root)
  console.log('folder-ai workspace status:')
  console.log(`  repositories.md: ${s.repositories ? 'yes' : 'no'}`)
  console.log(`  people.md:       ${s.people ? 'yes' : 'no'}`)
  console.log(`  learnings.md:    ${s.learnings ? 'yes' : 'no'}`)
  console.log(`  issues/:         ${s.issues ? `yes (${s.issueCount} issues)` : 'no'}`)
  console.log(`  sessions/:       ${s.sessions ? `yes (${s.sessionCount} sessions)` : 'no'}`)
  console.log(`  CLAUDE.md:       ${s.claudeMd ? 'yes' : 'no'}`)
}

function cmdHook (argv) {
  const event = argv[0]
  try {
    const input = readStdin()
    switch (event) {
      case 'session-start':
        handleSessionStart(input)
        return
      case 'session-end':
        handleSessionEnd(input)
        return
      default:
        break
    }
  } catch {
    // Never fail — fire and forget
  }
}

main(process.argv.slice(2))

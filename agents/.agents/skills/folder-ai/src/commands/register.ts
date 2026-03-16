import { registerProject, unregisterProject, readRegistry, isRegistered } from '../lib/registry'
import { listClaudeProjects } from '../lib/claude-projects'

export function cmdRegister(): void {
  const cwd = process.cwd()
  if (isRegistered(cwd)) {
    console.log(`Already registered: ${cwd}`)
    return
  }
  registerProject(cwd)
  console.log(`Registered: ${cwd}`)
}

export function cmdUnregister(): void {
  const cwd = process.cwd()
  unregisterProject(cwd)
  console.log(`Unregistered: ${cwd}`)
}

export function cmdDiscover(): void {
  const registry = readRegistry()
  const registeredPaths = new Set(registry.map(e => e.path))
  const projects = listClaudeProjects()

  console.log('Claude Code projects:')
  for (const p of projects) {
    const registered = registeredPaths.has(p.decoded)
    const status = registered ? '[registered]' : '[unregistered]'
    console.log(`  ${status} ${p.decoded}`)
  }
}

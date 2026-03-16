import { gitRoot } from '../lib/git'
import { registerProject } from '../lib/registry'
import { handleSessionStart as handleBreadcrumbClaim } from '../lib/session-chain'
import { join } from 'path'
import { mkdirSync, existsSync, writeFileSync } from 'fs'

export function handleSessionStartHook(input: string): void {
  let hookInput: any
  try { hookInput = JSON.parse(input) } catch { return }

  const sessionId = hookInput.session_id
  if (!sessionId) return

  const projectDir = hookInput.workspace?.project_dir || hookInput.cwd
  if (!projectDir) return

  // Auto-register project
  registerProject(projectDir)

  // Auto-create empty session-issue binding file
  const shortId = sessionId.slice(0, 8)
  if (shortId && projectDir) {
    const bindingDir = join(projectDir, 'session-issues')
    mkdirSync(bindingDir, { recursive: true })
    const bindingPath = join(bindingDir, `${shortId}.md`)
    if (!existsSync(bindingPath)) {
      writeFileSync(bindingPath, '', 'utf-8')
    }
  }

  // Handle breadcrumb claim for /clear continuity
  const root = gitRoot(projectDir)
  if (root) {
    handleBreadcrumbClaim(input, root)
  }
}

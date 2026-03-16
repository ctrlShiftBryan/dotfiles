import { gitRoot } from '../lib/git'
import { registerProject } from '../lib/registry'
import { handleSessionStart as handleBreadcrumbClaim } from '../lib/session-chain'

export function handleSessionStartHook(input: string): void {
  let hookInput: any
  try { hookInput = JSON.parse(input) } catch { return }

  const sessionId = hookInput.session_id
  if (!sessionId) return

  const projectDir = hookInput.workspace?.project_dir || hookInput.cwd
  if (!projectDir) return

  // Auto-register project
  registerProject(projectDir)

  // Handle breadcrumb claim for /clear continuity
  const root = gitRoot(projectDir)
  if (root) {
    handleBreadcrumbClaim(input, root)
  }
}

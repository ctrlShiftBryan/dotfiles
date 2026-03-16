import { gitRoot } from '../lib/git'
import { handleSessionEnd as handleBreadcrumbWrite } from '../lib/session-chain'

export function handleSessionEndHook(input: string): void {
  let hookInput: any
  try { hookInput = JSON.parse(input) } catch { return }

  const sessionId = hookInput.session_id
  if (!sessionId) return

  const projectDir = hookInput.workspace?.project_dir || hookInput.cwd
  if (!projectDir) return

  const root = gitRoot(projectDir)
  if (root) {
    handleBreadcrumbWrite(input, root)
  }
}

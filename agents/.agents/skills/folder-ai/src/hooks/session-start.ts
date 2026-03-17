import { gitRoot } from '../lib/git'
import { registerProject } from '../lib/registry'
import { handleSessionStart as handleBreadcrumbClaim } from '../lib/session-chain'
import { join } from 'path'
import { homedir } from 'os'
import { mkdirSync, existsSync, writeFileSync, readFileSync, statSync } from 'fs'

export function handleSessionStartHook(input: string): void {
  if (process.env.FOLDERAI_DISABLED) return
  if (existsSync(join(homedir(), '.folder-ai', 'disabled'))) return

  let hookInput: any
  try { hookInput = JSON.parse(input) } catch { return }

  const sessionId = hookInput.session_id
  if (!sessionId) return

  const projectDir = hookInput.workspace?.project_dir || hookInput.cwd
  if (!projectDir) return

  // Auto-register project
  registerProject(projectDir)

  const shortId = sessionId.slice(0, 8)
  if (shortId && projectDir) {
    const bindingDir = join(projectDir, 'session-issues')
    mkdirSync(bindingDir, { recursive: true })

    // Parent session lock: first session registers as parent, subagents skip.
    // Claude Code subagents fire SessionStart with identical env — no signal
    // distinguishes them. So we lock on the first session_id and reject others.
    const lockPath = join(bindingDir, '.parent-session')
    try {
      const lockContent = readFileSync(lockPath, 'utf8').trim()
      const lockAge = Date.now() - statSync(lockPath).mtimeMs
      // Lock exists, different session, and less than 4 hours old → subagent, skip
      if (lockContent && lockContent !== shortId && lockAge < 4 * 60 * 60 * 1000) {
        return
      }
    } catch {
      // No lock file — this is the first session, proceed
    }

    // Register as parent session
    writeFileSync(lockPath, shortId)

    // Auto-create empty session-issue binding file
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

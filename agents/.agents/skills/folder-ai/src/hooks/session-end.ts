import { join } from 'path'
import { spawn } from 'child_process'
import { homedir } from 'os'
import { existsSync, readFileSync, unlinkSync } from 'fs'
import { gitRoot } from '../lib/git'
import { handleSessionEnd as handleBreadcrumbWrite } from '../lib/session-chain'
import { resolveConfig } from '../lib/config'

export function handleSessionEndHook(input: string): void {
  if (process.env.FOLDERAI_DISABLED) return
  if (existsSync(join(homedir(), '.folder-ai', 'disabled'))) return

  let hookInput: any
  try { hookInput = JSON.parse(input) } catch { return }

  const sessionId = hookInput.session_id
  if (!sessionId) return

  const projectDir = hookInput.workspace?.project_dir || hookInput.cwd
  if (!projectDir) return

  // Clear parent session lock if we're the parent
  const shortId = sessionId.slice(0, 8)
  const lockPath = join(projectDir, 'session-issues', '.parent-session')
  try {
    const lockContent = readFileSync(lockPath, 'utf8').trim()
    if (lockContent === shortId) {
      unlinkSync(lockPath)
    }
  } catch {}

  const root = gitRoot(projectDir)
  if (root) {
    handleBreadcrumbWrite(input, root)

    // Spawn detached finalize process
    const config = resolveConfig(root)
    if (config.finalize?.enabled !== false) {
      const cliPath = join(__dirname, '..', 'cli.ts')
      const child = spawn('bun', [
        'run', cliPath, 'hook', 'finalize',
        sessionId, projectDir
      ], {
        detached: true,
        stdio: 'ignore',
        env: { ...process.env, FOLDERAI_DISABLED: '1' }
      })
      child.unref()
    }
  }
}

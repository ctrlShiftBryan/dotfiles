import { join } from 'path'
import { execSync } from 'child_process'
import { homedir } from 'os'
import { exists, readFile, ensureDir, appendToFile } from '../lib/io'
import { registerProject, unregisterProject, readRegistry, eventsPath, registryDir } from '../lib/registry'
import { scanSessions } from '../lib/claude-projects'

const SKILL_DIR = join(import.meta.dir, '..', '..')

export function cmdWatch(sub: string, args: string[] = []): void {
  switch (sub) {
    case 'install': {
      try {
        const out = execSync(`bash "${SKILL_DIR}/scripts/install-cron.sh" install`, { encoding: 'utf8' })
        console.log(out.trim())
      } catch (e: any) {
        console.error('Failed:', e.message)
        process.exitCode = 1
      }
      break
    }
    case 'uninstall': {
      try {
        const out = execSync(`bash "${SKILL_DIR}/scripts/install-cron.sh" uninstall`, { encoding: 'utf8' })
        console.log(out.trim())
      } catch (e: any) {
        console.error('Failed:', e.message)
        process.exitCode = 1
      }
      break
    }
    case 'status': {
      // Cron status
      try {
        const status = execSync(`bash "${SKILL_DIR}/scripts/install-cron.sh" status`, { encoding: 'utf8' }).trim()
        console.log(`Cron: ${status}`)
      } catch {
        console.log('Cron: unknown')
      }
      // Registry
      const entries = readRegistry()
      console.log(`Watched projects: ${entries.length}`)
      for (const e of entries) console.log(`  ${e.path}`)
      // Events
      const ep = eventsPath()
      if (exists(ep)) {
        const lines = (readFile(ep) || '').trim().split('\n').filter(Boolean)
        console.log(`\nRecent events (${lines.length} total):`)
        for (const line of lines.slice(-5)) {
          try {
            const evt = JSON.parse(line)
            console.log(`  ${evt.ts} ${evt.type || evt.event} ${evt.session || evt.project || ''} ${evt.detail || evt.title || ''}`)
          } catch {}
        }
      } else {
        console.log('\nNo events yet.')
      }
      break
    }
    case 'run': {
      // Import and run watcher directly
      import('../watch').then(m => m.runWatcher()).catch(e => {
        console.error('Watch run failed:', e.message)
        process.exitCode = 1
      })
      break
    }
    case 'logs': {
      const ep = eventsPath()
      if (!exists(ep)) {
        console.log('No events yet.')
        return
      }
      const lines = (readFile(ep) || '').trim().split('\n').filter(Boolean)
      for (const line of lines.slice(-20)) console.log(line)
      break
    }
    case 'backfill': {
      import('../watch').then(m => m.runWatcher(true)).catch(e => {
        console.error('Backfill failed:', e.message)
        process.exitCode = 1
      })
      break
    }
    default:
      console.error(`Unknown: folder-ai watch ${sub || '(none)'}`)
      console.error('Usage: folder-ai watch [install|uninstall|status|run|logs|backfill]')
      process.exitCode = 1
  }
}

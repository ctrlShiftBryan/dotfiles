import { exists, readFile } from '../lib/io'
import { readRegistry, eventsPath } from '../lib/registry'

export function cmdWatch(sub: string, args: string[] = []): void {
  switch (sub) {
    case 'status': {
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
    default:
      console.error(`Unknown: folder-ai watch ${sub || '(none)'}`)
      console.error('Usage: folder-ai watch [status|logs]')
      process.exitCode = 1
  }
}

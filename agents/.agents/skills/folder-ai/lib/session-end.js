const path = require('path')
const { exists, readFile, writeFile } = require('./io')
const { sessionCompleted } = require('./templates')

function handleSessionEnd (input) {
  let hookInput
  try {
    hookInput = JSON.parse(input)
  } catch {
    return
  }

  const sessionId = hookInput.session_id
  if (!sessionId) return

  const projectDir = (hookInput.workspace && hookInput.workspace.project_dir) || hookInput.cwd
  if (!projectDir) return

  const sessionsDir = path.join(projectDir, 'sessions')
  if (!exists(sessionsDir)) return

  const now = new Date()
  const endTimestamp = now.toISOString()

  const cost = hookInput.cost && hookInput.cost.total_cost_usd
  const durationMs = hookInput.cost && hookInput.cost.total_duration_ms

  // Update session file
  const sessionFile = path.join(sessionsDir, `${sessionId}.md`)
  if (exists(sessionFile)) {
    let content = readFile(sessionFile)
    // Replace status
    content = content.replace('**Status:** active', '**Status:** completed')
    content += sessionCompleted(endTimestamp, cost, durationMs)
    writeFile(sessionFile, content)
  }

  // Append completion note to index
  const shortId = sessionId.slice(0, 8)
  const costStr = cost != null ? `$${Number(cost).toFixed(4)}` : ''
  const indexFile = path.join(sessionsDir, 'sessions.md')
  if (exists(indexFile)) {
    // Read index, find the active row for this session, update it
    let index = readFile(indexFile)
    if (index) {
      const activePattern = `| ${shortId} | active |`
      if (index.includes(activePattern)) {
        index = index.replace(
          new RegExp(`\\| ${shortId} \\| active \\| \\| [^|]* \\|`),
          `| ${shortId} | completed | ${costStr} | |`
        )
        writeFile(indexFile, index)
      }
    }
  }
}

module.exports = { handleSessionEnd }

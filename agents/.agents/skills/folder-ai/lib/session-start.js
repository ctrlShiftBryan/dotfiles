const path = require('path')
const { writeFile, appendFile, exists } = require('./io')
const { sessionFileMd, sessionsIndexRow } = require('./templates')

function handleSessionStart (input) {
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
  if (!exists(sessionsDir)) return // not a folder-ai project

  const now = new Date()
  const timestamp = now.toISOString()
  const date = timestamp.slice(0, 10)
  const shortId = sessionId.slice(0, 8)
  const model = hookInput.model || 'unknown'

  // Create session file
  const sessionFile = path.join(sessionsDir, `${sessionId}.md`)
  writeFile(sessionFile, sessionFileMd(shortId, model, timestamp))

  // Append to index
  const indexFile = path.join(sessionsDir, 'sessions.md')
  appendFile(indexFile, sessionsIndexRow(date, shortId, 'active', ''))
}

module.exports = { handleSessionStart }

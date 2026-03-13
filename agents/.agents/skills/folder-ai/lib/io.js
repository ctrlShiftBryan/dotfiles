const fs = require('fs')
const path = require('path')

function readStdin () {
  return fs.readFileSync(0, 'utf8')
}

function loadJson (p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch {
    return null
  }
}

function writeJson (p, obj) {
  ensureDir(path.dirname(p))
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8')
}

function ensureDir (p) {
  fs.mkdirSync(p, { recursive: true })
}

function readFile (p) {
  try {
    return fs.readFileSync(p, 'utf8')
  } catch {
    return null
  }
}

function writeFile (p, content) {
  ensureDir(path.dirname(p))
  fs.writeFileSync(p, content, 'utf8')
}

function appendFile (p, content) {
  ensureDir(path.dirname(p))
  fs.appendFileSync(p, content, 'utf8')
}

function exists (p) {
  return fs.existsSync(p)
}

module.exports = { readStdin, loadJson, writeJson, ensureDir, readFile, writeFile, appendFile, exists }

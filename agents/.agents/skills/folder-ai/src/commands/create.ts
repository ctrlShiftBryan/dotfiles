import { join, resolve } from 'path'
import { execSync } from 'child_process'
import { ensureDir, exists, writeFile } from '../lib/io'
import { cmdInit } from './init'

export async function cmdCreate(name: string): Promise<void> {
  if (!name) {
    console.error('Usage: folder-ai create <project-name>')
    process.exitCode = 1
    return
  }

  const projectDir = resolve(process.cwd(), name)
  if (exists(projectDir)) {
    console.error(`Already exists: ${projectDir}`)
    process.exitCode = 1
    return
  }

  // Resolve GitHub org
  const org = await getGhOrg()
  const repoName = org ? `${org}/${name}` : name

  ensureDir(projectDir)
  console.log(`Created: ${projectDir}`)

  execSync('git init', { cwd: projectDir, stdio: 'pipe' })
  console.log('Initialized git repo.')

  cmdInit(projectDir)

  // .gitignore
  const gitignore = join(projectDir, '.gitignore')
  if (!exists(gitignore)) {
    writeFile(gitignore, '.folder-ai.jsonl\n')
  }

  execSync('git add -A && git commit -m "init folder-ai workspace"', { cwd: projectDir, stdio: 'pipe' })
  console.log('Initial commit created.')

  try {
    execSync(`gh repo create ${repoName} --private --source . --push`, { cwd: projectDir, stdio: 'pipe' })
    console.log(`GitHub repo: ${repoName} (private)`)
  } catch (e: any) {
    console.error('gh repo create failed:', e.message)
  }

  console.log(`\nDone. cd ${name}`)
}

async function getGhOrg(): Promise<string | null> {
  try {
    const orgs = JSON.parse(execSync('gh api user/orgs --jq "[.[].login]"', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }))
    if (orgs.length === 0) return null
    console.log('Where to create the repo?')
    orgs.forEach((o: string, i: number) => console.log(`  ${i + 1}. ${o}`))
    console.log(`  ${orgs.length + 1}. (personal account)`)

    const readline = await import('readline')
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    return new Promise(resolve => {
      rl.question('Select: ', answer => {
        rl.close()
        const idx = parseInt(answer, 10) - 1
        resolve(idx >= 0 && idx < orgs.length ? orgs[idx] : null)
      })
    })
  } catch {
    return null
  }
}

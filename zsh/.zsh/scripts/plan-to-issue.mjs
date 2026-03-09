#!/usr/bin/env node

import { execSync } from 'child_process';
import { readdirSync, readFileSync } from 'fs';
import { join, basename } from 'path';
import prompts from 'prompts';

// check gh cli available and authenticated
try {
  execSync('gh auth status', { stdio: 'pipe' });
} catch {
  console.error('Error: gh CLI not installed or not authenticated. Run `gh auth login` first.');
  process.exit(1);
}

// check we're in a git repo with a remote
let repo;
try {
  repo = execSync('gh repo view --json nameWithOwner -q .nameWithOwner', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
} catch {
  console.error('Error: not in a git repo with a GitHub remote.');
  process.exit(1);
}

// find plans/ dir - walk up from cwd to find it
let plansDir;
let dir = process.cwd();
while (dir !== '/') {
  const candidate = join(dir, 'plans');
  try {
    readdirSync(candidate);
    plansDir = candidate;
    break;
  } catch { dir = join(dir, '..'); }
}

if (!plansDir) {
  console.error('Error: no plans/ directory found.');
  process.exit(1);
}

const files = readdirSync(plansDir)
  .filter(f => f.endsWith('.md'))
  .sort()
  .reverse();

if (!files.length) {
  console.error('No .md files found in plans/');
  process.exit(1);
}

const { file } = await prompts({
  type: 'select',
  name: 'file',
  message: 'Select a plan to create as GitHub issue',
  choices: files.map(f => ({ title: f, value: f })),
}, { onCancel: () => process.exit(0) });

if (!file) process.exit(0);

const content = readFileSync(join(plansDir, file), 'utf8');

// extract title from first heading or filename
const titleMatch = content.match(/^#\s+(.+)$/m);
const title = titleMatch ? titleMatch[1].trim() : basename(file, '.md');

const { confirm } = await prompts({
  type: 'confirm',
  name: 'confirm',
  message: `Create issue "${title}" on ${repo}?`,
  initial: true,
}, { onCancel: () => process.exit(0) });

if (!confirm) process.exit(0);

try {
  const result = execSync('gh issue create --title "$TITLE" --body "$BODY"', {
    encoding: 'utf8',
    env: { ...process.env, TITLE: title, BODY: content },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  console.log('Issue created:', result.trim());
} catch (e) {
  console.error('Failed to create issue:', e.stderr || e.message);
  process.exit(1);
}

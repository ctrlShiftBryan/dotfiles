#!/usr/bin/env node

/**
 * Claude Code Hook: Auto-rename plan files after ExitPlanMode
 * Renames non-conforming files in plans/ to YYYY-MM-DD-HH-MMam-pm-descriptive-name.md
 */

const fs = require('fs');
const path = require('path');

const PATTERN = /^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}(am|pm)-.+\.md$/;

function formatTimestamp(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  let h = date.getHours();
  const ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  const hh = String(h).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}-${hh}-${mm}${ampm}`;
}

function toKebab(text) {
  return text
    .replace(/^#+\s*/, '')
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .split('-')
    .filter(Boolean)
    .slice(0, 5)
    .join('-');
}

function extractName(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith('#')) return toKebab(trimmed);
      return toKebab(trimmed);
    }
  } catch (_) {}
  // fallback: use filename without extension
  return toKebab(path.basename(filePath, '.md'));
}

function resolveConflict(dir, name) {
  let target = `${name}.md`;
  if (!fs.existsSync(path.join(dir, target))) return target;
  let i = 2;
  while (fs.existsSync(path.join(dir, `${name}-${i}.md`))) i++;
  return `${name}-${i}.md`;
}

function main() {
  const projectDir = process.env.CLAUDE_PROJECT_DIR;
  if (!projectDir) return;

  const plansDir = path.join(projectDir, 'plans');
  let files;
  try {
    files = fs.readdirSync(plansDir).filter(f => f.endsWith('.md'));
  } catch (_) {
    return;
  }

  const toRename = files.filter(f => {
    if (PATTERN.test(f)) return false;
    // skip existing symlinks (already renamed in a previous run)
    try { if (fs.lstatSync(path.join(plansDir, f)).isSymbolicLink()) return false; } catch (_) {}
    return true;
  });
  if (!toRename.length) return;

  for (const file of toRename) {
    const fullPath = path.join(plansDir, file);
    const stat = fs.statSync(fullPath);
    const timestamp = formatTimestamp(stat.mtime);
    const descriptive = extractName(fullPath) || 'unnamed-plan';
    const newName = resolveConflict(plansDir, `${timestamp}-${descriptive}`);
    const newPath = path.join(plansDir, newName);
    // guard: skip if target already exists as a real file (prevent double-rename)
    try { if (!fs.lstatSync(newPath).isSymbolicLink()) continue; } catch (_) {}
    fs.renameSync(fullPath, newPath);
    // symlink so Claude Code's old reference still works during session
    fs.symlinkSync(newName, fullPath);
    // verify symlink resolves correctly
    try {
      fs.realpathSync(fullPath);
    } catch (_) {
      // broken symlink - remove it to avoid self-referencing loops
      try { fs.unlinkSync(fullPath); } catch (_) {}
    }
  }
}

main();

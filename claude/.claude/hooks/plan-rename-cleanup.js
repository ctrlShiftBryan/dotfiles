#!/usr/bin/env node

/**
 * Claude Code Hook: Clean up plan symlinks at session end
 * Removes symlinks left by plan-rename.js in plans/ directory
 */

const fs = require('fs');
const path = require('path');

const projectDir = process.env.CLAUDE_PROJECT_DIR;
if (!projectDir) process.exit(0);

const plansDir = path.join(projectDir, 'plans');
try {
  for (const file of fs.readdirSync(plansDir)) {
    const full = path.join(plansDir, file);
    if (fs.lstatSync(full).isSymbolicLink()) fs.unlinkSync(full);
  }
} catch (_) {}

#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');
const os = require('os');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', c => input += c);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const msg = data.last_assistant_message;
    if (!msg) return;

    const projectDir = process.env.CLAUDE_PROJECT_DIR || data.cwd || process.cwd();
    const script = path.join(os.homedir(), 'code2/tmux-ba/scripts/extract-urls.mjs');

    execSync(`node "${script}" --path "${projectDir}"`, {
      input: msg,
      stdio: ['pipe', 'ignore', 'ignore'],
      timeout: 5000
    });
  } catch (_) {}
});

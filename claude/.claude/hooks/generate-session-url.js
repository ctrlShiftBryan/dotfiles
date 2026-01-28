#!/usr/bin/env node

/**
 * Claude Code Hook: Send Pushover notification with session URL
 * Reads transcript to determine model and suppress for haiku
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const querystring = require('querystring');

const CONFIG = {
  host: 'bryans-macbook-pro-m4.tail67c0d1.ts.net',
  port: '5174',
  viewParam: 'condensed',
  suppressModels: ['haiku']
};

function pathToUrlSegment(filePath) {
  return filePath.replace(/\//g, '-');
}

function generateUrl(projectPath, sessionId) {
  const urlPath = pathToUrlSegment(projectPath);
  return `http://${CONFIG.host}:${CONFIG.port}/${urlPath}/sessions/${sessionId}?view=${CONFIG.viewParam}`;
}

function writeTmuxUrl(projectDir, url) {
  const tmuxConfigPath = path.join(projectDir, 'tmux-urls.cfg');
  const line = `z: ${url}`;

  try {
    let existing = '';
    try {
      existing = fs.readFileSync(tmuxConfigPath, 'utf8');
    } catch (_) {}

    const lines = existing.split('\n');
    const updatedLines = [];
    let zFound = false;

    for (const existingLine of lines) {
      if (existingLine.startsWith('z:')) {
        updatedLines.push(line);
        zFound = true;
      } else if (existingLine.trim()) {
        updatedLines.push(existingLine);
      }
    }

    if (!zFound) {
      updatedLines.push(line);
    }

    fs.writeFileSync(tmuxConfigPath, updatedLines.join('\n') + '\n');
  } catch (error) {}
}

/**
 * Parse transcript JSONL to extract model and first user prompt
 */
function parseTranscript(transcriptPath) {
  let model = null;
  let firstUserPrompt = null;

  try {
    const content = fs.readFileSync(transcriptPath, 'utf8');
    const lines = content.trim().split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line);

        if (!firstUserPrompt && entry.type === 'user' && entry.message?.content) {
          firstUserPrompt = entry.message.content;
        }

        if (!model && entry.type === 'assistant' && entry.message?.model) {
          model = entry.message.model;
        }

        if (firstUserPrompt && model) break;
      } catch (_) {}
    }
  } catch (_) {}

  return { model, firstUserPrompt };
}

/**
 * Check if notification should be suppressed
 */
function shouldSuppress(model) {
  if (!model) return false;

  const modelLower = model.toLowerCase();
  return CONFIG.suppressModels.some(m => modelLower.includes(m));
}

function sendPushoverNotification(url, projectName) {
  const apiToken = process.env.PUSHOVER_API_TOKEN;
  const userKey = process.env.PUSHOVER_USER_KEY;

  if (!apiToken || !userKey) {
    return Promise.resolve();
  }

  const time = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const postData = querystring.stringify({
    token: apiToken,
    user: userKey,
    title: `Claude Code - ${projectName}`,
    message: `✅ Task completed at ${time}`,
    sound: 'magic',
    url: url,
    url_title: '🔗 Open Session Dashboard',
    priority: 0,
    html: 1
  });

  const options = {
    hostname: 'api.pushover.net',
    port: 443,
    path: '/1/messages.json',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      res.on('data', () => {});
      res.on('end', resolve);
    });

    req.on('error', () => resolve());
    req.write(postData);
    req.end();
  });
}

async function main() {
  let inputData = '';

  const readTimeout = setTimeout(async () => {
    if (inputData) await processHookData(inputData);
    process.exit(0);
  }, 100);

  process.stdin.setEncoding('utf8');

  process.stdin.on('data', (chunk) => {
    inputData += chunk;
  });

  process.stdin.on('end', async () => {
    clearTimeout(readTimeout);
    await processHookData(inputData);
    process.exit(0);
  });

  process.stdin.on('error', () => process.exit(0));
}

async function processHookData(inputData) {
  try {
    if (!inputData) return;

    const hookData = JSON.parse(inputData);
    const sessionId = hookData.session_id;
    const transcriptPath = hookData.transcript_path;

    if (!sessionId) return;

    const projectDir = process.env.CLAUDE_PROJECT_DIR;
    if (!projectDir) return;

    const projectName = path.basename(projectDir);
    const url = generateUrl(projectDir, sessionId);

    writeTmuxUrl(projectDir, url);

    // Parse transcript to get model
    const { model } = parseTranscript(transcriptPath);

    // Skip notification for haiku
    if (shouldSuppress(model)) {
      return;
    }

    await sendPushoverNotification(url, projectName);
  } catch (error) {}
}

main();

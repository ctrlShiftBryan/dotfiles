#!/usr/bin/env node

/**
 * Claude Code Hook: Send Pushover notification with session URL
 * 
 * This script generates a URL for the current Claude Code session
 * and sends a Pushover notification when the session ends.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const querystring = require('querystring');

// Configuration
const CONFIG = {
  host: 'bryans-macbook-pro-m4.tail67c0d1.ts.net',
  port: '5174',
  viewParam: 'condensed'
};

/**
 * Transform a file path to URL-safe format
 * /Users/bryan/project -> -Users-bryan-project
 */
function pathToUrlSegment(filePath) {
  return filePath.replace(/\//g, '-');
}

/**
 * Generate the session URL
 */
function generateUrl(projectPath, sessionId) {
  const urlPath = pathToUrlSegment(projectPath);
  return `http://${CONFIG.host}:${CONFIG.port}/${urlPath}/sessions/${sessionId}?view=${CONFIG.viewParam}`;
}

/**
 * Write URL to tmux-urls.cfg file
 */
function writeTmuxUrl(projectDir, url) {
  const tmuxConfigPath = path.join(projectDir, 'tmux-urls.cfg');
  const line = `z: ${url}`;

  try {
    let existing = '';
    try {
      existing = fs.readFileSync(tmuxConfigPath, 'utf8');
    } catch (_) {
      // File does not exist yet
    }

    // Parse existing content and replace or add z: entry
    const lines = existing.split('\n');
    const updatedLines = [];
    let zFound = false;

    for (const existingLine of lines) {
      if (existingLine.startsWith('z:')) {
        // Replace existing z: line with new one
        updatedLines.push(line);
        zFound = true;
      } else if (existingLine.trim()) {
        // Keep other non-empty lines
        updatedLines.push(existingLine);
      }
    }

    // If no z: line was found, add it
    if (!zFound) {
      updatedLines.push(line);
    }

    // Write the updated content
    fs.writeFileSync(tmuxConfigPath, updatedLines.join('\n') + '\n');
  } catch (error) {
    // Silently ignore write errors
  }
}

/**
 * Send Pushover notification
 */
function sendPushoverNotification(url, projectName) {
  const apiToken = process.env.PUSHOVER_API_TOKEN;
  const userKey = process.env.PUSHOVER_USER_KEY;

  if (!apiToken || !userKey) {
    return;
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

  const req = https.request(options, (res) => {
    // Silently handle response
    res.on('data', () => { });
  });

  req.on('error', (error) => {
    console.error(`Pushover error: ${error.message}`);
  });

  req.write(postData);
  req.end();
}

/**
 * Main execution
 */
async function main() {
  try {
    // Read JSON input from stdin
    let inputData = '';

    // Set a timeout for reading stdin (Claude Code provides input quickly)
    const readTimeout = setTimeout(() => {
      if (inputData) {
        processHookData(inputData);
      }
      process.exit(0);
    }, 100);

    process.stdin.setEncoding('utf8');

    process.stdin.on('data', (chunk) => {
      inputData += chunk;
    });

    process.stdin.on('end', () => {
      clearTimeout(readTimeout);
      processHookData(inputData);
    });

    process.stdin.on('error', () => {
      process.exit(0);
    });

  } catch (error) {
    process.exit(0);
  }
}

function processHookData(inputData) {
  try {
    if (!inputData) {
      return;
    }

    // Parse the JSON input
    const hookData = JSON.parse(inputData);

    // Extract session_id from JSON
    const sessionId = hookData.session_id;
    if (!sessionId) {
      return;
    }

    // Get project directory from environment variable
    const projectDir = process.env.CLAUDE_PROJECT_DIR;
    if (!projectDir) {
      return;
    }

    // Get project name from directory
    const projectName = path.basename(projectDir);

    // Generate the URL
    const url = generateUrl(projectDir, sessionId);

    // Write to tmux-urls.cfg
    writeTmuxUrl(projectDir, url);

    // Send Pushover notification
    sendPushoverNotification(url, projectName);

  } catch (error) {
    // Silently handle errors
  }
}

// Run the script
main();

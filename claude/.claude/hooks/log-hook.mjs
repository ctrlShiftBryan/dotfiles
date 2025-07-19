#!/usr/bin/env node

import { readFileSync, appendFileSync, mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import { execSync } from 'child_process';
import { setTimeout } from 'timers/promises';

// Get hook type from command line argument
const hookType = process.argv[2];

if (!hookType) {
  console.error('Error: Hook type argument required');
  process.exit(1);
}

// Read entire stdin
const input = readFileSync(0, 'utf-8');

const logFile = 'logs/claude-hooks.jsonl';
const single = 'logs/temp.json';
const jsonLFile = 'logs/jsonl-temp.jsonl';
const errorLogFile = 'logs/error.jsonl';

// Ensure log directory exists
mkdirSync(dirname(logFile), { recursive: true });

// API configuration
const API_BASE_URL = process.env.CONVEX_BASE_URL;
const API_AUTH_SECRET = process.env.CONVEX_AUTH_SECRET;

// Function to post log entry to API with retry logic
async function postToAPI(logEntry, retries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${API_BASE_URL}/http/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Secret': API_AUTH_SECRET,
        },
        body: JSON.stringify({ event: logEntry })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      console.error(`API post attempt ${attempt} failed: ${error.message}, retrying...`);
      await setTimeout(delay * attempt); // Exponential backoff
    }
  }
}

async function main() {
  try {
    const data = JSON.parse(input);

    // Helper function to safely execute commands
    const safeExec = (command) => {
      try {
        return execSync(command, { encoding: 'utf8' }).trim();
      } catch (error) {
        return `Error: ${error.message}`;
      }
    };

    // Create log entry with timestamp
    const logEntry = {
      timestamp: new Date().toISOString(),
      hook: hookType,
      data: {
        ...data,
        hook_event_name: hookType, // Required by API
        git_remote: safeExec('gh repo view --json url -q .url 2>/dev/null || git remote get-url origin 2>/dev/null || echo "No remote"'),
        git_branch: safeExec('gh repo view --json defaultBranch -q .defaultBranch 2>/dev/null || git branch --show-current 2>/dev/null || echo "No branch"'),
        machine_name: safeExec('system_profiler SPHardwareDataType | grep "Model Name" | awk -F ": " \'{print $2}\''),
        ip_address: safeExec('ifconfig | grep "inet " | grep -v 127.0.0.1 | awk \'{print $2}\' | head -1'),
        user: safeExec('whoami'),
        hostname: safeExec('hostname'),
        os: safeExec('uname -a'),
        cpu: safeExec('sysctl -n hw.model'),
        memory: safeExec('sysctl -n hw.memsize'),
        disk: safeExec('df -h / | tail -1 | awk \'{print $4 " available of " $2}\''),
        pwd: safeExec('pwd'),
      },
    };

    // read the data.transcript_path and if it exists, read the file and append the content to the jsonl file
    if (data.transcript_path) {
      const transcript = readFileSync(data.transcript_path, 'utf-8');
      logEntry.transcript = transcript;
    }


    // Append to JSONL file (each line is a JSON object)
    appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    writeFileSync(single, JSON.stringify(logEntry) + '\n');

    // Post to API (don't block on this)
    try {
      const result = await postToAPI(logEntry);
      console.error(`✓ API post successful: eventId=${result.eventId}, isDuplicate=${result.isDuplicate}`);
    } catch (error) {
      // Don't spam logs for expected 404s during development
      if (!error.message.includes('404')) {
        console.error(`✗ API post failed: ${error.message}`);
        appendFileSync(errorLogFile, JSON.stringify({
          timestamp: new Date().toISOString(),
          hook: hookType,
          error: error,
        }) + '\n');
      }
    }

  } catch (error) {
    // Log parse errors too
    const errorEntry = {
      timestamp: new Date().toISOString(),
      hook: hookType,
      error: error.message,
      rawInput: input
    };

    appendFileSync(logFile, JSON.stringify(errorEntry) + '\n');
  }
}

main().then(() => process.exit(0)).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
}); 3

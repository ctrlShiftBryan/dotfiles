#!/usr/bin/env node

// Main branch guard — used by both PreToolUse (Edit|Write) and PostToolUse (ExitPlanMode)
// PreToolUse: exits non-zero to BLOCK the tool until user decides
// PostToolUse: outputs warning only (tool already ran)
// Uses a marker file so it only fires once per session

const { execSync } = require("child_process");
const fs = require("fs");
const crypto = require("crypto");
const path = require("path");
const os = require("os");

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const hookEvent = process.env.CLAUDE_HOOK_EVENT || "";
const hash = crypto
  .createHash("md5")
  .update(projectDir)
  .digest("hex")
  .slice(0, 8);
const markerFile = path.join(os.tmpdir(), `claude-main-guard-${hash}`);

// Already fired this session — allow through
if (fs.existsSync(markerFile)) process.exit(0);

try {
  const branch = execSync("git rev-parse --abbrev-ref HEAD", {
    encoding: "utf-8",
    cwd: projectDir,
    stdio: ["pipe", "pipe", "pipe"],
  }).trim();

  if (branch === "main" || branch === "master") {
    // Create marker so subsequent calls pass through
    fs.writeFileSync(markerFile, new Date().toISOString());

    const msg = `⚠️ MAIN BRANCH GUARD: You are on "${branch}". STOP and use AskUserQuestion to ask: "You're on the main branch. How should this plan be handled?" with options: "Implement here on main" and "Post as GitHub issue". Do NOT proceed with implementation until the user answers.`;

    console.log(msg);

    // PreToolUse: block the tool call to force the question
    // PostToolUse: just warn (tool already executed)
    if (hookEvent === "PreToolUse") {
      process.exit(1);
    }
  }
} catch {
  // Not a git repo or git not available — skip
}

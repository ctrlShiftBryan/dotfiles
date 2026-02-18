#!/usr/bin/env node

/**
 * Claude Code Hook: Report session start to Anders/Convex
 * Event: SessionStart
 */

const { execSync } = require("child_process");
const https = require("https");

const CONVEX_SITE_URL = "https://zany-antelope-934.convex.site";

function gitCmd(cmd, cwd) {
  try {
    return execSync(cmd, { cwd, encoding: "utf8", timeout: 5000 }).trim();
  } catch {
    return "";
  }
}

function post(path, data) {
  const body = JSON.stringify(data);
  const url = new URL(path, CONVEX_SITE_URL);
  const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
    },
  };
  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      res.on("data", () => {});
      res.on("end", resolve);
    });
    req.on("error", () => resolve());
    req.write(body);
    req.end();
  });
}

async function main() {
  let inputData = "";
  process.stdin.setEncoding("utf8");

  const timeout = setTimeout(async () => {
    if (inputData) await processData(inputData);
    process.exit(0);
  }, 500);

  process.stdin.on("data", (chunk) => {
    inputData += chunk;
  });

  process.stdin.on("end", async () => {
    clearTimeout(timeout);
    await processData(inputData);
    process.exit(0);
  });

  process.stdin.on("error", () => process.exit(0));
}

async function processData(raw) {
  try {
    const hookData = JSON.parse(raw);
    const sessionId = hookData.session_id;
    if (!sessionId) return;

    const cwd =
      hookData.cwd ||
      hookData.workspace?.project_dir ||
      process.env.CLAUDE_PROJECT_DIR;
    if (!cwd) return;

    const branch = gitCmd("git branch --show-current", cwd);
    const gitRemote = gitCmd("git remote get-url origin", cwd);

    // Detect mode
    const mode = cwd.includes("openclaw") ? "anders" : "dev";

    // Try reading model from /tmp/claude-code-model (written by repo-local hook)
    let model = "";
    try {
      const fs = require("fs");
      model = fs.readFileSync("/tmp/claude-code-model", "utf8").trim();
    } catch {
      // no-op
    }

    await post("/hooks/session-start", {
      cliSessionId: sessionId,
      cwd,
      branch,
      gitRemote,
      model,
      mode,
    });
  } catch {
    // Silent fail
  }
}

main();

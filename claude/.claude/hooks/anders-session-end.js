#!/usr/bin/env node

/**
 * Claude Code Hook: Report session end/turn to Anders/Convex
 * Event: Stop (fires at end of each turn with cost data)
 */

const fs = require("fs");
const https = require("https");

const CONVEX_SITE_URL = "https://zany-antelope-934.convex.site";

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

function readFirstUserPrompt(transcriptPath) {
  try {
    const content = fs.readFileSync(transcriptPath, "utf8");
    const lines = content.trim().split("\n");
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line);
        if (entry.type === "user" && entry.message?.content) {
          const text =
            typeof entry.message.content === "string"
              ? entry.message.content
              : JSON.stringify(entry.message.content);
          return text.slice(0, 200);
        }
      } catch {
        // skip malformed line
      }
    }
  } catch {
    // no-op
  }
  return "";
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

    const costUsd = hookData.cost?.total_cost_usd ?? undefined;
    const model = hookData.model?.display_name ?? undefined;

    // Read first user prompt as summary
    const summary = hookData.transcript_path
      ? readFirstUserPrompt(hookData.transcript_path)
      : "";

    await post("/hooks/session-end", {
      cliSessionId: sessionId,
      costUsd,
      model,
      summary: summary || undefined,
    });
  } catch {
    // Silent fail
  }
}

main();

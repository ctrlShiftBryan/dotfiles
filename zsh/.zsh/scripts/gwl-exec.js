#!/usr/bin/env node
// gwl-exec — interactive worktree list with single-keypress navigation

const { execSync } = require("child_process");
const fs = require("fs");

const GREEN = "\x1b[32m";
const BLUE = "\x1b[34m";
const RED = "\x1b[31m";
const DIM = "\x1b[90m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

function run(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch {
    return "";
  }
}

function main() {
  if (!run("git rev-parse --is-inside-work-tree")) {
    console.error("Error: Not in a git repository");
    process.exit(1);
  }

  if (run("git rev-parse --git-common-dir") !== run("git rev-parse --git-dir")) {
    console.error("Error: Run from main repo, not a worktree");
    process.exit(1);
  }

  let mainBranch;
  if (run("git show-ref --verify refs/heads/main")) mainBranch = "main";
  else if (run("git show-ref --verify refs/heads/master")) mainBranch = "master";
  else { console.error("Error: No main/master branch"); process.exit(1); }

  // Parse worktree list — extract branch → path mapping
  const raw = run("git worktree list");
  if (!raw) { console.log("No worktrees found"); process.exit(0); }

  const worktrees = []; // { branch, wtPath }
  for (const line of raw.split("\n")) {
    if (line.includes("(detached HEAD)")) continue;
    const match = line.match(/\[([^\]]+)\]$/);
    if (!match) continue;
    const branch = match[1];
    if (branch === mainBranch) continue;
    const wtPath = line.trim().split(/\s+/)[0];
    worktrees.push({ branch, wtPath });
  }

  if (worktrees.length === 0) { console.log("No worktrees (besides main)"); process.exit(0); }

  // Batch: get all branch dates in one git call
  const branchSet = new Set(worktrees.map((w) => w.branch));
  const dateMap = {}; // branch → { sortDate, relDate }
  const refLines = run(
    `git for-each-ref --format="%(refname:short)|%(committerdate:short)|%(committerdate:relative)" refs/heads/`
  );
  for (const line of refLines.split("\n")) {
    const [ref, sortDate, ...relParts] = line.split("|");
    if (branchSet.has(ref)) {
      dateMap[ref] = { sortDate: sortDate || "0000-00-00", relDate: relParts.join("|") || "unknown" };
    }
  }

  // Batch: get all PRs in one gh call
  const prMap = {}; // branch → { number, state }
  const hasGh = !!run("command -v gh");
  if (hasGh) {
    const prJson = run(
      `gh pr list --state all --limit 200 --json headRefName,number,state`
    );
    if (prJson) {
      try {
        for (const pr of JSON.parse(prJson)) {
          // Keep first match per branch (most recent)
          if (!prMap[pr.headRefName]) {
            prMap[pr.headRefName] = { number: pr.number, state: pr.state };
          }
        }
      } catch {}
    }
  }

  // Build entries
  const entries = [];
  const mergedBranches = [];

  for (const { branch, wtPath } of worktrees) {
    const dates = dateMap[branch] || { sortDate: "0000-00-00", relDate: "unknown" };

    let status = `${DIM}○ no PR${RESET}`;
    const pr = prMap[branch];
    if (pr) {
      switch (pr.state) {
        case "MERGED":
          status = `${GREEN}✓ merged${RESET}`;
          mergedBranches.push(branch);
          break;
        case "OPEN":
          status = `${BLUE}↑ PR #${pr.number}${RESET}`;
          break;
        case "CLOSED":
          status = `${RED}✗ closed #${pr.number}${RESET}`;
          break;
      }
    }

    entries.push({ branch, wtPath, sortDate: dates.sortDate, relDate: dates.relDate, status });
  }

  entries.sort((a, b) => a.sortDate.localeCompare(b.sortDate));

  // Display
  console.log("");
  console.log(`${BOLD}Worktrees:${RESET}`);
  console.log("");
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const num = String(i + 1).padStart(2);
    const branch = e.branch.padEnd(45);
    const date = e.relDate.padEnd(14);
    console.log(`  ${BOLD}${num}${RESET}  ${branch} ${date} ${e.status}`);
  }

  if (mergedBranches.length > 0) {
    console.log("");
    console.log(`Cleanup: gwc ${mergedBranches.join(" ")}`);
  }

  console.log("");
  const hints = [`1-${entries.length} cd`, `c cleanup`, `Esc/q cancel`];
  console.log(`${DIM}${hints.join("  •  ")}${RESET}`);

  // Interactive keypress
  const { stdin } = process;
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding("utf8");

  let buffer = "";
  let timer = null;

  const writeResult = (value) => {
    const f = process.env.GWL_RESULT_FILE;
    if (f) fs.writeFileSync(f, value + "\n");
  };

  const select = (idx) => {
    stdin.setRawMode(false);
    stdin.pause();
    if (idx < 1 || idx > entries.length) {
      console.log(`Invalid selection: ${idx}`);
      process.exit(1);
    }
    const selected = entries[idx - 1];
    console.log(`→ ${selected.branch}`);
    writeResult(selected.wtPath);
    process.exit(0);
  };

  const cancel = () => {
    stdin.setRawMode(false);
    stdin.pause();
    process.exit(0);
  };

  stdin.on("data", (key) => {
    if (key === "c") {
      if (timer) clearTimeout(timer);
      stdin.setRawMode(false);
      stdin.pause();
      writeResult("CLEANUP");
      process.exit(0);
    }
    if (key === "\x1b" || key === "q") { if (timer) clearTimeout(timer); cancel(); return; }
    if (key === "\x03") { if (timer) clearTimeout(timer); cancel(); return; }
    if (key === "\r" || key === "\n") {
      if (timer) clearTimeout(timer);
      if (buffer) select(parseInt(buffer, 10));
      return;
    }
    if (key >= "0" && key <= "9") {
      buffer += key;
      if (timer) clearTimeout(timer);
      if (entries.length <= 9) {
        select(parseInt(buffer, 10));
      } else {
        timer = setTimeout(() => select(parseInt(buffer, 10)), 500);
      }
    }
  });
}

main();

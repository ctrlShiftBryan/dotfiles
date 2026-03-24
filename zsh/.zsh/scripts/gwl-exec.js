#!/usr/bin/env node
// gwl-exec — interactive worktree list with single-keypress navigation
// Outputs selected worktree path to GWL_RESULT_FILE for shell wrapper to cd into.

const { execSync } = require("child_process");

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
  // Validate git repo
  if (!run("git rev-parse --is-inside-work-tree")) {
    console.error("Error: Not in a git repository");
    process.exit(1);
  }

  // Validate main repo (not inside a worktree)
  const commonDir = run("git rev-parse --git-common-dir");
  const gitDir = run("git rev-parse --git-dir");
  if (commonDir !== gitDir) {
    console.error("Error: Run from main repo, not a worktree");
    process.exit(1);
  }

  // Determine main branch
  let mainBranch;
  if (run("git show-ref --verify refs/heads/main")) mainBranch = "main";
  else if (run("git show-ref --verify refs/heads/master")) mainBranch = "master";
  else {
    console.error("Error: No main/master branch");
    process.exit(1);
  }

  // Parse worktree list
  const raw = run("git worktree list");
  if (!raw) {
    console.log("No worktrees found");
    process.exit(0);
  }

  const entries = [];
  const mergedBranches = [];

  for (const line of raw.split("\n")) {
    const parts = line.trim().split(/\s+/);
    const wtPath = parts[0];

    if (line.includes("(detached HEAD)")) continue;

    // Extract branch from [branch]
    const match = line.match(/\[([^\]]+)\]$/);
    if (!match) continue;
    const branch = match[1];
    if (branch === mainBranch) continue;

    // Last commit dates
    const sortDate = run(`git log -1 --format="%ci" "${branch}"`)?.split(" ")[0] || "0000-00-00";
    const relDate = run(`git log -1 --format="%cr" "${branch}"`) || "unknown";

    // PR status
    let status = `${DIM}○ no PR${RESET}`;
    const hasGh = !!run("command -v gh");
    if (hasGh) {
      const prInfo = run(
        `gh pr list --head "${branch}" --state all --json number,state --jq '.[0] | "\\(.number) \\(.state)"'`
      );
      if (prInfo && prInfo !== "null null") {
        const [prNum, prState] = prInfo.split(" ");
        switch (prState) {
          case "MERGED":
            status = `${GREEN}✓ merged${RESET}`;
            mergedBranches.push(branch);
            break;
          case "OPEN":
            status = `${BLUE}↑ PR #${prNum}${RESET}`;
            break;
          case "CLOSED":
            status = `${RED}✗ closed #${prNum}${RESET}`;
            break;
        }
      }
    }

    entries.push({ branch, wtPath, sortDate, relDate, status });
  }

  // Sort by date (oldest first)
  entries.sort((a, b) => a.sortDate.localeCompare(b.sortDate));

  if (entries.length === 0) {
    console.log("No worktrees (besides main)");
    process.exit(0);
  }

  // Display numbered list
  console.log("");
  console.log(`${BOLD}Worktrees:${RESET}`);
  console.log("");
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const num = `${BOLD}${i + 1}${RESET}`;
    const branch = e.branch.padEnd(45);
    const date = e.relDate.padEnd(12);
    console.log(`  ${num}  ${branch} ${date} ${e.status}`);
  }

  // Cleanup suggestion
  if (mergedBranches.length > 0) {
    console.log("");
    console.log(`Cleanup: gwc ${mergedBranches.join(" ")}`);
  }

  console.log("");
  const hints = [`1-${entries.length} cd`, `c cleanup`, `Esc/q cancel`];
  console.log(`${DIM}${hints.join("  •  ")}${RESET}`);

  // Single-keypress input
  const { stdin } = process;
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding("utf8");

  // For multi-digit: collect digits, execute on Enter or after timeout
  let buffer = "";
  let timeout = null;

  const select = (idx) => {
    stdin.setRawMode(false);
    stdin.pause();
    if (idx < 1 || idx > entries.length) {
      console.log(`Invalid selection: ${idx}`);
      process.exit(1);
    }
    const selected = entries[idx - 1];
    console.log(`→ ${selected.branch}`);
    // Write path to result file
    const resultFile = process.env.GWL_RESULT_FILE;
    if (resultFile) {
      require("fs").writeFileSync(resultFile, selected.wtPath + "\n");
    }
    process.exit(0);
  };

  const cancel = () => {
    stdin.setRawMode(false);
    stdin.pause();
    process.exit(0);
  };

  stdin.on("data", (key) => {
    // c — cleanup merged worktrees
    if (key === "c") {
      if (timeout) clearTimeout(timeout);
      stdin.setRawMode(false);
      stdin.pause();
      const resultFile = process.env.GWL_RESULT_FILE;
      if (resultFile) {
        require("fs").writeFileSync(resultFile, "CLEANUP\n");
      }
      process.exit(0);
    }
    // Esc or q
    if (key === "\x1b" || key === "q") {
      if (timeout) clearTimeout(timeout);
      cancel();
      return;
    }
    // Ctrl-C
    if (key === "\x03") {
      if (timeout) clearTimeout(timeout);
      cancel();
      return;
    }
    // Enter — execute buffered number
    if (key === "\r" || key === "\n") {
      if (timeout) clearTimeout(timeout);
      if (buffer) {
        select(parseInt(buffer, 10));
      }
      return;
    }
    // Digit
    if (key >= "0" && key <= "9") {
      buffer += key;
      if (timeout) clearTimeout(timeout);
      // If single digit covers all entries, select immediately
      if (entries.length <= 9) {
        select(parseInt(buffer, 10));
      } else {
        // Multi-digit: wait 500ms or Enter
        timeout = setTimeout(() => {
          select(parseInt(buffer, 10));
        }, 500);
      }
      return;
    }
  });
}

main();

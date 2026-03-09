---
name: git-squash
description: Squash feature branch commits into one. Use when user says "squash branch", "squash commits", "git squash", "gsqa", "gsqam", "clean up commits", "squash my branch", "flatten commits", "prepare branch for merge".
---

# Git Squash Branch

Squash all commits on the current feature branch into a single commit against the base branch (auto-detects main/master).

## Step 1: Prepare

Run the prepare phase script:

```bash
bash ~/.claude/skills/git-squash/scripts/git-squash.sh prepare
```

The script outputs JSON with `branch`, `base`, `commits_summary`, `commit_count`, and `status`. If it exits non-zero, report the error to the user and stop.

## Step 2: Compose Commit Message

Using the `commits_summary` from the script output, write a concise commit message that summarizes all the squashed commits. Use AskUserQuestion to show the proposed message and let the user approve or edit it.

## Step 3: Commit

Run the commit phase with the user's approved message:

```bash
bash ~/.claude/skills/git-squash/scripts/git-squash.sh commit "<message>"
```

Show the diff output to the user so they can see what changed.

## Step 4: Confirm Force Push

Use AskUserQuestion to confirm the user wants to force push. Warn that this rewrites remote history for the branch.

## Step 5: Force Push

Run the push phase:

```bash
bash ~/.claude/skills/git-squash/scripts/git-squash.sh push
```

Report success. Remind user a backup branch exists (`{branch}_backup`) if they need to recover.

## Error Handling

- If any phase exits non-zero, read stderr and report the issue
- Merge conflicts: tell user to resolve manually, then re-run
- Dirty working tree: tell user to commit or stash first
- On base branch: tell user to checkout their feature branch first

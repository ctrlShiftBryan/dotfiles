---
name: intake-issue
description: "Intake GitHub issue or task: create branch, worktree, and init dev environment"
---

# Intake Issue

Automate issue intake: parse input, create worktree in sibling directory, init dev environment.

## Scripts

All scripts are in `scripts/` directory relative to this skill. They output JSON for easy parsing.

- `git-state.sh` - Check repo state, current/default branch
- `parse-issue.sh <input>` - Parse GitHub issue or text, suggest branch name
- `create-worktree.sh <branch> [base]` - Create worktree in sibling dir
- `init-worktree.sh` - Run in worktree to install dependencies
- `github-issue-ops.sh <issue_number> <worktree_name>` - Assign issue + add hostname label
- `create-prd.sh <worktree_path> <branch_name> [issue_number] [title]` - Write PRD.{branch}.md from issue content

## Orchestration Steps

### Step 1: Check Git State

```bash
SKILL_DIR="$(dirname "$(readlink -f ~/.claude/skills/intake-issue/SKILL.md)")"
bash "$SKILL_DIR/scripts/git-state.sh"
```

Parse JSON output. If `on_default` is false:
- Use AskUserQuestion: "Not on {default_branch} (currently on {current_branch}). Continue anyway?"
- Options: "Continue from {current_branch}", "Checkout {default_branch} first"

If user chooses checkout: `git checkout {default_branch}`

### Step 2: Parse Input

```bash
bash "$SKILL_DIR/scripts/parse-issue.sh" "{user_input}"
```

**Exit codes:**
- 0: Success, JSON has `branch`, `title`, `type`, optionally `number`
- 1: Error (show error message)
- 2: gh CLI missing - prompt user to manually enter issue title

### Step 2b: Generate Concise Slug (Haiku)

Use Task tool with `model: "haiku"` to generate a concise branch slug:

**Prompt to haiku:**
```
Generate a concise git branch slug (2-4 words, max 20 chars) from this issue title.
Return ONLY the slug, lowercase, hyphens between words.

Title: "{title}"

Examples:
- "Golden Player Scrape Transaction Timeout due to missing index" → "scrape-timeout"
- "Add dropdown filters to player search page" → "player-dropdowns"
- "Fix authentication bug when session expires" → "session-auth-fix"
```

Construct final branch: `{type}/{number}-{haiku_slug}` or `{type}/{haiku_slug}` (no number)

### Step 3: Create Worktree

```bash
bash "$SKILL_DIR/scripts/create-worktree.sh" "{branch_name}" "{base_branch}"
```

**Exit codes:**
- 0: Success, JSON has `worktree_path`
- 1: Not git repo
- 2: Branch exists - JSON has `existing_worktree` if applicable
  - AskUserQuestion: "Branch exists. Use existing worktree or pick new name?"
- 3: Path exists - suggest `git worktree list`
- 4: Git error

### Step 4: Init Worktree

```bash
cd "{worktree_path}"
bash "$SKILL_DIR/scripts/init-worktree.sh"
```

This will:
- Run `init-worktree.sh` if it exists in the repo
- Otherwise detect package manager and run install
- Skip if no package.json

### Step 4b: GitHub Issue Ops (skip if no issue number or gh CLI missing)

```bash
bash "$SKILL_DIR/scripts/github-issue-ops.sh" "{issue_number}" "{branch_name}"
```

This will:
- Assign issue to `@me`
- Add label `{hostname}:{branch_name}` to issue (creates label if needed)
- Non-fatal: if this fails, continue workflow

### Step 4c: Create PRD.md

```bash
bash "$SKILL_DIR/scripts/create-prd.sh" "{worktree_path}" "{branch_name}" "{issue_number}" "{title}"
```

Filename will be `PRD.{branch_with_dots}.md` (e.g. `PRD.feat.277-player-dropdowns.md`)

- If issue number exists: fetches full issue from GitHub, writes title/url/labels/body
- If text-only input: writes minimal PRD with title
- Non-fatal: if this fails, continue workflow

### Step 4d: Push Branch & Open Draft PR

The PRD filename is `PRD.{branch_with_dots}.md` (e.g. `PRD.feat.277-player-dropdowns.md`).

Run from inside the worktree:

```bash
cd "{worktree_path}"
git add PRD.*.md
git commit -m "docs: add PRD for {title}"
git push -u origin "{branch_name}"
```

Then open a draft PR using the PRD as the body:

```bash
gh pr create --draft --title "{title}" --body "$(cat PRD.*.md)"
```

- Non-fatal: if push or PR creation fails, continue workflow
- Skip if gh CLI missing

### Step 5: Finalize

Change working directory to worktree. Output summary:

```
✓ Branch: feat/277-player-dropdowns
✓ Path: /code/project-worktrees/feat/277-player-dropdowns
✓ Dependencies installed
✓ Assigned to @me
✓ Label: bryans-mac:feat/277-player-dropdowns
✓ PRD.feat.277-player-dropdowns.md created
✓ Draft PR opened: https://github.com/org/repo/pull/280
Ready to work!
```

## Edge Cases

| Condition | Handling |
|-----------|----------|
| Not git repo | Error with clear message |
| Not on main branch | AskUserQuestion to continue or checkout |
| Branch exists | Offer existing worktree or new name |
| Worktree path exists | Error, show `git worktree list` |
| gh CLI missing | Fallback to manual title input, skip issue ops |
| No package.json | Skip install, still success |
| Text input (no issue #) | Skip github-issue-ops, PRD.md gets text only |
| Issue fetch fails for PRD | Non-fatal, continue workflow |
| Label already exists | gh label create --force handles it |
| Push/PR creation fails | Non-fatal, continue workflow |
| Text input (no issue #) | PR body is PRD.md content, no "Closes" link |

## Example Usage

```
/intake-issue https://github.com/org/repo/issues/277
/intake-issue 277
/intake-issue "Add user authentication"
/intake-issue fix the login bug
```

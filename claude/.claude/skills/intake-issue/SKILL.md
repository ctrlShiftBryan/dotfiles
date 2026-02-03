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

### Step 5: Finalize

Change working directory to worktree. Output summary:

```
✓ Branch: feat/277-player-dropdowns
✓ Path: /code/project-worktrees/feat/277-player-dropdowns
✓ Dependencies installed
Ready to work!
```

## Edge Cases

| Condition | Handling |
|-----------|----------|
| Not git repo | Error with clear message |
| Not on main branch | AskUserQuestion to continue or checkout |
| Branch exists | Offer existing worktree or new name |
| Worktree path exists | Error, show `git worktree list` |
| gh CLI missing | Fallback to manual title input |
| No package.json | Skip install, still success |

## Example Usage

```
/intake-issue https://github.com/org/repo/issues/277
/intake-issue 277
/intake-issue "Add user authentication"
/intake-issue fix the login bug
```

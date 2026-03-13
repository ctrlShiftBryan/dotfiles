---
name: folder-ai
description: "Create and manage AI workspace context using the folder method - plain folders + markdown files with session tracking"
---

# folder-ai

Set up and manage AI workspace context using the "folder method": plain folders + markdown files as context, with automatic session tracking via hooks.

## Scripts

All commands run via `cli.js`:

```bash
SKILL_DIR="$(dirname "$(readlink -f ~/.claude/skills/folder-ai/SKILL.md)")"
```

- `node "$SKILL_DIR/cli.js" init` — Create workspace structure (non-interactive)
- `node "$SKILL_DIR/cli.js" install` — Register SessionStart/SessionEnd hooks
- `node "$SKILL_DIR/cli.js" uninstall` — Remove hooks
- `node "$SKILL_DIR/cli.js" status` — Show workspace state

## `/folder-ai init` Flow

Interactive workspace setup orchestrated by Claude.

### Step 1: Check Existing

Check if `repositories.md` or `sessions/` already exist in the current directory.

If they exist, use AskUserQuestion: "folder-ai workspace already exists here. Overwrite or skip?"
- If skip: exit with summary of existing state
- If overwrite: continue

### Step 2: Create Base Structure

```bash
node "$SKILL_DIR/cli.js" init
```

This creates: `sessions/`, `issues/`, `repositories.md`, `people.md`, `learnings.md`, and appends to `CLAUDE.md`.

### Step 3: Repositories

Auto-detect git repos. Run:

```bash
find ~/code -maxdepth 2 -name .git -type d 2>/dev/null | head -20 | while read d; do echo "$(dirname "$d")"; done
```

Present the list via AskUserQuestion: "Found these repos. Select which to include (comma-separated numbers), or type paths manually:"

For each selected repo, use AskUserQuestion: "Strategy for {repo}? (trunk/worktree/pullrequest)"

Then update `repositories.md` with the selections. Use the init module:

```javascript
// Called by Claude after gathering repo info
const { writeRepositories } = require('./lib/init')
writeRepositories(root, [{ name: 'repo', path: '/path', strategy: 'trunk' }])
```

### Step 4: People

Use AskUserQuestion: "Track people for this project? (yes/no)"

If yes, use AskUserQuestion: "Enter people (one per line: name, role, context):"

Update `people.md` with entries.

### Step 5: Learnings

`learnings.md` was already created in Step 2 with section headers. No interaction needed. Explain to user that Claude will read this every session and append new entries when something noteworthy is discovered.

### Step 6: Turbocommit Integration

Check if turbocommit is installed:

```bash
test -f ~/.claude/skills/turbocommit/cli.js && echo "installed" || echo "not installed"
```

If not installed, suggest: "turbocommit not found. Consider installing it for auto-commits."

If installed, ask: "Run turbocommit init in this project? (yes/no)"

If yes:
```bash
node ~/.claude/skills/turbocommit/cli.js init
```

### Step 7: Install Hooks

```bash
node "$SKILL_DIR/cli.js" install
```

This registers SessionStart and SessionEnd hooks in `~/.claude/settings.json`. Chains safely with turbocommit hooks.

### Step 8: .gitignore

Use AskUserQuestion: "Add sessions/ to .gitignore? (yes/no) — sessions contain per-machine data"

If yes, append `sessions/` to `.gitignore` (create if needed, check for existing entry).

### Step 9: Summary

Output what was created:

```
folder-ai workspace initialized:
  - repositories.md (N repos)
  - people.md
  - learnings.md
  - issues/README.md
  - sessions/sessions.md
  - CLAUDE.md updated with routing table
  - Hooks: SessionStart, SessionEnd
```

## `/folder-ai new` Flow (Issue Intake)

### Step 1: Goal

Use AskUserQuestion (free-form): "What are you trying to accomplish?"

### Step 2: Definition of Done

Use AskUserQuestion (free-form): "What does done look like?"

### Step 3: Create Issue

Generate a short slug from the goal (e.g., "fix-auth-timeout"). Create `issues/{slug}.md`:

```markdown
# {title derived from goal}
**Created:** {timestamp}
**Status:** open

## Goal
{user's answer from step 1}

## Definition of Done
{user's answer from step 2}
```

Output confirmation with file path.

## `/folder-ai status`

```bash
node "$SKILL_DIR/cli.js" status
```

Shows which files exist, session count, repo count, open issues.

## Workspace Structure

```
project-root/
├── CLAUDE.md              # Routing table (the "floor plan")
├── repositories.md        # Repo index with strategies
├── people.md              # People involved
├── learnings.md           # Accumulated knowledge (read every session, append when noteworthy)
├── issues/                # Flexible issue tracking
│   └── README.md
└── sessions/              # Auto-tracked sessions
    ├── sessions.md        # Chronological index
    └── {session-id}.md    # Individual session files
```

## Example Usage

```
/folder-ai init          # Set up workspace interactively
/folder-ai new           # Create a new issue
/folder-ai status        # Check workspace state
```

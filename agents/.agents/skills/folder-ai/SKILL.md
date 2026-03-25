---
name: folder-ai
description: "Unified session tracking + auto-commits for Claude Code and Codex CLI workspaces. Plain folders + markdown context with multi-repo support."
---

# folder-ai

Unified session tracking, auto-commits, and workspace context using plain folders + markdown.

## Routing

Resolve the skill directory first:

```bash
SKILL_DIR="$(dirname "$(readlink -f ~/.claude/skills/folder-ai/SKILL.md)")"
```

Route based on the argument passed to `/folder-ai`:

| Command | Action |
|---------|--------|
| `/folder-ai` (no args) | Run `status` (see below) |
| `/folder-ai version` | Read and display version from `$SKILL_DIR/package.json` |
| `/folder-ai status` | Run `bun "$SKILL_DIR/src/cli.ts" status` and display output |
| `/folder-ai init` | Follow the **Init Flow** below |
| `/folder-ai new` | Follow the **New Issue Flow** below |
| `/folder-ai register` | Run `bun "$SKILL_DIR/src/cli.ts" register` |
| `/folder-ai unregister` | Run `bun "$SKILL_DIR/src/cli.ts" unregister` |
| `/folder-ai discover` | Run `bun "$SKILL_DIR/src/cli.ts" discover` |
| `/folder-ai install` | Run `bun "$SKILL_DIR/src/cli.ts" install` |
| `/folder-ai uninstall` | Run `bun "$SKILL_DIR/src/cli.ts" uninstall` |
| `/folder-ai install-codex` | Run `bun "$SKILL_DIR/src/cli.ts" install-codex` |
| `/folder-ai uninstall-codex` | Run `bun "$SKILL_DIR/src/cli.ts" uninstall-codex` |
| `/folder-ai watch install` | Run `bun "$SKILL_DIR/src/cli.ts" watch install` |
| `/folder-ai watch uninstall` | Run `bun "$SKILL_DIR/src/cli.ts" watch uninstall` |
| `/folder-ai watch status` | Run `bun "$SKILL_DIR/src/cli.ts" watch status` |
| `/folder-ai watch run` | Run `bun "$SKILL_DIR/src/cli.ts" watch run` |
| `/folder-ai watch backfill` | Run `bun "$SKILL_DIR/src/cli.ts" watch backfill` |
| `/folder-ai create <name>` | Run `bun "$SKILL_DIR/src/cli.ts" create <name>` |

For any version/about questions, read the version from package.json:
```bash
cat "$SKILL_DIR/package.json" | jq -r '.version'
```

## Init Flow (`/folder-ai init`)

Interactive workspace setup orchestrated by Claude.

### Step 1: Check Existing

Check if `repositories.md` or `sessions/` already exist.
If they exist, ask: "folder-ai workspace already exists here. Overwrite or skip?"

### Step 2: Create Base Structure

```bash
bun "$SKILL_DIR/src/cli.ts" init
```

Creates: `sessions/`, `issues/`, `repositories.md`, `people.md`, `learnings.md`, and appends to `CLAUDE.md`.

### Step 3: Repositories

Auto-detect git repos:

```bash
find ~/code -maxdepth 2 -name .git -type d 2>/dev/null | head -20 | while read d; do echo "$(dirname "$d")"; done
```

Present the list and ask which to include. For each, ask strategy (trunk/worktree/pullrequest).
Update `repositories.md` with selections.

### Step 4: People

Ask if people tracking is needed. If yes, collect name/role/context entries.

### Step 5: Install Hooks

```bash
bun "$SKILL_DIR/src/cli.ts" install
```

Registers Stop, SessionStart, SessionEnd hooks. Replaces any existing turbocommit hooks.

### Step 6: .gitignore

Ask about adding `sessions/` to `.gitignore`.

### Step 7: Summary

Output what was created.

## New Issue Flow (`/folder-ai new`)

1. Ask: "What are you trying to accomplish?"
2. Ask: "What does done look like?"
3. Create `issues/{slug}.md` with goal + definition of done.

## Auto-Commit System

folder-ai includes turbocommit's auto-commit functionality. On every turn-end:

1. **Stop hook** (Claude Code) or **notify** (Codex CLI) commits all changes across workspace + child repos
2. **Two-phase async**: fast commit with `[tc-pending]` tag, background LLM refinement

### Codex CLI Support

Auto-commits also work with Codex CLI via the `notify` system.

- **Install:** `/folder-ai install-codex` — adds `notify` line to `~/.codex/config.toml`
- **Uninstall:** `/folder-ai uninstall-codex` — removes it
- Hook fires on `agent-turn-complete`, same gating as Claude (kill switch → git root → config.enabled)
- Co-Authored-By uses `<noreply@openai.com>` with model from `~/.codex/config.toml`

### Multi-Repo Support

Child repos listed in `repositories.md` are committed independently. Each repo can have autocommit on/off via `.folder-ai.jsonl`:

```jsonl
{"autocommit":{"workspace":true,"children":{"~/code/app":true,"~/code/docs":false}}}
```

### Commit Message Generation

- **Phase 1 (instant):** Extract headline from last user prompt
- **Phase 2 (background):** LLM generates Conventional Commit title + body via `claude -p --model haiku`
- Co-Authored-By trailer with model attribution

## Watch System (Cron-Based Session Watcher)

Reads Claude Code's session JSONL + metrics files directly. No reliance on Claude writing summaries.

### Architecture

- **Cron** runs `watch.ts` every minute via Bun
- **watch.ts** scans registered projects, reads JSONL/metrics, creates session .md files
- **No daemon** — cron handles scheduling, script is idempotent

### Session Detection

| Source | When Written | Used For |
|--------|-------------|----------|
| `{uuid}.jsonl` | During session | Transcript, model detection |
| `{uuid}.metrics.json` | Session end | cost, duration, model |
| `{uuid}/session-memory/summary.md` | During session | Rich summary (best source) |

- `.metrics.json` exists → completed
- `.metrics.json` missing + stale → abandoned
- First event `type: "queue-operation"` → worker, skip
- `cost_usd == 0` → empty, skip

### Summary Priority Chain

1. **session-memory/summary.md** — richest source, no LLM needed
2. **Git log** — always available for repos with commits
3. **LLM mode** — pipe git data to `claude -p --model haiku`
4. **Fallback** — "No code changes recorded."

### Per-Project Config: `.folder-ai.jsonl`

```jsonl
{"enabled":true,"staleTimeoutMs":7200000,"summaryMode":"session-memory","commitMode":"async","autoPush":false,"coauthor":true,"autocommit":{"workspace":true,"children":{}}}
```

| Field | Default | Description |
|-------|---------|-------------|
| `enabled` | true | Enable/disable watcher |
| `staleTimeoutMs` | 7200000 (2h) | Abandon timeout |
| `summaryMode` | "session-memory" | "session-memory", "git", or "llm" |
| `commitMode` | "async" | "async" or "sync" |
| `autoPush` | false | Push after each commit |
| `coauthor` | true | Add Co-Authored-By trailer |
| `autocommit.workspace` | true | Auto-commit workspace repo |
| `autocommit.children` | {} | Per-child path → true/false |

## Workspace Structure

```
project-root/
├── CLAUDE.md              # Routing table
├── repositories.md        # Repo index + strategies
├── people.md              # Team members
├── learnings.md           # Accumulated knowledge
├── issues/                # Flexible issue tracking
│   └── README.md
├── sessions/              # Auto-tracked sessions
│   ├── sessions.md        # Index
│   └── YYYY-MM-DD-HHMM-{shortId}.md  # Session detail (sorts chronologically)
└── .folder-ai.jsonl       # Per-project config
```

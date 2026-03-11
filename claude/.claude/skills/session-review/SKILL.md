---
name: session-review
description: Extract Claude Code session data, rate effectiveness, and write structured notes to Obsidian Staff Engineering vault. Triggers on "/session-review", "session review", "review sessions", "claude usage", or "how much did I use claude".
---

# Session Review Skill

Extract session data from Claude Code history, rate effectiveness per project, and write structured notes to the Staff Engineering Obsidian vault (ACE system).

## Invocation

- `/session-review` — review yesterday's sessions
- `/session-review YYYY-MM-DD` — review a specific date

## Vault

Staff Engineering vault at `~/staff-engineering/obsidian/` (registered in `~/.config/obsidian-ace/vaults.json`).

## Steps

### Step 1 — Extract Data

Run the extraction script:

```bash
python3 ~/.claude/skills/session-review/scripts/extract-sessions.py --date YYYY-MM-DD
```

Default: yesterday. Parse the JSON output — it contains `summary`, `projects[]`, `filtered_detail`, and `unmapped_projects`.

### Step 2 — Daily Note

Target: `$VAULT/Calendar/Daily/YYYY-MM-DD.md`

**If daily note exists with `## Claude Sessions`:** Replace that entire section (everything from `## Claude Sessions` to the next `##` heading or EOF). This makes reruns idempotent.

**If daily note exists without it:** Append the section at the end.

**If no daily note:** Create with standard frontmatter:

```markdown
---
tags: [active]
---
# YYYY-MM-DD

## Claude Sessions
```

**Section format:**

```markdown
## Claude Sessions

| Project | Prompts | Tokens | Cost | Rating |
|---------|---------|--------|------|--------|
| [[A. Dynasty Nerds Monorepo]] | 262 | 96k | $16.07 | ★★★★ |
| [[B. Dynasty Nerds Three]] | 45 | 12k | $3.21 | ★★★ |

**Total:** $79.25 across 34 sessions (8.2h active)
Filtered: 32 utility/trivial sessions (20 turbocommit, 12 trivial)
```

**Rules for the table:**
- Project column links to Atlas note if mapped (use `[[note name]]` without path)
- Tokens formatted as `Xk` (thousands)
- Rating as star characters: ★ (filled) repeated for rating count
- Sort by cost descending

### Step 3 — Atlas Repo Notes

For each project with a mapped `atlas_note` in `references/project-map.json`:

Target: `$VAULT/{atlas_note}`

**If `## Session Log` section exists:** Look for `### YYYY-MM-DD` sub-heading. Replace if exists, append if not.

**If no `## Session Log` section:** Append it at the end of the file.

**Entry format:**

```markdown
### YYYY-MM-DD
- X sessions, Y prompts, $Z.ZZ
- Branches: main, feat/381-revenucat
- Key work: "First meaningful prompt text here..."
- Rating: ★★★★
```

### Step 4 — Usage Tracking

Target: `$VAULT/Atlas/III - Claude Usage/A. Usage Tracking.md`

**If the folder/file doesn't exist:** Create both:

```markdown
---
tags: [active]
---
# Claude Usage Tracking

## Weekly Summary

| Week | Sessions | Prompts | Cost | Top Project |
|------|----------|---------|------|-------------|

## Daily Log

| Date | Sessions | Prompts | Cost | Top Project |
|------|----------|---------|------|-------------|
```

**Append/replace daily row** in the `## Daily Log` table (match by date link):

```markdown
| [[YYYY-MM-DD]] | 34 | 1.4k | $79.25 | dynasty-nerds-monorepo |
```

**Update weekly summary** if it's the last day of the week (Sunday) or if explicitly requested. Calculate weekly totals from daily rows.

### Step 5 — Efforts Auto-Link

Scan `$VAULT/Efforts/` for existing effort notes. If a session's branch name or project name fuzzy-matches an Effort title (e.g., branch `feat/381-revenucat` matches effort `RevenueCat Integration`), add a `[[YYYY-MM-DD]]` backlink under a `## Session Links` section in that effort note.

**Only link when confidence is high.** If unsure, skip rather than create bad links.

### Step 6 — Project Map Updates

Check `unmapped_projects` from the extraction output. If new projects are detected:

1. Show the user the unmapped project paths
2. Ask them to classify each (production/prototyping/other)
3. Ask for display name and whether to create an Atlas note
4. Update `~/.claude/skills/session-review/references/project-map.json`
5. If creating Atlas note, follow obsidian-vault naming conventions (Roman numeral folders, alpha file prefixes)

## Rating System

See `references/rating-rubric.md` for full details. 5 dimensions weighted into 1-5 stars:

| Stars | Label | Meaning |
|-------|-------|---------|
| ★ | Minimal | Brief interaction, no output |
| ★★ | Light | Some engagement, limited results |
| ★★★ | Moderate | Good engagement, some commits |
| ★★★★ | High Impact | Heavy usage with tangible output |
| ★★★★★ | Deep Work | Sustained deep engagement |

## Idempotency

All writes are idempotent — rerunning for the same date replaces existing entries rather than duplicating:

- Daily note: replace `## Claude Sessions` section
- Atlas session log: replace `### YYYY-MM-DD` entry
- Usage tracking: replace date row
- Project map: merge, don't overwrite

## Data Sources

| Source | Path | Contains |
|--------|------|----------|
| history.jsonl | `~/.claude/history.jsonl` | Every prompt: timestamp, project, sessionId, display text |
| metrics.json | `~/.claude/projects/<encoded>/<sid>.metrics.json` | cost_usd, duration, tokens, model |
| session.jsonl | `~/.claude/projects/<encoded>/<sid>.jsonl` | Full transcripts: user/assistant msgs, tool_use, tool_result |

## Filtering

Sessions are excluded from active counts (but reported in filtered totals):

- **Haiku sessions:** Model contains "haiku" — these are turbocommit/utility sessions
- **Trivial sessions:** user_message_count ≤ 1 AND total_tool_uses == 0

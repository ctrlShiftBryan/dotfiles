---
name: auditing-claude-md
description: "Audit CLAUDE.md files for quality and efficiency. Counts instructions against ~200 budget, removes what models already know, optimizes positioning, moves enforcement to hooks, and nests verbose content into linked files."
---

# Audit CLAUDE.md Files

CLAUDE.md is highest-leverage config — bad instructions cascade into bad research, bad plans, and hundreds of bad code lines. Audit regularly.

## Step 1: Inventory & Budget

1. Find all CLAUDE.md files in the project (root, nested dirs, `~/.claude/CLAUDE.md`)
2. Count total instructions across all files
3. Budget target: ~200 instructions max across all files combined
4. Flag files over budget — these need trimming in later steps

Output: table of files, instruction counts, total.

## Step 2: Positioning Check

For each CLAUDE.md file, verify critical info placement:
- **Top**: most important project-specific instructions, architecture decisions, key constraints
- **Bottom**: secondary preferences, style notes (recency bias makes bottom also high-attention)
- **Middle**: routine/standard instructions (lowest attention zone)

Flag any critical instructions buried in the middle.

## Step 3: Per-Instruction Audit

Review every instruction and classify:

| Classification | Action |
|---|---|
| **Model already knows this** | Remove. Don't tell Claude to "write clean code" or "handle errors" — it already does. |
| **Outdated or stale** | Remove. Dead references, old patterns no longer used. |
| **Conflicts with another instruction** | Resolve. Contradictions cause unpredictable behavior. |
| **Too verbose** | Condense. Rewrite to convey same info in fewer words. |
| **Enforceable by hook** | Move to `.claude/hooks.json`. Hooks are deterministic — use them for formatting, linting, commit rules. |
| **Duplicated** | Deduplicate. Same instruction in multiple files wastes budget. |
| **Valid and necessary** | Keep. |

## Step 4: Structure Optimization

1. **Nest verbose content** — move long examples, reference tables, or detailed guides into separate files and link with `@file` or relative paths
2. **Move enforcement to hooks** — anything that can be checked mechanically (formatting, file naming, test requirements) belongs in hooks, not instructions
3. **Deduplicate across files** — if global and project CLAUDE.md say the same thing, keep it in one place
4. **Group related instructions** — cluster by topic for readability
5. **Use markdown structure** — headers, lists, tables over prose paragraphs

## Step 5: Summary Report

Output a concise report:

- **Before/After instruction count** — total and per-file
- **Removed** — list of instructions removed and why
- **Moved to hooks** — list of instructions converted to hooks
- **Nested into files** — list of content moved to linked files
- **Repositioned** — critical instructions moved to top/bottom
- **Remaining issues** — anything that needs user decision

## Principles

- **Less is more** — every instruction has a cost; trim ruthlessly
- **Don't teach the model its job** — remove anything a strong model already does well
- **Hooks > instructions** — deterministic enforcement beats hoping the model follows prose
- **Nest, don't bloat** — link to detail files instead of inlining everything
- **Audit regularly** — CLAUDE.md files drift; schedule periodic reviews

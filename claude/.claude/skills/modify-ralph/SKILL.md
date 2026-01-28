# /modify-ralph - Modify Ralph Agent Phases with New Plan

Update existing Ralph tracking docs and beans when a plan changes mid-implementation. Adds new phases, replaces incomplete phases, or inserts sub-phases based on a revised plan.

**Input:** `$ARGUMENTS` (path to new/revised plan markdown file)

---

## Step 1: Validate Input

If `$ARGUMENTS` empty, stop:
```
Usage: /modify-ralph <new-plan-file.md>
Example: /modify-ralph plans/2026-01-25-revised-auth-flow.md
```

Read plan file at `$ARGUMENTS`. Stop if doesn't exist.

---

## Step 2: Load Current Ralph State

### 2.1 Read Existing Files
- Read `ralph/overview.md` — extract current phases table, dependency graph, title, scope
- Read `progress.txt` — preserve all existing entries
- Read `prompt.md` — note current config (PM, scripts, test framework)

### 2.2 Query Existing Phase Beans
Run: `beans query '{ beans(filter: { search: "Phase" }) { id title status body } }'`

Classify each phase bean:
- **COMPLETED** — status is `done`
- **IN_PROGRESS** — status is `in_progress` (has some checked tasks)
- **TODO** — status is `todo` (no tasks started)

Save as `EXISTING_PHASES` list with: phase_num, name, bean_id, status, checked_tasks, total_tasks

---

## Step 3: Parse New Plan

Same parsing as init-ralph:
| Element | How to Parse |
|---------|--------------|
| TITLE | First `#` heading |
| SCOPE | First paragraph after title |
| PHASES | Each `##` heading or numbered section |
| TASKS | Bullets/sub-numbers under each phase |

Create for each phase: PHASE_NUM, PHASE_NAME, PHASE_SLUG, PHASE_TASKS

### Manual Steps Extraction
Look for a section named `## Manual Steps`, `## Prerequisites`, or `## Setup` in the new plan. Extract bullet items as `NEW_MANUAL_STEPS`.

---

## Step 4: Determine Modification Strategy

Present the user with a summary and ask which strategy to use:

### Strategy A: Replace Incomplete
- Keep all COMPLETED phases as-is
- Replace all TODO phases with new plan phases
- For IN_PROGRESS phases: ask user whether to keep or replace

### Strategy B: Append After Current
- Keep all existing phases (completed + in-progress + todo)
- Append new plan phases after the last existing phase
- Renumber new phases starting after last existing

### Strategy C: Insert at Position
- Ask user which phase number to insert after
- Keep all phases up to that point
- Insert new plan phases
- Renumber remaining phases

Show current state:
```
Current phases:
  Phase 01: Setup Auth [DONE] (bean: abc123)
  Phase 02: Login Flow [IN_PROGRESS] (3/7 tasks) (bean: def456)
  Phase 03: OAuth Integration [TODO] (bean: ghi789)
  Phase 04: Token Refresh [TODO] (bean: jkl012)

New plan has 3 phases.

Which strategy? [A] Replace Incomplete / [B] Append / [C] Insert at position
```

---

## Step 5: Execute Modification

### 5.1 Handle Removed Phases
For phases being replaced:
- Archive bean by updating status: `beans update <id> -s cancelled`
- Do NOT delete — preserves history

### 5.2 Handle In-Progress Phases (if replacing)
If user chose to replace an in-progress phase:
- Read bean body, extract checked tasks
- Create a "Carried Over" section in the new phase's bean body with completed items
- Archive original bean as cancelled

### 5.3 Create New Phase Beans
For each new phase, determine its phase number based on chosen strategy, then:
```bash
beans create "Phase {NN}: {PHASE_NAME}" -t task -s todo -d "$(cat <<'EOF'
**Depends on:** {{DEPENDS_ON}}
{{CARRIED_OVER}}

## Tasks

{{TASKS}}

## Verification

- [ ] Tests pass: `{{PM}} test`
- [ ] No lint errors: `{{PM}} lint`
- [ ] No type errors: `{{PM}} typecheck`
EOF
)"
```

Where `{{CARRIED_OVER}}` is either empty or:
```
## Carried Over (from previous Phase NN)

- [x] Previously completed task 1
- [x] Previously completed task 2
```

### 5.4 Renumber Existing Phases (if needed)
If inserting or replacing changes phase numbers:
- Update bean titles: `beans update <id> -t "Phase {NN}: {NAME}"`
- Update dependency references in bean bodies

---

## Step 6: Update Ralph Files

### 6.1 Update `ralph/overview.md`
- Keep title (or update if new plan has different title)
- Append to scope: `\n\n**Revised:** {{NEW_SCOPE}}`
- Rebuild phases table with all phases (kept + new)
- Rebuild dependency graph
- Commands table unchanged

### 6.2 Update `progress.txt`
Append modification entry:
```
## [Date] - Ralph Modified

- **Reason:** New plan applied: {{NEW_PLAN_FILE}}
- **Strategy:** {{STRATEGY_NAME}}
- **Phases cancelled:** {{LIST_OR_NONE}}
- **Phases added:** {{LIST}}
- **Phases kept:** {{LIST}}
```

### 6.4 Update `ralph/manual-steps.md`
- If exists: read it, keep all checked `[x]` items, append new manual steps as unchecked `[ ]`
- If doesn't exist and `NEW_MANUAL_STEPS` is non-empty: create it using init-ralph template

### 6.3 Leave `prompt.md`, `ralph.sh`, `ralph-clean.sh` unchanged
These don't need modification — they reference beans dynamically.

---

## Step 7: Output Summary

```
Modified Ralph Agent implementation:

Strategy: {{STRATEGY_NAME}}

Phases kept (unchanged):
{{KEPT_PHASES_LIST}}

Phases cancelled:
{{CANCELLED_PHASES_LIST}}

Phases added:
{{ADDED_PHASES_LIST}}

Files updated:
- ralph/overview.md
- ralph/manual-steps.md
- progress.txt

Next steps:
1. Review ralph/overview.md and new phase beans
2. Resume: ./ralph.sh [max-iterations]
```

---

## Critical Rules

1. **NEVER DELETE BEANS** — cancel them, never delete
2. **PRESERVE COMPLETED WORK** — completed phases and checked tasks are sacred
3. **CARRY OVER PROGRESS** — in-progress checked tasks transfer to replacement phases
4. **ASK BEFORE REPLACING IN-PROGRESS** — always confirm with user
5. **LOG THE CHANGE** — progress.txt must record what was modified and why
6. **MAINTAIN NUMBERING** — phase numbers must be sequential with no gaps after modification

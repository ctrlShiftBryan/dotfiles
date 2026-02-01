# /init-ralph - Convert Plan to Ralph Agent Implementation Docs

Convert plan markdown into Ralph Agent implementation tracking docs.

**Input:** `$ARGUMENTS` (path to plan markdown file)

---

## Step 1: Validate Input

If `$ARGUMENTS` empty, stop:
```
Usage: /init-ralph <plan-file.md>
Example: /init-ralph plans/2026-01-21-oauth-login.md
```

Read plan file at `$ARGUMENTS`. Stop if doesn't exist.

---

## Step 2: Detect Repo Configuration

Run these checks NOW, save results for file generation.

### 2.1 Package Manager
Check lockfiles:
- `pnpm-lock.yaml` → `PM=pnpm`
- `yarn.lock` → `PM=yarn`
- `bun.lockb` → `PM=bun`
- `package-lock.json` → `PM=npm`

### 2.2 Available Scripts
Read `package.json`, check for: test/test:once/test:run, lint, typecheck/tsc, format, build, dev/start

Build `SCRIPTS_CMD` using PM. Example: `pnpm typecheck && pnpm lint && pnpm test`

### 2.3 GitHub Actions
Check `.github/workflows/*.yml` exists → `HAS_CI=true/false`

### 2.4 Project Type
- `convex/` → `PROJECT_TYPE=convex` (add ", push to convex dev" to SCRIPTS_CMD)
- `turbo.json` → `PROJECT_TYPE=monorepo`
- `remix.config.*` → `PROJECT_TYPE=remix`
- `next.config.*` → `PROJECT_TYPE=nextjs`
- else → `PROJECT_TYPE=standard`

### 2.5 Test Framework
- `vitest.config.*` → `TEST_FRAMEWORK=vitest`
- `jest.config.*` → `TEST_FRAMEWORK=jest`
- `playwright.config.*` → `HAS_E2E=true`

---

## Step 3: Parse Plan File

Extract:
| Element | How to Parse |
|---------|--------------|
| TITLE | First `#` heading |
| SCOPE | First paragraph after title |
| PHASES | Each `##` heading or numbered section |
| TASKS | Bullets/sub-numbers under each phase |

Create for each phase: PHASE_NUM, PHASE_NAME, PHASE_SLUG (kebab-case), PHASE_TASKS

### Manual Steps Extraction
Look for a section named `## Manual Steps`, `## Prerequisites`, or `## Setup` in the plan. Extract bullet items as `MANUAL_STEPS` (convert to `- [ ]` checkboxes). If none found, use: `- [ ] No manual steps identified — review plan and add any if needed`

---

## Step 4: Check Existing Files

If `ralph/` exists, ask before overwrite.
If `prompt.md` exists, ask before overwrite.
If `progress.txt` exists, preserve (only add Codebase Patterns if missing).

---

## Step 5: Generate Files

Create `mkdir -p ralph`

Read templates from `~/.claude/skills/init-ralph/templates/` and substitute:

| Placeholder | Source |
|-------------|--------|
| `{{PM}}` | Detected package manager |
| `{{SCRIPTS_CMD}}` | Built command string |
| `{{HAS_CI}}` | Include step 13 if true |
| `{{TITLE}}` | Parsed from plan |
| `{{SCOPE}}` | Parsed from plan |
| `{{PHASES_TABLE}}` | Generated markdown table rows |
| `{{DEPENDENCY_GRAPH}}` | ASCII graph of phases |
| `{{COMMANDS_TABLE}}` | Table rows for existing scripts |
| `{{PHASE_NUM}}` | Phase number |
| `{{PHASE_NAME}}` | Phase name |
| `{{DEPENDS_ON}}` | Previous phase or "None" |
| `{{TASKS}}` | Converted to `- [ ]` checkboxes |
| `{{TEST_FRAMEWORK}}` | Detected test framework |
| `{{PROJECT_TYPE}}` | Detected project type |

### 5.1 Generate `prompt.md`
Use `templates/prompt.md.tmpl`. Write to repo root. All values substituted.

### 5.2 Generate `ralph/overview.md`
Use `templates/overview.md.tmpl`.

### 5.3 Create Phase Beans
For each phase, create a bean using:
```bash
beans create "Phase {NN}: {PHASE_NAME}" -t task -s todo -d "$(cat <<'EOF'
**Depends on:** {{DEPENDS_ON}}

## Tasks

{{TASKS}}

## Verification

- [ ] Tests pass: `{{PM}} test`
- [ ] No lint errors: `{{PM}} lint`
- [ ] No type errors: `{{PM}} typecheck`
EOF
)"
```
Save the bean IDs for overview.md generation.

### 5.4 Generate `ralph/progress.txt`
Use `templates/progress.txt.tmpl`. If exists, only add Codebase Patterns if missing.

### 5.5 Generate `ralph/ralph.sh`
Copy `templates/ralph.sh` verbatim to `ralph/ralph.sh`. Run `chmod +x ralph/ralph.sh`.

### 5.6 Generate `ralph/ralph-clean.sh`
Copy `templates/ralph-clean.sh` verbatim to `ralph/ralph-clean.sh`. Run `chmod +x ralph/ralph-clean.sh`.

### 5.8 Generate `ralph/manual-steps.md`
Use `templates/manual-steps.md.tmpl`. Substitute `{{MANUAL_STEPS}}` with extracted manual steps as `- [ ]` checkboxes.

### 5.7 Update `.gitignore`
Append if missing:
```
# Ralph agent
.ralph/
.ralph-stop
ralph-archive/
```

---

## Step 6: Output Summary

```
Created Ralph Agent implementation docs:

Files created:
- prompt.md
- ralph/overview.md
- ralph/manual-steps.md
- ralph/progress.txt
- ralph/ralph.sh
- ralph/ralph-clean.sh

Beans created:
- Phase beans (one per phase, type: task)

Detected configuration:
- Package manager: {PM}
- Scripts: {list found}
- CI: {yes/no}
- Project type: {PROJECT_TYPE}
- Test framework: {TEST_FRAMEWORK}

Next steps:
1. Complete manual steps in ralph/manual-steps.md
2. Review ralph/overview.md and phase beans
3. Customize task descriptions in beans
4. Run: cd ralph && ./ralph.sh [max-iterations]
5. Stop: touch .ralph-stop
```

---

## Critical Rules

1. **NO PLACEHOLDERS IN OUTPUT** - Every file must have real values
2. **DETECT FIRST** - Complete Step 2 before generating
3. **EXACT COMMANDS** - prompt.md step 6 shows exact command
4. **CI IS BINARY** - Include step 13 or don't
5. **ASK BEFORE OVERWRITE** - Don't silently overwrite

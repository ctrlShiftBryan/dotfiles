---
name: ba:map-codebase-efficient
description: Analyze codebase with agent team using model profiles (haiku/sonnet/opus scaling) for speed and cost efficiency
argument-hint: "[optional: specific area to map, e.g., 'api' or 'auth']"
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
  - Write
  - Task
  - TeamCreate
  - TeamDelete
  - SendMessage
  - TaskCreate
  - TaskUpdate
  - TaskList
  - TaskGet
---

<objective>
Analyze existing codebase using a 6-member agent team (tech-lead + 4 mappers + 1 reviewer) with model profile scaling for speed/cost efficiency.

Team architecture:
```
tech-lead (this session — inherits caller model)
├── mapper-tech     → STACK.md, INTEGRATIONS.md        [mapper_model]
├── mapper-arch     → ARCHITECTURE.md, STRUCTURE.md    [mapper_model]
├── mapper-quality  → CONVENTIONS.md, TESTING.md       [mapper_model]
├── mapper-concerns → CONCERNS.md                      [mapper_model]
└── reviewer        → reviews all 7 docs → SUMMARY.md  [reviewer_model]
```

**Model profile lookup:**

| Agent | quality | balanced (default) | budget |
|-------|---------|-------------------|--------|
| ba-codebase-mapper | sonnet | haiku | haiku |
| ba-codebase-reviewer | opus | sonnet | haiku |

Output: .planning/codebase/ folder with 8 documents (7 analysis + SUMMARY.md).
</objective>

<context>
Focus area: $ARGUMENTS (optional - if provided, tells agents to focus on specific subsystem)

**Load project state if exists:**
Check for .planning/STATE.md - loads context if project already initialized

**This command can run:**
- Before /gsd:new-project (brownfield codebases) - creates codebase map first
- After /gsd:new-project (greenfield codebases) - updates codebase map as code evolves
- Anytime to refresh codebase understanding
</context>

<when_to_use>
**Use map-codebase-efficient for:**
- Default choice — faster and cheaper than `/ba:map-codebase`
- Brownfield projects before initialization
- Refreshing codebase map after significant changes
- Onboarding to an unfamiliar codebase

**Use `/ba:map-codebase` instead when:**
- Maximum quality needed (all Opus agents)
- Complex/unusual codebases where haiku mappers may miss nuance

**Skip for:**
- Greenfield projects with no code yet
- Trivial codebases (<5 files)
</when_to_use>

<process>

<step name="resolve_model_profile" priority="first">
Read model profile from GSD config (shared with `/gsd:` commands):

```bash
MODEL_PROFILE=$(cat .planning/config.json 2>/dev/null | grep -o '"model_profile"[[:space:]]*:[[:space:]]*"[^"]*"' | grep -o '"[^"]*"$' | tr -d '"' || echo "balanced")
```

Default to "balanced" if not set.

**Resolve models:**

| Profile | mapper_model | reviewer_model |
|---------|-------------|----------------|
| quality | sonnet | opus |
| balanced | haiku | sonnet |
| budget | haiku | haiku |

Store resolved models for use in spawn_teammates step.

Display to user:
```
Model profile: {MODEL_PROFILE}
  Mappers: {mapper_model}
  Reviewer: {reviewer_model}
```
</step>

<step name="check_existing">
Check if .planning/codebase/ already exists:

```bash
ls -la .planning/codebase/ 2>/dev/null
```

**If exists:**

```
.planning/codebase/ already exists with these documents:
[List files found]

What's next?
1. Refresh - Delete existing and remap codebase
2. Update - Keep existing, only update specific documents
3. Skip - Use existing codebase map as-is
```

Wait for user response.

If "Refresh": Delete .planning/codebase/, continue to create_structure
If "Update": Ask which documents to update, continue to spawn (filtered)
If "Skip": Exit workflow

**If doesn't exist:**
Continue to create_structure.
</step>

<step name="create_structure">
Create .planning/codebase/ directory:

```bash
mkdir -p .planning/codebase
```
</step>

<step name="create_team">
Create the agent team:

```
TeamCreate(team_name="ba-map-YYYYMMDD")
```

Use today's date in the team name for uniqueness.
</step>

<step name="create_tasks">
Create 5 tasks via TaskCreate:

**Task 1: Map tech stack**
- subject: "Map tech stack and integrations"
- description: "Analyze codebase for technology stack and external integrations. Write STACK.md and INTEGRATIONS.md to .planning/codebase/. Focus: tech"
- activeForm: "Mapping tech stack"

**Task 2: Map architecture**
- subject: "Map architecture and structure"
- description: "Analyze codebase architecture and directory structure. Write ARCHITECTURE.md and STRUCTURE.md to .planning/codebase/. Focus: arch"
- activeForm: "Mapping architecture"

**Task 3: Map conventions and testing**
- subject: "Map conventions and testing patterns"
- description: "Analyze coding conventions and testing patterns. Write CONVENTIONS.md and TESTING.md to .planning/codebase/. Focus: quality"
- activeForm: "Mapping conventions"

**Task 4: Map concerns**
- subject: "Map codebase concerns"
- description: "Identify technical debt, known issues, and areas of concern. Write CONCERNS.md to .planning/codebase/. Focus: concerns"
- activeForm: "Mapping concerns"

**Task 5: Review all documents and write summary**
- subject: "Review all codebase docs and write SUMMARY.md"
- description: "Review all 7 mapper documents for quality and cross-doc consistency. Write SUMMARY.md synthesis. May request 1 rewrite cycle per doc if quality insufficient."
- activeForm: "Reviewing codebase docs"
- addBlockedBy: [task1_id, task2_id, task3_id, task4_id]

Assign owners via TaskUpdate:
- Task 1 → mapper-tech
- Task 2 → mapper-arch
- Task 3 → mapper-quality
- Task 4 → mapper-concerns
- Task 5 → reviewer
</step>

<step name="spawn_teammates">
Spawn 5 teammates in parallel using Task tool with `team_name`, `name`, and `model` params:

**Mapper agents (4x ba-codebase-mapper) — use `mapper_model`:**

Each mapper gets this prompt template (substitute focus area and docs):
```
You are {name} on team {team_name}.

Your assigned task: Map {focus_description}.

Write these documents to .planning/codebase/:
{document_list}

{focus_area_hint from $ARGUMENTS if provided}

Start by checking TaskList, then TaskGet your assigned task, mark it in_progress, explore the codebase, write documents, mark completed, and message tech-lead.
```

Spawn with:
- subagent_type: "ba-codebase-mapper"
- team_name: "{team_name}"
- name: "mapper-tech" / "mapper-arch" / "mapper-quality" / "mapper-concerns"
- model: "{mapper_model}"
- run_in_background: true

**Reviewer agent (1x ba-codebase-reviewer) — use `reviewer_model`:**

Prompt:
```
You are reviewer on team {team_name}.

Your task is blocked until all 4 mappers complete. Check TaskList to monitor progress. Once unblocked, review all 7 docs in .planning/codebase/ for quality and cross-doc consistency, then write SUMMARY.md.

Start by checking TaskList and waiting for your task to become unblocked.
```

Spawn with:
- subagent_type: "ba-codebase-reviewer"
- team_name: "{team_name}"
- name: "reviewer"
- model: "{reviewer_model}"
- run_in_background: true
</step>

<step name="monitor_completion">
Messages arrive automatically from teammates.

**Wait for:**
1. Each mapper sends completion message with doc names and line counts
2. Reviewer sends final completion message with SUMMARY.md confirmation

**If mapper idle too long (no message after extended wait):**
Send status check: `SendMessage(type: "message", recipient: "{mapper_name}", content: "status?")`

**If mapper fails:**
Message reviewer: "mapper-{focus} failed, work with available docs and note gaps in SUMMARY.md"

**If reviewer fails:**
Proceed to verify_output without SUMMARY.md, log warning.
</step>

<step name="verify_output">
Verify all documents created:

```bash
ls -la .planning/codebase/
wc -l .planning/codebase/*.md
```

**Verification:**
- 8 documents exist (7 analysis + SUMMARY.md)
- No empty documents (each >20 lines)
- If SUMMARY.md missing (reviewer failed), note it but continue with 7 docs
</step>

<step name="shutdown_team">
Shut down all 5 teammates:

```
SendMessage(type: "shutdown_request", recipient: "mapper-tech")
SendMessage(type: "shutdown_request", recipient: "mapper-arch")
SendMessage(type: "shutdown_request", recipient: "mapper-quality")
SendMessage(type: "shutdown_request", recipient: "mapper-concerns")
SendMessage(type: "shutdown_request", recipient: "reviewer")
```

Wait for shutdown approvals, then:
```
TeamDelete()
```
</step>

<step name="commit_codebase_map">
Commit the codebase map:

**Check planning config:**
```bash
COMMIT_PLANNING_DOCS=$(cat .planning/config.json 2>/dev/null | grep -o '"commit_docs"[[:space:]]*:[[:space:]]*[^,}]*' | grep -o 'true\|false' || echo "true")
git check-ignore -q .planning 2>/dev/null && COMMIT_PLANNING_DOCS=false
```

**If `COMMIT_PLANNING_DOCS=false`:** Skip git operations

**If `COMMIT_PLANNING_DOCS=true` (default):**

```bash
git add .planning/codebase/*.md
git commit -m "$(cat <<'EOF'
docs: map existing codebase

- STACK.md - Technologies and dependencies
- ARCHITECTURE.md - System design and patterns
- STRUCTURE.md - Directory layout
- CONVENTIONS.md - Code style and patterns
- TESTING.md - Test structure
- INTEGRATIONS.md - External services
- CONCERNS.md - Technical debt and issues
- SUMMARY.md - Cross-document synthesis and recommendations
EOF
)"
```
</step>

<step name="offer_next">
Present completion summary:

```
Codebase mapping complete.

Model profile: {MODEL_PROFILE} (mappers: {mapper_model}, reviewer: {reviewer_model})

Created .planning/codebase/:
- STACK.md ([N] lines) - Technologies and dependencies
- ARCHITECTURE.md ([N] lines) - System design and patterns
- STRUCTURE.md ([N] lines) - Directory layout and organization
- CONVENTIONS.md ([N] lines) - Code style and patterns
- TESTING.md ([N] lines) - Test structure and practices
- INTEGRATIONS.md ([N] lines) - External services and APIs
- CONCERNS.md ([N] lines) - Technical debt and issues
- SUMMARY.md ([N] lines) - Cross-document synthesis

---

## Next Up

**Initialize project** -- use codebase context for planning

`/gsd:new-project`

`/clear` first for fresh context window

---

**Also available:**
- Re-run mapping: `/ba:map-codebase-efficient`
- Full quality (all Opus): `/ba:map-codebase`
- Change profile: `/gsd:set-profile`
- Review specific file: `cat .planning/codebase/STACK.md`

---
```

End workflow.
</step>

</process>

<error_handling>

| Scenario | Response |
|----------|----------|
| Mapper fails | Tech-lead messages asking status. If unrecoverable, reviewer works with available docs, notes gaps in SUMMARY.md |
| Reviewer flags issue | Creates rewrite task, assigns to mapper, max 1 cycle. If still bad, notes in SUMMARY.md |
| Reviewer fails | Tech-lead commits 7 docs without SUMMARY.md, logs warning |
| Agent idle too long | Tech-lead sends "status?" message to wake agent |

</error_handling>

<success_criteria>
- [ ] Model profile resolved from .planning/config.json (default: balanced)
- [ ] .planning/codebase/ directory created
- [ ] Team created with 5 teammates (4 mappers + 1 reviewer)
- [ ] Mappers spawned with correct model from profile
- [ ] Reviewer spawned with correct model from profile
- [ ] All 4 mapper tasks completed
- [ ] Reviewer validated docs and wrote SUMMARY.md
- [ ] All 8 codebase documents exist with >20 lines each
- [ ] Team shut down cleanly (no orphaned agents)
- [ ] Codebase map committed
- [ ] User knows next steps
</success_criteria>

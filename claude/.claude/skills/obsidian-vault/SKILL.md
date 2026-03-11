---
name: obsidian-vault
description: Use when saving notes, documents, or references to an Obsidian vault, creating new vaults, or triaging inbox items. Triggers on "save to vault", "put in vault", "add to obsidian", "create vault", "new vault", "triage inbox", "organize inbox", "triage vault", or any request to store/organize content in Obsidian.
---

# Obsidian Vault — ACE System (Multi-Vault)

## ACE Philosophy

The ACE system organizes knowledge into four pillars:

| Folder | Purpose | Information Flow |
|--------|---------|-----------------|
| **+** | Inbox — quick captures, unsorted items | Entry point. Everything starts here unless you know where it goes. |
| **Atlas** | Knowledge base — references, evergreen notes, how-tos | Permanent home for reference material. Things you'll look up again. |
| **Calendar** | Time-based — daily notes, meeting notes, journals | Organized by date. What happened when. |
| **Efforts** | Active projects — ongoing work, goals, deliverables | Work with a start and end. Things you're actively doing. |

**Flow:** Capture fast in `+` → Triage periodically → Move to Atlas/Calendar/Efforts based on nature.

The `+` inbox keeps capture frictionless. Triage keeps the vault organized. Atlas/Calendar/Efforts give everything a permanent home.

## Vault Discovery

Vaults are tracked in a registry file at `~/.config/obsidian-ace/vaults.json`.

**Format:**
```json
[
  {"name": "Personal", "path": "/Users/bryan/obsidian/Personal"},
  {"name": "Dynasty Nerds", "path": "/Users/bryan/obsidian/DynastyNerds"}
]
```

**Resolution rules:**
1. If registry doesn't exist → ask user for vault path, create registry
2. If 1 vault → use it automatically
3. If multiple vaults → match by name from user's prompt (e.g. "save to Dynasty Nerds vault")
4. If ambiguous → ask user which vault
5. After creating a new vault → auto-add to registry

**Implementation:**
```bash
# Read registry
cat ~/.config/obsidian-ace/vaults.json

# Create registry dir if needed
mkdir -p ~/.config/obsidian-ace
```

## Create New Vault

When user asks to create a new vault (e.g. "Create a vault called BrainFrame at ~/obsidian/BrainFrame"):

### Step 1: Scaffold ACE Folder Structure

```bash
mkdir -p "$VAULT_PATH"/{+,Atlas,Efforts}
mkdir -p "$VAULT_PATH"/Calendar/{Daily,Weekly,Monthly}
```

### Step 2: Copy .obsidian Config

Copy config files from this skill's `assets/obsidian-config/` directory into `$VAULT_PATH/.obsidian/`:

```bash
mkdir -p "$VAULT_PATH/.obsidian"
# Copy each config file from the skill's assets/obsidian-config/ directory:
# - daily-notes.json
# - core-plugins.json
# - core-plugins-migration.json
# - app.json
# - appearance.json
```

Read each file from `~/.claude/skills/obsidian-vault/assets/obsidian-config/` and write it to `$VAULT_PATH/.obsidian/`.

### Step 3: Add to Registry

Read the current registry (or create empty array), append the new vault entry, write back.

### Step 4: Confirm

Tell the user: vault created at path, ACE folders scaffolded, .obsidian config applied. They can open it in Obsidian.

### Reference

See `~/.claude/skills/obsidian-vault/references/example-vault/` for what a well-populated vault looks like with proper naming conventions, tags, and links.

## Saving Notes

### Default Behavior

1. Resolve which vault to use (see Vault Discovery)
2. Default destination is `+` (inbox) unless user specifies otherwise
3. If user names a destination (Atlas, Calendar, Efforts), use it directly
4. If unsure and content clearly fits a category, ask user to confirm

### Naming Conventions

#### Atlas and Efforts — Folder Level (Roman Numerals)

Top-level subfolders use Roman numeral prefixes:

1. List existing folders in the target ACE folder
2. Next = count + 1
3. Format: `{ROMAN} - {Topic Name}/`

```
Atlas/
  I - AI Tools/
  II - Baseball/
  III - Kubernetes/

Efforts/
  I - Dynasty GM 3.0/
  II - Travel Baseball/
```

Roman numeral reference: I, II, III, IV, V, VI, VII, VIII, IX, X, XI, XII, XIII, XIV, XV, XVI, XVII, XVIII, XIX, XX

#### Atlas and Efforts — File Level (Alpha Prefix)

Files within a topic folder use capital letter prefixes:

1. Count existing files in the folder
2. Next = count + 1 (A=1, B=2, ...)
3. Format: `{LETTER}. {File Name}.md`

```
I - AI Tools/
  A. Claude Code Notes.md
  B. Prompt Engineering.md
```

Alpha reference: A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z

#### Calendar — Date-based

- Daily: `YYYY-MM-DD.md` in `Calendar/Daily/`
- Weekly: `YYYY-Www.md` in `Calendar/Weekly/` (e.g. `2026-W11.md`)
- Monthly: `YYYY-MM.md` in `Calendar/Monthly/`

#### + (Inbox) — No prefix

Files go directly with descriptive names, no numbering: `My Note Title.md`

### Implementation Steps

```
1. Determine vault (Vault Discovery)
2. Determine destination (default: +)
3. If Atlas or Efforts:
   a. Check if topic folder exists → ls the ACE folder
   b. If new folder: count siblings, assign next Roman numeral
   c. Count files in folder, assign next alpha letter
4. If Calendar: use date-based name
5. If +: use plain descriptive name
6. Create folder if needed (mkdir -p)
7. Write the file
```

## Triage Workflow

When user asks to triage/organize the inbox (e.g. "triage my inbox", "organize the + folder"):

### Step 1: Resolve Vault

Use Vault Discovery to determine which vault.

### Step 2: Read Inbox

```bash
ls "$VAULT_PATH/+"
```

Read each file in `+/` to understand its contents.

### Step 3: Classify

For each file, determine the best ACE destination:

- **Atlas** → reference material, how-tos, knowledge that'll be looked up again
- **Calendar** → date-specific content (meeting notes, daily logs)
- **Efforts** → project-related work, active tasks, deliverables
- **Stay in +** → still needs processing, genuinely uncategorized
- **Delete** → empty files, stale captures with no value

### Step 4: Present Table

Present a summary table for user review:

```
| File | Destination | New Name | Reasoning |
|------|------------|----------|-----------|
| quick idea about app.md | Efforts/I - Dynasty GM 3.0/ | C. App Idea.md | Project-related idea |
| meeting notes 2026-03-10.md | Calendar/Daily/ | 2026-03-10.md | Date-specific meeting notes |
| .md (empty) | DELETE | — | Empty file, no content |
```

Apply naming conventions: Roman numeral folders, alpha file prefixes for Atlas/Efforts destinations.

### Step 5: Wait for Confirmation

**Do NOT move any files until user confirms.** Ask: "Want me to proceed with these moves? You can adjust any of them."

### Step 6: Execute Moves

After confirmation:
```bash
# Create destination folder if needed
mkdir -p "$VAULT_PATH/Atlas/III - New Topic"
# Move and rename
mv "$VAULT_PATH/+/old name.md" "$VAULT_PATH/Atlas/III - New Topic/A. New Name.md"
# Delete empty files user approved for deletion
rm "$VAULT_PATH/+/empty file.md"
```

## Tags for State

Use tags to track note lifecycle:

| Tag | Meaning | When to use |
|-----|---------|-------------|
| `#idea` | Raw thought, unprocessed | Quick captures, brainstorms |
| `#draft` | Work in progress | Started writing, not finished |
| `#active` | Currently working on | In-progress efforts, active reference |
| `#waiting` | Blocked or deferred | Waiting on someone/something |

Tags go in frontmatter or at the top of the note:
```markdown
---
tags: [idea]
---
# My Note Title
```

## Common Mistakes

- Forgetting to check vault registry before assuming vault path
- Forgetting to count existing folders/files before assigning prefix
- Using lowercase letters or roman numerals (always UPPERCASE)
- Putting inbox items in Atlas without asking
- Missing the ` - ` separator in folder names (`III - Name` not `III-Name`)
- Missing the `. ` after alpha prefix (`A. Name` not `A Name`)
- Moving files during triage without user confirmation
- Creating a vault without adding it to the registry

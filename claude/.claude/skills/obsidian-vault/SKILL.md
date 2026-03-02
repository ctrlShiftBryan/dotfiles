---
name: obsidian-vault
description: Use when saving notes, documents, or references to the Obsidian vault. Triggers on "save to vault", "put in vault", "add to obsidian", or any request to store content in ~/obsidian/Personal.
---

# Obsidian Vault — ACE System

## Overview

Save files to Bryan's Obsidian vault at `~/obsidian/Personal/` using the ACE organizational system. Default destination is `+` (inbox) unless user specifies otherwise.

## ACE Folders

| Folder | Purpose | When to use |
|--------|---------|-------------|
| **Atlas** | Knowledge, references, evergreen notes | Technical docs, how-tos, reference material |
| **Calendar** | Date-based notes | Daily notes, meeting notes, journals |
| **Efforts** | Active projects and ongoing work | Project-specific docs, task tracking |
| **+** | Inbox / uncategorized (DEFAULT) | Everything else, quick captures, unsorted |

## Workflow

1. **Default to `+` (inbox)** — unless user explicitly names a destination
2. If user says a destination, use it directly
3. If unsure and content clearly fits Atlas/Calendar/Efforts, ask user to confirm

## Naming Conventions

### Atlas and Efforts — Folder Level (Roman Numerals)

Top-level subfolders use Roman numeral prefixes:

1. Count existing folders in the target ACE folder
2. Next = count + 1
3. Format: `{ROMAN} - {Topic Name}/`

```
Atlas/
  I - Codex/
  II - Docker/
  III - Kubernetes/

Efforts/
  I - Dynasty Nerds/
  II - Brayn/
  III - Anders Wolfpack/
```

Roman numeral reference: I, II, III, IV, V, VI, VII, VIII, IX, X, XI, XII, XIII, XIV, XV, XVI, XVII, XVIII, XIX, XX

### Atlas and Efforts — File Level (Alpha Prefix)

Files within a topic folder use capital letter prefixes:

1. Count existing files in the folder
2. Next = count + 1 (A=1, B=2, ...)
3. Format: `{LETTER}. {File Name}.md`

```
I - Codex/
  A. Codex CLI Storage Reference.md
  B. Codex Memory System.md
```

Alpha reference: A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z

### Calendar — Date-based

Files use date format: `YYYY-MM-DD.md`

### + (Inbox) — No prefix

Files go directly with descriptive names, no numbering: `My Note Title.md`

## Implementation Steps

When saving to vault:

```
1. Determine destination (default: +)
2. If Atlas or Efforts:
   a. Check if topic folder exists
   b. If new folder: count siblings, assign next Roman numeral
   c. Count files in folder, assign next alpha letter
3. If Calendar: use date-based name
4. If +: use plain descriptive name
5. Create folder if needed (mkdir -p)
6. Write the file
```

## Common Mistakes

- Forgetting to count existing folders/files before assigning prefix
- Using lowercase letters or roman numerals (always UPPERCASE)
- Putting inbox items in Atlas without asking
- Missing the ` - ` separator in folder names (it's `III - Name` not `III-Name`)
- Missing the `. ` after alpha prefix (it's `A. Name` not `A Name`)

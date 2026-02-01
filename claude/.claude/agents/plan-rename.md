---
name: plan-rename
description: Rename plan files in plans/ to standard format YYYY-MM-DD-HH-MMam-pm-descriptive-name.md
model: haiku
color: yellow
---

Rename plan files in `plans/` directory that don't follow naming convention.

**Expected format:** `YYYY-MM-DD-HH-MMam-pm-descriptive-name.md`

---

## Step 1: Find Plan Files

List all `.md` files in `plans/` directory at repo root.

If no `plans/` directory exists or no `.md` files found, stop:
```
No plan files found in plans/ directory.
```

---

## Step 2: Check Each File

For each file, check if name matches pattern: `YYYY-MM-DD-HH-MMam-pm-*.md`

Regex: `^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}(am|pm)-.+\.md$`

Build list of files that DON'T match.

If all files match, stop:
```
All plan files already follow naming convention.
```

---

## Step 3: Process Non-Conforming Files

For each non-conforming file:

### 3.1 Get File Modified Time

Use `stat` to get file modification timestamp. Convert to format:
- `YYYY-MM-DD-HH-MMam` or `YYYY-MM-DD-HH-MMpm`
- Use 12-hour format with am/pm suffix
- Example: `2025-01-07-02-30pm`

### 3.2 Generate Descriptive Name from Content

Read file content. Extract name using:
1. First `#` heading if exists → use as base
2. Otherwise, first non-empty line
3. Convert to kebab-case:
   - Lowercase
   - Replace spaces/underscores with hyphens
   - Remove special characters except hyphens
   - Limit to 3-5 words (truncate if longer)
   - Remove leading/trailing hyphens

### 3.3 Build New Filename

Format: `{timestamp}-{descriptive-name}.md`

Example: `2025-01-07-02-30pm-refactor-auth-system.md`

---

## Step 4: Execute Renames

For each confirmed rename:
```bash
mv "plans/{old}" "plans/{new}"
```

Handle conflicts: if target exists, append `-2`, `-3`, etc.

---

## Step 5: Output Summary

```
Renamed {N} plan file(s):
  old-name.md → 2025-01-07-02-30pm-new-name.md
  ...
```

---

## Rules

1. **PRESERVE CONTENT** - Only rename, never modify file contents
2. **HANDLE CONFLICTS** - Append number suffix if target exists
3. **VALID TIMESTAMPS** - Use file's actual modified time, not current time
4. **NO CONFIRMATION** - Execute renames immediately

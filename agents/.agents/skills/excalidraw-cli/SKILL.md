---
name: excalidraw-cli
description: CLI for inspecting, creating, and exporting .excalidraw files. Use when subagents need to work with Excalidraw JSON — avoids raw JSON parsing. Supports info, elements, search, create, add, export, and open commands.
---

# Excalidraw CLI

CLI tool for working with .excalidraw files without parsing raw JSON. Complements the `excalidraw` subagent delegation skill by giving subagents concrete tooling.

## Prerequisites

Install dependencies (once):
```bash
cd ~/.claude/skills/excalidraw-cli/scripts && npm install
```

Export requires Playwright Firefox (downloaded automatically on first `export` run via `npx excalidraw-brute-export-cli`).

## Usage

```bash
SKILL_DIR="$(dirname "$(readlink -f ~/.claude/skills/excalidraw-cli/SKILL.md)")"
```

### Info — summarize a file

```bash
node "$SKILL_DIR/scripts/excalidraw-cli.mjs" info <file>
```

Returns element count, type counts, text labels, bounding box, appState basics.

### Elements — list all elements

```bash
node "$SKILL_DIR/scripts/excalidraw-cli.mjs" elements <file>
```

Returns id, type, position, dimensions, text (for text elements), points (for arrows/lines), boundElements.

### Search — find text elements

```bash
node "$SKILL_DIR/scripts/excalidraw-cli.mjs" search <file> "query"
```

Case-insensitive search across text and originalText fields.

### Create — new empty file

```bash
node "$SKILL_DIR/scripts/excalidraw-cli.mjs" create <output.excalidraw>
```

Generates valid empty .excalidraw with proper schema (type, version:2, elements:[], appState, files:{}).

### Add — insert elements

```bash
node "$SKILL_DIR/scripts/excalidraw-cli.mjs" add <file> --type <type> [flags]
```

**Supported types:** `rect`, `text`, `ellipse`, `arrow`, `line`, `diamond`

**Common flags:** `--x`, `--y`, `--width`, `--height`, `--color`, `--bg`

**Shapes (rect/ellipse/diamond):**
```bash
# Simple shape
node "$SKILL_DIR/scripts/excalidraw-cli.mjs" add f.excalidraw --type rect --x 50 --y 50

# Shape with bound text label
node "$SKILL_DIR/scripts/excalidraw-cli.mjs" add f.excalidraw --type rect --x 50 --y 50 --label "Box A"

# Colored diamond
node "$SKILL_DIR/scripts/excalidraw-cli.mjs" add f.excalidraw --type diamond --x 100 --y 100 --color "#e03131" --bg "#ffc9c9"
```

**Text:**
```bash
node "$SKILL_DIR/scripts/excalidraw-cli.mjs" add f.excalidraw --type text --x 50 --y 200 --text "Hello" --font-size 24
```

**Arrow/Line:**
```bash
# Arrow with default points [[0,0],[200,0]]
node "$SKILL_DIR/scripts/excalidraw-cli.mjs" add f.excalidraw --type arrow --x 250 --y 100

# Custom points and arrowhead
node "$SKILL_DIR/scripts/excalidraw-cli.mjs" add f.excalidraw --type line --x 0 --y 0 --points "[[0,0],[100,50],[200,0]]" --end-arrow triangle
```

### Export — to SVG or PNG

```bash
node "$SKILL_DIR/scripts/excalidraw-cli.mjs" export <file> --format svg
node "$SKILL_DIR/scripts/excalidraw-cli.mjs" export <file> --format png
```

Uses `npx excalidraw-brute-export-cli`. Output file replaces .excalidraw extension with .svg/.png. First run downloads Playwright Firefox automatically.

### Open — launch in browser

```bash
node "$SKILL_DIR/scripts/excalidraw-cli.mjs" open <file>
```

Opens excalidraw.com; drag-and-drop the file to load it.

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success — JSON output on stdout |
| 1 | Error — JSON `{ "error": "..." }` on stdout |

## Relationship to Excalidraw Subagent Skill

The `excalidraw` skill delegates all .excalidraw operations to subagents. This CLI gives those subagents concrete commands instead of parsing raw JSON. Typical flow:

1. Main agent triggers `excalidraw` skill (delegation)
2. Subagent uses `excalidraw-cli` commands to inspect/modify files
3. Subagent returns text summary to main agent

---
name: quality-setup
description: "Add ESLint v9 flat config (with sonarjs, unicorn, complexity limits) + Prettier + jscpd + TypeScript strict + quality scripts to any pnpm TypeScript project. Detects React, Tailwind, & Expo."
user_invocable: true
---

# Quality Setup — ESLint + Prettier + TypeScript Strict

Add a standardized code quality stack to any pnpm TypeScript project.

## Step 1: Detect Project

Read `package.json` and determine:

- **HAS_REACT** — `react` in `dependencies`
- **HAS_TAILWIND** — `tailwindcss` in `dependencies` or `devDependencies`
- **HAS_TYPESCRIPT** — `typescript` in `dependencies` or `devDependencies`
- **HAS_EXPO** — `expo` in `dependencies`
- **IS_ESM** — `"type": "module"` in package.json

**Bail if**:

- No `pnpm-lock.yaml` → tell user this skill requires pnpm
- No `tsconfig.json` → tell user this skill requires TypeScript

## Step 2: Scan for Ignore Patterns

Check if these directories/files exist in the project root. Only include ones that actually exist:

- `dist`, `build`, `.next`, `.expo`, `.output`
- `convex/_generated`
- `coverage`
- `metro.config.js`, `metro.config.cjs`
- `babel.config.js`
- `tailwind.config.js`, `tailwind.config.ts`

Store as `IGNORE_PATTERNS` for use in ESLint globalIgnores and .prettierignore.

## Step 3: Back Up Existing Configs

Rename any existing configs to `.bak`:

- `.eslintrc`, `.eslintrc.js`, `.eslintrc.cjs`, `.eslintrc.json`, `.eslintrc.yml`
- `eslint.config.js`, `eslint.config.mjs`, `eslint.config.cjs`
- `.prettierrc`, `.prettierrc.js`, `.prettierrc.cjs`, `.prettierrc.json`, `.prettierrc.yml`
- `.prettierignore`
- `.jscpd.json`

Only rename files that exist. Skip if no existing configs found.

## Step 4: Install Packages

Run a single `pnpm add -D` command with these packages:

**Always**:

- `@eslint/js`
- `eslint`
- `typescript-eslint`
- `globals`
- `prettier`
- `eslint-config-prettier`
- `eslint-plugin-sonarjs`
- `eslint-plugin-unicorn`
- `jscpd`

**If HAS_REACT**:

- `eslint-plugin-react-hooks`

**If HAS_TAILWIND**:

- `prettier-plugin-tailwindcss`

**If NOT HAS_TYPESCRIPT**:

- `typescript`

## Step 5: Generate ESLint Config

**File name**: `eslint.config.js` if IS_ESM, otherwise `eslint.config.mjs`

```js
import js from "@eslint/js";
import globals from "globals";
// CONDITIONAL: only if HAS_REACT
import reactHooks from "eslint-plugin-react-hooks";
import sonarjs from "eslint-plugin-sonarjs";
import unicorn from "eslint-plugin-unicorn";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores([
    // INSERT: IGNORE_PATTERNS from Step 2
  ]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      // CONDITIONAL: only if HAS_REACT
      reactHooks.configs.flat.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // CONDITIONAL: only if HAS_REACT (React Native needs require() for images)
      "@typescript-eslint/no-require-imports": "off",
      // Allow unused vars with underscore prefix
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  // Sonarjs cherry-pick (NOT recommended preset — avoids overlap with unicorn)
  {
    plugins: { sonarjs },
    rules: {
      "sonarjs/cognitive-complexity": ["error", 15],
      "sonarjs/no-duplicate-string": "error",
      "sonarjs/no-identical-functions": "error",
    },
  },
  // Unicorn full recommended + overrides
  unicorn.configs["flat/recommended"],
  {
    rules: {
      "unicorn/no-null": "off",
      "unicorn/prevent-abbreviations": "off",
      "unicorn/filename-case": "off",
    },
  },
  // Complexity limits
  {
    rules: {
      "max-lines": [
        "error",
        { max: 300, skipBlankLines: true, skipComments: true },
      ],
      "max-lines-per-function": [
        "error",
        { max: 50, skipBlankLines: true, skipComments: true },
      ],
      "max-depth": ["error", 4],
    },
  },
  // Exemptions for theme/config files (duplicate color strings are expected)
  {
    files: ["**/theme.ts", "**/theme.tsx"],
    rules: {
      "sonarjs/no-duplicate-string": "off",
    },
  },
  // Exemptions for stories and SVGs
  {
    files: ["**/stories/**/*", "**/*Svg.tsx"],
    rules: {
      "max-lines": "off",
      "max-lines-per-function": "off",
      "max-depth": "off",
      "sonarjs/cognitive-complexity": "off",
    },
  },
]);
```

**Notes**:

- Remove `reactHooks` import and extends entry if NOT HAS_REACT
- Remove `@typescript-eslint/no-require-imports` rule if NOT HAS_REACT
- Populate `globalIgnores` array with string entries from IGNORE_PATTERNS

## Step 6: Generate `.prettierrc`

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

**If HAS_TAILWIND**, add:

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

## Step 7: Generate `.prettierignore`

Always include:

```
node_modules
pnpm-lock.yaml
```

Then append each entry from IGNORE_PATTERNS (one per line).

## Step 8: Generate `.jscpd.json`

```json
{
  "threshold": 5,
  "reporters": ["consoleFull"],
  "ignore": ["node_modules/**", "**/*.d.ts", "plans/**"],
  "format": ["typescript", "javascript"],
  "minLines": 5,
  "minTokens": 50,
  "gitignore": true
}
```

Build the `ignore` array dynamically:

- Always include `node_modules/**`, `**/*.d.ts`, `plans/**`
- For each directory in IGNORE_PATTERNS that exists, append `<dir>/**`
- If a stories directory exists (e.g. `app/stories`), add matching glob (e.g. `app/stories/**`)

## Step 9: Generate Quality Scripts

Create `scripts/quality/` directory with 3 executable bash scripts:

**check.sh** — quality pipeline (metro bundle, typecheck, duplicate detection):

```bash
#!/usr/bin/env bash
set -uo pipefail

EXIT_CODE=0

# CONDITIONAL: only if HAS_EXPO
echo "===== Metro Bundle ====="
npx expo export --platform web --output-dir /tmp/expo-typegen || EXIT_CODE=$?

echo "===== TypeScript ====="
npx tsc --noEmit || EXIT_CODE=$?

echo "===== Duplicate Code ====="
npx jscpd --config .jscpd.json --exitCode 1 --reporters consoleFull || EXIT_CODE=$?

exit $EXIT_CODE
```

Remove the Metro Bundle section if NOT HAS_EXPO.

**format-file.sh** — formats a single file by extension:

```bash
#!/usr/bin/env bash
set -euo pipefail

FILE="$1"
EXT="${FILE##*.}"

case "$EXT" in
  ts|tsx|js|jsx|css|json|md)
    pnpm format:file "$FILE"
    ;;
  *)
    echo "Skipping unsupported extension: .$EXT"
    ;;
esac
```

**lint-fix-file.sh** — lints and fixes a single file by extension:

```bash
#!/usr/bin/env bash
set -euo pipefail

FILE="$1"
EXT="${FILE##*.}"

case "$EXT" in
  ts|tsx|js|jsx)
    pnpm lint:fix "$FILE"
    ;;
  *)
    echo "Skipping unsupported extension: .$EXT"
    ;;
esac
```

After creating all three scripts, run `chmod +x scripts/quality/*.sh`.

## Step 10: Ensure `tsconfig.json` has `strict: true`

Read `tsconfig.json`. If `compilerOptions.strict` is not `true`, set it to `true`. Do NOT touch any other tsconfig options.

## Step 11: Merge Scripts into `package.json`

Add/overwrite these scripts in package.json:

```json
{
  "lint": "eslint .",
  "lint:fix": "eslint . --fix",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "format:file": "prettier --write",
  "typecheck": "tsc --noEmit",
  "quality:check": "bash scripts/quality/check.sh",
  "check": "pnpm lint && pnpm format:check && pnpm quality:check"
}
```

Do NOT remove existing scripts — only add or overwrite these keys.

Also add these fields to package.json if not present:

- `packageManager` — required by `pnpm/action-setup@v4` in CI. Run `pnpm --version` to get the current version.
- `engines.node` — use the major version from `.tool-versions` or `.nvmrc`.

```json
{
  "packageManager": "pnpm@10.11.0",
  "engines": {
    "node": ">=22"
  }
}
```

## Step 12: Generate GitHub Actions Workflow

Create `.github/workflows/check.yml`. Read the Node version from `.tool-versions` or `.nvmrc` via `node-version-file`. Run three parallel jobs — Lint, Format, Quality — so each reports independently in the PR checks UI.

```yaml
name: Check

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .tool-versions
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint

  format:
    name: Format
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .tool-versions
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm format:check

  quality:
    name: Quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .tool-versions
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: TypeScript
        run: pnpm typecheck
      - name: Duplicate Code
        run: npx jscpd --config .jscpd.json --exitCode 1 --reporters consoleFull
```

**Notes**:

- Use `node-version-file: .tool-versions` if `.tool-versions` exists, otherwise `.nvmrc`
- If HAS_EXPO, add a Metro Bundle step before TypeScript in the quality job: `npx expo export --platform web --output-dir /tmp/expo-typegen`
- The quality job splits TypeScript and jscpd into separate named steps for clear failure identification

## Step 13: Generate Claude Code Hooks

Create `.claude/hooks/` directory with 3 hooks that enforce quality automatically during Claude Code sessions.

**session-start-hook.sh** — stashes model name for other hooks:

```bash
#!/bin/bash
# Stash model name for other hooks to read
INPUT=$(cat)
MODEL=$(echo "$INPUT" | jq -r '.model // ""')
echo "$MODEL" > /tmp/claude-code-model
exit 0
```

**post-edit-hook.sh** — auto-formats and lint-fixes every edited file:

```bash
#!/bin/bash
# PostToolUse hook: format + lint edited files

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Format (suppress output)
pnpm format:file "$FILE_PATH" >/dev/null 2>&1 || true

# Lint-fix and capture remaining issues
OUTPUT=$(pnpm lint:fix "$FILE_PATH" 2>&1) || true

if [ -n "$OUTPUT" ] && echo "$OUTPUT" | grep -qE "(error|warning)"; then
  ESCAPED=$(echo "$OUTPUT" | jq -Rs .)
  echo "{\"hookSpecificOutput\":{\"hookEventName\":\"PostToolUse\",\"additionalContext\":$ESCAPED}}"
fi

exit 0
```

**stop-quality-hook.sh** — blocks Claude from stopping if quality checks fail:

```bash
#!/bin/bash
# Stop hook: advisory quality gate

INPUT=$(cat)
STOP_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false')
if [ "$STOP_ACTIVE" = "true" ]; then
  exit 0
fi

# Skip quality check for haiku model
MODEL=$(cat /tmp/claude-code-model 2>/dev/null || echo "")
if echo "$MODEL" | grep -qi "haiku"; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR" || exit 1

OUTPUT=$(pnpm quality:check 2>&1) || true

# Only output if there are actual issues
if echo "$OUTPUT" | grep -qE "(error TS|Found [1-9].*clones|Metro bundle failed)"; then
  ESCAPED=$(echo "$OUTPUT" | jq -Rs .)
  echo "{\"decision\":\"block\",\"reason\":$ESCAPED}"
else
  echo "{\"decision\":\"approve\"}"
fi

exit 0
```

After creating all three hooks, run `chmod +x .claude/hooks/*.sh`.

Then create or merge `.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/session-start-hook.sh",
            "timeout": 5
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/post-edit-hook.sh",
            "timeout": 30
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/stop-quality-hook.sh",
            "timeout": 120
          }
        ]
      }
    ]
  }
}
```

If `.claude/settings.json` already exists, merge the `hooks` key — do NOT overwrite other settings.

## Step 14: Verify

Run `pnpm check` — this is the master command that calls lint → format:check → quality:check. Fix config issues if any step fails:

- Lint errors → add ESLint rule overrides as needed
- Format errors → run `pnpm format` to auto-fix, then re-run
- TypeScript errors → check tsconfig strict issues
- Duplicate code errors → check jscpd config

Report results to user. If all pass, setup is complete.

## Checklist

- [ ] Detect React, Tailwind, TypeScript, Expo, ESM from package.json
- [ ] Bail if no pnpm-lock.yaml or tsconfig.json
- [ ] Scan for ignore patterns (only existing dirs/files)
- [ ] Back up existing eslint/prettier/jscpd configs to .bak
- [ ] Install required packages via `pnpm add -D` (including sonarjs, unicorn, jscpd)
- [ ] Generate ESLint flat config (conditional React/Tailwind + sonarjs + unicorn + complexity)
- [ ] Generate .prettierrc (conditional Tailwind plugin)
- [ ] Generate .prettierignore from detected patterns
- [ ] Generate .jscpd.json with dynamic ignore patterns
- [ ] Generate scripts/quality/ (check.sh, format-file.sh, lint-fix-file.sh)
- [ ] Set `strict: true` in tsconfig.json
- [ ] Merge quality scripts into package.json
- [ ] Add `engines` field to package.json
- [ ] Generate `.github/workflows/check.yml` (3 parallel jobs: Lint, Format, Quality)
- [ ] Generate Claude hooks (session-start, post-edit, stop-quality) + `.claude/settings.json`
- [ ] Run `pnpm check` to verify all checks pass

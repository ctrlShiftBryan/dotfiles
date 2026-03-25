---
name: quality-setup
description: >-
  Add ESLint v10 flat config (sonarjs, unicorn, complexity limits) + Prettier +
  jscpd + TypeScript strict + Vitest (unit/component/storybook) + Playwright E2E +
  quality scripts + git hooks + GitHub Actions CI to any pnpm React + Vite +
  TypeScript project. Detects existing tooling and only adds what's missing.
  Use this skill whenever setting up quality checks, linting, testing, CI, or
  code quality infrastructure in a React project, even if the user just says
  "add tests", "set up linting", "add CI", or "quality checks".
user_invocable: true
---

# Quality Setup for React + Vite + pnpm + TypeScript

Adds production-grade quality infrastructure to a React + Vite + pnpm + TypeScript project. Everything works together: lint, format, typecheck, duplicate detection, unit/component tests with coverage, E2E tests, git hooks, and CI.

Reference files in `references/` contain complete config templates. Read them when you reach the relevant phase — they have adaptation notes and edge case guidance.

## Phase 0: Pre-flight Detection

Before adding anything, detect what the project already has.

### Prerequisites (stop if missing)

1. **pnpm** — `pnpm-lock.yaml` must exist. If `yarn.lock` or `package-lock.json` found instead, stop.
2. **Vite** — `vite.config.ts` (or `.js`/`.mjs`) must exist. If not, stop.
3. **TypeScript** — `tsconfig.json` must exist.
4. **Single package** — if `pnpm-workspace.yaml` exists, stop. This skill targets single-package projects.

### Detect existing tooling

| Tool       | Detection                              | If found                                                                 |
| ---------- | -------------------------------------- | ------------------------------------------------------------------------ |
| ESLint     | `eslint.config.*` or `.eslintrc*`      | Flat config: merge missing rules. Legacy: warn, offer migrate or skip.   |
| Prettier   | `.prettierrc*` or `prettier.config.*`  | Read existing. Only add missing settings. Never change formatting prefs. |
| jscpd      | `.jscpd.json`                          | Merge missing fields.                                                    |
| Vitest     | `vitest.config.*` or vitest in devDeps | Add coverage config if missing.                                          |
| Jest       | `jest.config.*`                        | Warn: skill uses Vitest. Offer migrate or coexist.                       |
| Playwright | `playwright.config.*`                  | Skip if present.                                                         |
| Storybook  | `@storybook/react` in deps             | If found: add portable story tests. If not: skip.                        |
| Git hooks  | `.githooks/` or `.husky/`              | If husky: suggest .githooks. If .githooks: verify hooks.                 |
| CI         | `.github/workflows/check.yml`          | Skip if quality workflow exists.                                         |

### Detect conditionals

- **Tailwind**: `tailwindcss` in deps or `tailwind.config.*` or `@tailwindcss/vite` in deps → include `prettier-plugin-tailwindcss`
- **Source layout**: check if `src/` directory has `.ts`/`.tsx` files → affects Vitest include patterns
- **Path aliases**: read `tsconfig.json` paths — Vitest inherits from vite.config via `mergeConfig`

### Scan for ignore patterns

Check which of these exist: `dist`, `build`, `.vite`, `coverage`, `playwright-report`, `test-results`. Store the list for ESLint globalIgnores, .prettierignore, and .jscpd.json ignore arrays.

---

## Phase 1: Install Dependencies

Check `package.json` devDependencies first — skip packages already at compatible versions.

**Always install:**

```bash
pnpm add -D \
  @eslint/js eslint eslint-config-prettier \
  eslint-plugin-react-hooks eslint-plugin-sonarjs eslint-plugin-unicorn \
  typescript-eslint globals \
  prettier jscpd \
  vitest @vitest/coverage-v8 \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event \
  jsdom @playwright/test tsx
```

**Conditional:**

- `prettier-plugin-tailwindcss` — only if Tailwind detected
- `@storybook/test` — only if Storybook 8+ detected

---

## Phase 2: ESLint

Read `references/eslint-config.md` for the complete template and adaptation notes.

Create `eslint.config.mjs` with:

- @eslint/js + typescript-eslint + react-hooks + eslint-config-prettier
- sonarjs cherry-picked (cognitive-complexity 15, no-duplicate-string, no-identical-functions)
- unicorn full recommended (overrides: no-null off, prevent-abbreviations off, filename-case off)
- Complexity: max-lines 300, max-lines-per-function 50, max-depth 4
- Exemptions for test files, stories, SVGs, theme files
- globalIgnores from detected patterns + `dist`, `.vite`, `coverage`

---

## Phase 3: Prettier

Read `references/prettier-config.md`.

- Create `.prettierrc` — with or without Tailwind plugin
- Create `.prettierignore` — node_modules, pnpm-lock.yaml, dist, .vite, coverage, etc.
- If existing config found: don't change formatting prefs, only add Tailwind plugin if missing

---

## Phase 4: jscpd

Template in `references/eslint-config.md` (bundled there).

Create `.jscpd.json` — threshold 5, minLines 5, minTokens 50, gitignore true. Ignore tests, stories, dist, coverage.

---

## Phase 5: TypeScript Strict

Read `tsconfig.json`. Add `"strict": true` if not set. Warn user about potential new errors. Don't change anything else.

---

## Phase 6: Vitest

Read `references/test-config.md` for the complete template.

- Create `vitest.config.ts` — merges with vite.config, jsdom, v8 coverage with 70% thresholds
- Create `vitest.setup.ts` — `@testing-library/jest-dom/vitest`
- If already configured: only add missing coverage thresholds and setup file

---

## Phase 7: Playwright

Read `references/test-config.md` Playwright section.

- Create `playwright.config.ts` — Vite dev server, Desktop Chrome, CI mode
- Create `tests/e2e/tsconfig.json`
- Create `tests/e2e/` directory
- Skip if already configured

---

## Phase 8: Storybook Tests (conditional)

Only if `@storybook/react` detected. Read `references/test-config.md` Storybook section.

Add portable story tests using `composeStories` + `@testing-library/react` + Vitest. Either colocated `*.stories.test.tsx` or central batch runner via `import.meta.glob`.

---

## Phase 9: Quality Check Script

Read `references/ci-config.md`.

Create `scripts/quality/check.sh`:

1. `vite build` to `/tmp/quality-build-check` (validates imports/syntax) + cleanup
2. `tsc --noEmit`
3. `jscpd`

Uses `set -uo pipefail` (not `-e`) so all checks run even if one fails.

Also create `scripts/quality/format-file.sh` and `scripts/quality/lint-fix-file.sh` for single-file operations.

Mark all executable: `chmod +x scripts/quality/*.sh`

---

## Phase 10: Git Hooks

Read `references/ci-config.md`.

- Create `.githooks/pre-commit` — runs `pnpm quality:check`
- Create `.githooks/pre-push` — runs `pnpm quality:check`
- Create `scripts/setup-git-hooks.ts` — configures `git config core.hooksPath .githooks`

Both hooks call only `pnpm quality:check`, not `pnpm check`. The full check suite (with tests) belongs in CI — hooks that run the full test suite are too slow and developers skip them.

Mark hooks executable. Run `scripts/setup-git-hooks.ts` to activate.

---

## Phase 11: Package.json Scripts

Read `references/ci-config.md` for the complete list.

Merge into `package.json` (don't replace existing scripts — warn on conflicts):

```json
{
  "lint": "eslint .",
  "lint:fix": "eslint . --fix",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "format:file": "prettier --write",
  "typecheck": "tsc --noEmit",
  "quality:check": "bash scripts/quality/check.sh",
  "test:unit": "vitest run",
  "test:unit:watch": "vitest",
  "test:unit:coverage": "vitest run --coverage",
  "test:e2e:web": "playwright test",
  "test:e2e:web:ci": "playwright test --reporter=github",
  "test:e2e:web:headed": "playwright test --headed",
  "test:e2e:web:ui": "playwright test --ui",
  "test": "vitest run",
  "test:ci": "vitest run --coverage",
  "check": "pnpm lint && pnpm format:check && pnpm quality:check && pnpm test:ci",
  "hooks:install": "npx tsx scripts/setup-git-hooks.ts"
}
```

Also add `packageManager` and `engines.node` fields if not present.

---

## Phase 12: GitHub Actions

Read `references/ci-config.md` for the workflow template.

Create `.github/workflows/check.yml`:

- Parallel jobs: lint, format, quality
- Test job with Vitest coverage + artifact upload
- E2E web job with Playwright Chromium install
- Coverage report aggregation
- Detect `.tool-versions` — use `node-version-file` if found, else `node-version: 22`

Skip if a check workflow already exists.

---

## Phase 13: Claude Code Hooks (optional)

If the user wants Claude Code integration, create `.claude/hooks/` with:

- **post-edit-hook.sh** — auto-formats and lint-fixes every edited file
- **stop-quality-hook.sh** — blocks Claude from stopping if quality checks fail

Read the hook templates below and create `.claude/settings.json` (merge if exists).

### post-edit-hook.sh

```bash
#!/bin/bash
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
if [ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ]; then exit 0; fi
cd "$CLAUDE_PROJECT_DIR"
bash scripts/quality/format-file.sh "$FILE_PATH" >/dev/null 2>&1 || true
OUTPUT=$(bash scripts/quality/lint-fix-file.sh "$FILE_PATH" 2>&1) || true
if [ -n "$OUTPUT" ] && echo "$OUTPUT" | grep -qE "(error|warning)"; then
  ESCAPED=$(echo "$OUTPUT" | jq -Rs .)
  echo "{\"hookSpecificOutput\":{\"hookEventName\":\"PostToolUse\",\"additionalContext\":$ESCAPED}}"
fi
exit 0
```

### stop-quality-hook.sh

```bash
#!/bin/bash
INPUT=$(cat)
STOP_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false')
if [ "$STOP_ACTIVE" = "true" ]; then exit 0; fi
cd "$CLAUDE_PROJECT_DIR" || exit 1
OUTPUT=$(pnpm quality:check 2>&1) || true
if echo "$OUTPUT" | grep -qE "(error TS|Found [1-9].*clones|Build failed)"; then
  ESCAPED=$(echo "$OUTPUT" | jq -Rs .)
  echo "{\"decision\":\"block\",\"reason\":$ESCAPED}"
else
  echo "{\"decision\":\"approve\"}"
fi
exit 0
```

### .claude/settings.json hooks config

```json
{
  "hooks": {
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

---

## Phase 14: Verify

Run each tool to confirm setup:

1. `pnpm lint` — pass (or pre-existing issues only)
2. `pnpm format:check` — pass
3. `pnpm typecheck` — pass
4. `pnpm test:unit` — pass ("no tests found" is OK)
5. `pnpm quality:check` — pass

If any fail, diagnose and fix before declaring success.

---

## Edge Cases

| Scenario                 | Action                                                                     |
| ------------------------ | -------------------------------------------------------------------------- |
| ESLint v8 (`.eslintrc*`) | Offer to upgrade to v10 flat config or skip                                |
| Jest present             | Offer to migrate to Vitest (usually just rename imports) or coexist        |
| No Tailwind              | Omit `prettier-plugin-tailwindcss`                                         |
| No `src/` dir            | Adjust Vitest includes to scan from root (see `references/test-config.md`) |
| Existing CI workflow     | Don't create duplicate — check for quality-related jobs first              |
| Monorepo                 | Stop. This skill targets single-package projects.                          |

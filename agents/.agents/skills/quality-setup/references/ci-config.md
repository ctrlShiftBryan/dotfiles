# CI, Quality Script, and Git Hooks Templates

## Table of Contents

1. [Quality Check Script](#quality-check-script)
2. [Git Hooks](#git-hooks)
3. [Git Hook Installer](#git-hook-installer)
4. [GitHub Actions Workflow](#github-actions-workflow)
5. [Package.json Scripts](#packagejson-scripts)

---

## Quality Check Script

Create `scripts/quality/check.sh`:

```bash
#!/usr/bin/env bash
set -uo pipefail

EXIT_CODE=0

echo "===== Vite Build ====="
pnpm exec vite build --outDir /tmp/quality-build-check 2>&1 || EXIT_CODE=$?
rm -rf /tmp/quality-build-check

echo "===== TypeScript ====="
pnpm exec tsc --noEmit || EXIT_CODE=$?

echo "===== Duplicate Code ====="
pnpm exec jscpd --config .jscpd.json --exitCode 1 --reporters consoleFull || EXIT_CODE=$?

exit $EXIT_CODE
```

Mark executable: `chmod +x scripts/quality/check.sh`

### Why `set -uo pipefail` without `-e`?

Using `-e` would stop at the first failure. Without it, all three checks run even if one fails — you see all problems at once instead of fixing them one at a time.

### What the Vite build check catches

The build validates that all imports resolve, JSX compiles, TypeScript emits valid JS, and tree-shaking doesn't break anything. Output goes to `/tmp/` and is cleaned up so it doesn't interfere with the real build.

---

## Git Hooks

Create `.githooks/pre-commit`:

```bash
#!/usr/bin/env bash
set -euo pipefail

if [[ "${SKIP_GIT_HOOKS:-0}" == "1" ]]; then
  echo "[pre-commit] SKIP_GIT_HOOKS=1; skipping."
  exit 0
fi

echo "[pre-commit] Running pnpm quality:check..."
pnpm quality:check
```

Create `.githooks/pre-push`:

```bash
#!/usr/bin/env bash
set -euo pipefail

if [[ "${SKIP_GIT_HOOKS:-0}" == "1" ]]; then
  echo "[pre-push] SKIP_GIT_HOOKS=1; skipping."
  exit 0
fi

echo "[pre-push] Running pnpm quality:check..."
pnpm quality:check
```

Mark both executable: `chmod +x .githooks/pre-commit .githooks/pre-push`

---

## Git Hook Installer

Create `scripts/setup-git-hooks.ts`:

```typescript
import { execSync } from "node:child_process";
import { chmodSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const HOOKS_DIR = path.join(ROOT, ".githooks");
const HOOK_FILES = ["pre-commit", "pre-push"] as const;

function isGitWorkTree() {
  try {
    const output = execSync("git rev-parse --is-inside-work-tree", {
      cwd: ROOT,
      stdio: "pipe",
      encoding: "utf8",
    }).trim();
    return output === "true";
  } catch {
    return false;
  }
}

function installHooks() {
  if (process.env.CI === "true") {
    console.log("CI detected -- skipping git hook setup.");
    return;
  }

  if (!isGitWorkTree()) {
    console.log("Not in a git worktree -- skipping git hook setup.");
    return;
  }

  if (!existsSync(HOOKS_DIR)) {
    console.log("No .githooks directory found -- skipping git hook setup.");
    return;
  }

  execSync("git config core.hooksPath .githooks", {
    cwd: ROOT,
    stdio: "pipe",
  });

  for (const hook of HOOK_FILES) {
    const hookPath = path.join(HOOKS_DIR, hook);
    if (!existsSync(hookPath)) continue;
    chmodSync(hookPath, 0o755);
  }

  console.log("Git hooks configured at .githooks");
  console.log(
    "Hooks are active by default. Set SKIP_GIT_HOOKS=1 to bypass them.",
  );
}

try {
  installHooks();
} catch {
  console.warn("Git hook setup failed. Run `pnpm hooks:install` to retry.");
}
```

### Why `.githooks/` instead of husky?

Lightweight, zero-dependency approach. `git config core.hooksPath .githooks` points git directly at the hooks directory — no npm package needed. The setup script handles permissions and is safe to run in CI (it no-ops).

### tsx dependency

The setup script is TypeScript. It needs `tsx` in devDependencies to run via `npx tsx scripts/setup-git-hooks.ts`. Make sure `tsx` is included in the dependency install phase.

---

## GitHub Actions Workflow

Create `.github/workflows/check.yml`:

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
          node-version: 22
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
          node-version: 22
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
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm quality:check

  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:ci
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage
          path: coverage/
          retention-days: 7

  e2e-web:
    name: E2E Web
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: Install Playwright Chromium
        run: npx playwright install --with-deps chromium
      - name: Run Playwright Tests
        run: pnpm test:e2e:web:ci
      - name: Upload Playwright Report
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: |
            playwright-report/
            test-results/
          retention-days: 7

  coverage:
    name: Coverage Report
    needs: test
    if: always()
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          pattern: coverage*
          path: coverage-reports/
      - name: Summary
        run: |
          echo "## Coverage Report" >> $GITHUB_STEP_SUMMARY
          for dir in coverage-reports/coverage*/; do
            if [ -f "${dir}coverage-summary.json" ]; then
              echo "" >> $GITHUB_STEP_SUMMARY
              echo "| Metric | Coverage |" >> $GITHUB_STEP_SUMMARY
              echo "|--------|----------|" >> $GITHUB_STEP_SUMMARY
              jq -r '.total | to_entries[] | "| \(.key) | \(.value.pct)% |"' "${dir}coverage-summary.json" >> $GITHUB_STEP_SUMMARY
            fi
          done
```

### Adaptation: `.tool-versions` file

If the project has `.tool-versions`, replace `node-version: 22` with `node-version-file: .tool-versions` in all jobs.

### Adaptation: different main branch

If the project uses `master` instead of `main`, update the `branches` arrays.

---

## Package.json Scripts

Merge these scripts into the project's `package.json`. Do not replace existing scripts with the same name — warn the user if there's a conflict.

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
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
}
```

### Script explanations

| Script                          | Purpose                                              |
| ------------------------------- | ---------------------------------------------------- |
| `lint` / `lint:fix`             | Run ESLint check / auto-fix                          |
| `format` / `format:check`       | Run Prettier write / check-only                      |
| `typecheck`                     | TypeScript check without emitting                    |
| `quality:check`                 | Build + typecheck + duplicate detection              |
| `test:unit` / `test:unit:watch` | Vitest single run / watch mode                       |
| `test:unit:coverage`            | Vitest with v8 coverage report                       |
| `test:e2e:web`                  | Playwright against dev server                        |
| `test:e2e:web:ci`               | Playwright with GitHub reporter (CI)                 |
| `test:e2e:web:headed`           | Playwright with visible browser                      |
| `test:e2e:web:ui`               | Playwright interactive UI mode                       |
| `test`                          | Alias for unit tests                                 |
| `test:ci`                       | Unit tests with coverage (CI)                        |
| `check`                         | Full quality gate: lint + format + quality + test:ci |
| `hooks:install`                 | (Re)install git hooks                                |

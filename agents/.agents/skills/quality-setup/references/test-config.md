# Test Configuration Templates

## Table of Contents

1. [Vitest Configuration](#vitest-configuration)
2. [Vitest Setup File](#vitest-setup-file)
3. [Playwright Configuration](#playwright-configuration)
4. [Storybook Portable Story Tests](#storybook-portable-story-tests)

---

## Vitest Configuration

Create `vitest.config.ts` in the project root.

```typescript
import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: "jsdom",
      include: [
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
        "src/**/*.spec.ts",
        "src/**/*.spec.tsx",
      ],
      exclude: ["**/node_modules/**", "tests/e2e/**", "dist/**"],
      setupFiles: ["./vitest.setup.ts"],
      coverage: {
        provider: "v8",
        reporter: ["text", "json-summary", "lcov"],
        thresholds: {
          lines: 70,
          functions: 70,
          branches: 70,
          statements: 70,
        },
        exclude: [
          "**/*.test.ts",
          "**/*.test.tsx",
          "**/*.spec.ts",
          "**/*.spec.tsx",
          "**/*.stories.ts",
          "**/*.stories.tsx",
          "**/*.d.ts",
          "**/*.config.*",
          "dist/**",
          "tests/e2e/**",
        ],
      },
    },
  }),
);
```

### Why mergeConfig?

`mergeConfig(viteConfig, vitestConfig)` inherits Vite's `resolve.alias`, plugins, and other settings. Path aliases defined in `vite.config.ts` (like `@/` -> `./src/`) automatically work in tests without duplication.

### Adaptation: no `src/` directory

If the project puts code at root instead of `src/`:

```typescript
include: [
  "**/*.test.ts",
  "**/*.test.tsx",
  "**/*.spec.ts",
  "**/*.spec.tsx",
],
exclude: [
  "**/node_modules/**",
  "tests/e2e/**",
  "dist/**",
  "scripts/**",
],
```

### Adaptation: existing vitest.config

If `vitest.config.ts` already exists, don't create a new one. Instead:

1. Check if `coverage` is configured — add it if missing
2. Check if `coverage.thresholds` is set — add 70% thresholds if missing
3. Check if `setupFiles` includes `vitest.setup.ts` — add if missing

---

## Vitest Setup File

Create `vitest.setup.ts` in the project root.

```typescript
import "@testing-library/jest-dom/vitest";
```

This single import adds all `@testing-library/jest-dom` matchers (`toBeInTheDocument()`, `toHaveTextContent()`, `toBeVisible()`, etc.) to Vitest's `expect`.

### TypeScript support

Add to `tsconfig.json` types array if not already present:

```json
{
  "compilerOptions": {
    "types": ["vitest/globals"]
  }
}
```

Or exclude `vitest.config.ts` and `vitest.setup.ts` from the main tsconfig (they use their own module resolution).

---

## Playwright Configuration

Create `playwright.config.ts` in the project root.

```typescript
import { defineConfig, devices } from "@playwright/test";

const DEV_PORT = Number(process.env.PORT ?? 5173);

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.e2e.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "html",
  use: {
    baseURL: `http://localhost:${DEV_PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: `http://localhost:${DEV_PORT}`,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
```

Create `tests/e2e/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["./**/*.ts"]
}
```

Create the `tests/e2e/` directory. Do not create example test files — just the directory and tsconfig.

### Port detection

The default Vite dev port is 5173. If the project's `vite.config.ts` specifies a different port via `server.port`, update the `DEV_PORT` default to match. The `PORT` env var override still works regardless.

### Adaptation: custom dev script name

If `package.json` uses a script name other than `dev` for the Vite dev server (e.g., `start`, `serve`), update the `webServer.command` accordingly.

---

## Storybook Portable Story Tests

Only add this section if `@storybook/react` (or `@storybook/react-vite`) is detected in the project's dependencies.

### How it works

Storybook's `composeStories` API extracts stories from a story module and returns renderable React components. Combined with `@testing-library/react` and Vitest, this lets you render every story as a test — catching rendering errors, validating content, and getting coverage from your story demos for free.

### Example story test file

Create a story test file alongside stories, or in a central location. The convention is `*.stories.test.tsx` colocated with the story file:

```typescript
// src/components/Button/Button.stories.test.tsx
import { render, screen } from "@testing-library/react";
import { composeStories } from "@storybook/react";
import { describe, expect, it } from "vitest";
import * as stories from "./Button.stories";

const composed = composeStories(stories);

describe("Button stories", () => {
  for (const [name, Story] of Object.entries(composed)) {
    it(`renders ${name}`, () => {
      render(<Story />);
      // Validates story renders without crashing
      expect(document.body.firstChild).not.toBeNull();
    });
  }
});
```

### Batch story test runner

For projects with many stories, create a central test file that discovers and tests all stories:

```typescript
// src/stories.test.tsx
import { render } from "@testing-library/react";
import { composeStories } from "@storybook/react";
import { describe, expect, it } from "vitest";

// Import all story modules — adjust glob to match project structure
const storyModules = import.meta.glob<Record<string, unknown>>(
  "./components/**/*.stories.tsx",
  { eager: true }
);

describe("All stories render", () => {
  for (const [path, mod] of Object.entries(storyModules)) {
    const stories = composeStories(mod as Parameters<typeof composeStories>[0]);
    for (const [name, Story] of Object.entries(stories)) {
      it(`${path} > ${name}`, () => {
        render(<Story />);
        expect(document.body.firstChild).not.toBeNull();
      });
    }
  }
});
```

### Required dependencies

If Storybook is detected but these aren't present, add:

- `@storybook/react` (usually already installed)
- `@storybook/test` (for Storybook 8+ — provides `composeStories`)

For Storybook 7.x, `composeStories` is exported from `@storybook/react` directly.

### Detection logic

1. Check if `@storybook/react` or `@storybook/react-vite` is in deps/devDeps
2. Check the Storybook version — determines where `composeStories` is imported from
3. Look for existing `*.stories.tsx` files to confirm stories exist
4. If no stories found, skip story test setup but mention it's available

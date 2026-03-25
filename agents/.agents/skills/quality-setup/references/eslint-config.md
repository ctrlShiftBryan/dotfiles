# ESLint + jscpd Configuration Templates

## ESLint Flat Config

Create `eslint.config.mjs` in the project root.

```javascript
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import sonarjs from "eslint-plugin-sonarjs";
import unicorn from "eslint-plugin-unicorn";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores([
    "dist",
    ".vite",
    "coverage",
    "playwright-report",
    "test-results",
    // ADD project-specific generated directories here
  ]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
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
  // Exemptions for test files
  {
    files: [
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.spec.ts",
      "**/*.spec.tsx",
      "**/*.e2e.spec.ts",
      "**/vitest.setup.ts",
    ],
    rules: {
      "max-lines": "off",
      "max-lines-per-function": "off",
      "max-depth": "off",
      "sonarjs/cognitive-complexity": "off",
      "sonarjs/no-duplicate-string": "off",
    },
  },
  // Exemptions for stories and SVGs
  {
    files: ["**/*.stories.tsx", "**/*.stories.ts", "**/*Svg.tsx"],
    rules: {
      "max-lines": "off",
      "max-lines-per-function": "off",
      "max-depth": "off",
      "sonarjs/cognitive-complexity": "off",
      "sonarjs/no-duplicate-string": "off",
    },
  },
  // Exemptions for theme/config files
  {
    files: ["**/theme.ts", "**/theme.tsx"],
    rules: {
      "sonarjs/no-duplicate-string": "off",
    },
  },
  // Prettier must be last — disables all formatting rules that conflict
  prettier,
]);
```

### Adaptation notes

- **Removed** from source: `.expo`, `metro.config.js`, `babel.config.js`, `convex/_generated`, `.rnstorybook`, `.agents/skills` ignores
- **Added**: `dist`, `.vite` ignores
- **Added**: `eslint-config-prettier` as final config (the source project has it as a devDependency but doesn't import it in the config — this fixes that)
- **Removed**: `@typescript-eslint/no-require-imports: off` — standard React+Vite projects use ES imports exclusively
- **Added**: `*.stories.tsx` / `*.stories.ts` exemptions for Storybook files
- **Kept identical**: sonarjs cherry-pick (cognitive-complexity 15, no-duplicate-string, no-identical-functions), unicorn full recommended + overrides (no-null off, prevent-abbreviations off, filename-case off), complexity limits (300 lines, 50 lines/function, depth 4)

### Why cherry-pick sonarjs instead of using the full recommended preset?

Unicorn's recommended set already covers many of the same code-smell patterns. Running both full presets causes redundant, confusing error messages for the same issue. Cherry-picking the three most valuable sonarjs rules avoids that overlap while still catching cognitive complexity, duplicate strings, and copy-paste functions.

---

## jscpd Configuration

Create `.jscpd.json` in the project root.

```json
{
  "threshold": 5,
  "reporters": ["consoleFull"],
  "ignore": [
    "node_modules/**",
    "**/*.d.ts",
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/*.spec.ts",
    "**/*.spec.tsx",
    "**/*.e2e.spec.ts",
    "**/*.stories.ts",
    "**/*.stories.tsx",
    "tests/**",
    "coverage/**",
    "dist/**",
    "plans/**"
  ],
  "format": ["typescript", "javascript"],
  "minLines": 5,
  "minTokens": 50,
  "gitignore": true
}
```

### What these settings mean

- **threshold: 5** — fail if more than 5% of scanned code is duplicated
- **minLines: 5 / minTokens: 50** — only flag duplicates that are at least 5 lines and 50 tokens (avoids noise from short patterns like import blocks)
- **gitignore: true** — respects `.gitignore` so build artifacts and deps are automatically excluded
- **Test/story files excluded** — duplicates in tests are often intentional (similar test setups)

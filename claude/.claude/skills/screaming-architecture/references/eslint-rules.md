# ESLint Boundary Enforcement

ESLint flat config rules to enforce screaming architecture import boundaries. These rules catch violations at lint time rather than code review time.

## Expo React Native Project

```js
// eslint.config.js
import { defineConfig } from "eslint/config";

export default defineConfig([
  // Block Convex imports in app/ screens
  {
    files: ["app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: ["convex/_generated/*", "convex/react"],
            message: "Screens must not import Convex directly. Use feature hooks from features/*/hooks/ instead.",
          },
        ],
      }],
    },
  },

  // Exception: app/_layout.tsx CAN import convex/react (for provider setup)
  {
    files: ["app/_layout.tsx"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: ["convex/_generated/api"],
            message: "Root layout may set up ConvexProvider but should not call api.* directly.",
          },
        ],
      }],
    },
  },

  // Block feature/convex imports in components/ui/
  {
    files: ["components/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: ["@/features/*", "convex/*", "convex/_generated/*"],
            message: "UI primitives must not depend on features or Convex. Only import from shared/.",
          },
        ],
      }],
    },
  },

  // Block React/RN/Convex in shared/
  {
    files: ["shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: ["react", "react-native", "react-native-*", "convex/*", "convex/_generated/*", "expo-*"],
            message: "shared/ must be pure TypeScript — no React, React Native, or Convex imports.",
          },
        ],
      }],
    },
  },

  // Block cross-feature imports
  // NOTE: This pattern works but is fragile. For robust cross-feature detection,
  // consider eslint-plugin-boundaries or the bundled analyze_structure.sh script.
  {
    files: ["features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: ["@/features/*/*"],
            message: "Cross-feature imports are not allowed. Extract shared logic to shared/ instead.",
          },
        ],
      }],
    },
  },
]);
```

## Using eslint-plugin-boundaries (Advanced)

For more granular control, `eslint-plugin-boundaries` can define element types and enforce allowed dependencies between them:

```js
// eslint.config.js
import boundaries from "eslint-plugin-boundaries";

export default [
  {
    plugins: { boundaries },
    settings: {
      "boundaries/elements": [
        { type: "app", pattern: "app/**" },
        { type: "feature", pattern: "features/*/**", capture: ["feature"] },
        { type: "ui", pattern: "components/ui/**" },
        { type: "hooks", pattern: "hooks/**" },
        { type: "shared", pattern: "shared/**" },
        { type: "convex", pattern: "convex/**" },
      ],
    },
    rules: {
      "boundaries/element-types": ["error", {
        default: "disallow",
        rules: [
          // app/ can import features, ui, hooks, shared
          {
            from: "app",
            allow: ["feature", "ui", "hooks", "shared"],
          },
          // features can import ui, shared, own feature
          {
            from: "feature",
            allow: [
              "ui",
              "shared",
              ["feature", { feature: "${from.feature}" }],
            ],
          },
          // ui can import shared only
          {
            from: "ui",
            allow: ["shared"],
          },
          // hooks can import shared only
          {
            from: "hooks",
            allow: ["shared"],
          },
          // shared imports nothing
          {
            from: "shared",
            allow: [],
          },
        ],
      }],
    },
  },
];
```

## Web React Project

Same concept, different file paths:

```js
// eslint.config.js (Web React with src/)
export default [
  // Block feature/API imports in src/components/
  {
    files: ["src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          group: ["@/features/*", "*/api/*"],
          message: "Shared components must not depend on features or API clients.",
        }],
      }],
    },
  },

  // Block React in src/lib/
  {
    files: ["src/lib/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          group: ["react", "react-dom"],
          message: "lib/ must be pure TypeScript.",
        }],
      }],
    },
  },

  // Pages should be thin — this is harder to lint but you can
  // use max-lines per file as a soft signal
  {
    files: ["src/pages/**/*.{ts,tsx}"],
    rules: {
      "max-lines": ["warn", { max: 50, skipBlankLines: true, skipComments: true }],
    },
  },
];
```

## Adding to an Existing Project

1. Install: `npm install -D eslint-plugin-boundaries` (if using advanced mode)
2. Add the rules above to your `eslint.config.js`
3. Run `npx eslint .` to see existing violations
4. Fix violations or add `// eslint-disable-next-line` with a TODO for legacy code
5. Add to CI to prevent new violations

The bundled `analyze_structure.sh` script catches the same violations without requiring ESLint — useful for quick audits or projects without ESLint set up.

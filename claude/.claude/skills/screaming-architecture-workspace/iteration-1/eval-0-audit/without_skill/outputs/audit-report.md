# Architecture Audit: anders-wolfpack

## Project Overview

React Native / Expo app (SDK 55) using:
- Expo Router (file-based routing)
- NativeWind v4 (Tailwind CSS for RN)
- Convex (backend)
- TypeScript strict mode
- pnpm + Node >= 22

## Directory Structure

```
app/                        # Expo Router screens
  _layout.tsx
  index.tsx
  components/[slug].tsx
components/
  ui/                       # ~30 primitive UI components
features/
  demo/
    components/             # preview wrappers + drawer
    atomic-classification.ts
    registry.ts
hooks/                      # global hooks (theme only)
shared/                     # pure utilities
  theme/fonts.ts
  utils.ts
convex/                     # backend (nearly empty — only generated types)
scripts/                    # bg process management, quality checks, setup
tests/
  e2e/web/
```

---

## What's Working Well

### 1. Clear layer separation
The project has four distinct layers with explicit rules documented in CLAUDE.md:
- `app/` — routing shells only, no business logic
- `features/<name>/` — feature-scoped modules
- `components/ui/` — pure presentational primitives
- `shared/` — pure logic, no React/Convex

This is the right model for Expo Router apps and the rules are enforced via documentation.

### 2. UI primitives are clean
Every file in `components/ui/` imports only from `@/shared/utils` and `@rn-primitives/*`. No feature or Convex imports. CVA is used correctly for variants. Platform-specific branches are handled inline with `Platform.select()` rather than platform-suffix files (which would fragment logic).

### 3. `shared/` is genuinely pure
`shared/utils.ts` is just `cn()`. `shared/theme/fonts.ts` is just font constant definitions. No React, no Convex, no side effects. The constraint holds.

### 4. Hooks are platform-aware and well-split
`use-color-scheme.ts` / `use-color-scheme.web.ts` is a correct use of Expo's platform-suffix file convention. `use-theme-mode.ts` orchestrates system color scheme + NativeWind color scheme cleanly, and `getInitialWebTheme` handles the SSR edge case for web.

### 5. Atomic Design taxonomy is explicit and consistent
The `features/demo/atomic-classification.ts` and `registry.ts` files classify every component as Atom/Molecule/Organism. The drawer UI groups components by that taxonomy. The classifications are consistent with industry norms (Badge/Button/Input = Atom; Dialog/Accordion/Select = Molecule).

### 6. Tooling quality is high
- ESLint with SonarJS cognitive complexity (max 15), unicorn, react-hooks
- `max-lines: 300`, `max-lines-per-function: 50`, `max-depth: 4`
- jscpd for duplicate code detection
- Vitest (unit), Jest/jest-expo (component), Playwright (e2e web), Maestro (e2e native)
- `pnpm quality:check` runs Metro bundle + tsc + jscpd together — this is a solid gate

### 7. Convex boundary is correct in intent
CLAUDE.md explicitly forbids `useQuery(api.*)` in screens and requires all Convex access to live in `features/<name>/hooks/`. This is the right pattern.

### 8. Background process management
The `bg.sh` script + `pnpm bg:*` scripts prevent blocking terminal use from long-running dev processes. This is a legitimate DX win for AI-agent-assisted development.

---

## Issues and Concerns

### 1. `features/` has only one feature: `demo`
The entire `features/` directory contains exactly one domain — a component showcase. There are no real product features. This means the feature-folder architecture hasn't been exercised for real use cases yet. It's a template/starter scaffold at this point.

Implication: it's not possible to evaluate whether cross-feature boundary discipline would hold in practice.

### 2. Convex backend is essentially empty
`convex/` contains only generated types and a test setup file. There are no queries, mutations, or schema definitions. This means the Convex boundary pattern (all access via `features/<name>/hooks/`) cannot be evaluated against real data access code.

### 3. `hooks/` vs `features/<name>/hooks/` is ambiguous
The root `hooks/` directory holds theme hooks. CLAUDE.md says root `hooks/` is for "global reusable hooks" and feature hooks live in `features/<name>/hooks/`. The distinction is reasonable on paper, but in practice both `use-theme-mode.ts` and `get-initial-web-theme.ts` could arguably live in `features/theme/` or `shared/theme/`. The current split adds a third place to look for hooks beyond `shared/` and `features/`.

### 4. `app/_layout.tsx` has leaked business logic
`_layout.tsx` contains:
- `ThemeSelector` — a full interactive UI component with multiple variants and Portal rendering
- `CustomHeader` — a composed layout component
- `useAppFonts` — a custom hook
- `MaybeConvex` — a conditional provider wrapper

CLAUDE.md says `app/` screens should have "No business logic or data fetching." These components aren't data-fetching, but they're substantial UI logic that belongs elsewhere. `ThemeSelector` and `CustomHeader` could reasonably live in `features/demo/components/` or a `features/shell/` module. The `// eslint-disable-next-line max-lines-per-function` suppression comments on both large functions confirm the file is straining against the 50-line limit.

### 5. `app/index.tsx` composes directly from `features/demo/components`
`app/index.tsx` imports 23 named components from `@/features/demo/components`. Each component is placed manually into a layout grid. This is fine for a demo/showcase app but means the home screen is tightly coupled to the demo feature's component exports. Any restructuring of the demo feature's component exports would require changes in the screen.

### 6. Route and feature namespace collision risk
`app/components/[slug].tsx` is a route named `components`. This mirrors `components/ui/` (the primitive library). The naming could cause confusion — "components" as a route vs "components" as a folder containing UI primitives. A more explicit route name like `app/stories/[slug].tsx` or `app/preview/[slug].tsx` would better communicate intent.

### 7. No barrel exports / index files for `components/ui/`
`components/ui/` has no `index.ts`. Consumers import from individual files: `@/components/ui/button`, `@/components/ui/text`, etc. This is actually fine for tree-shaking and avoids barrel file anti-patterns, but it means import paths are long and there's no single place to discover what's available. The current approach is acceptable but worth noting.

### 8. Theme tokens are duplicated
Theme color values (HSL strings) are defined in both `global.css` (CSS variables) and `hooks/theme.ts` (JS objects for React Navigation). Any theme change requires updating both places. There's no single source of truth for the design tokens.

### 9. No real tests for feature logic
The only unit test file is `shared/utils.unit.test.ts`, which tests the `cn()` utility. There are no tests for `features/demo/registry.ts` (which has non-trivial `findBySlug` and `groupByAtomicLevel` functions) or for any hooks. The e2e tests cover page load and drawer visibility but nothing behavioral.

### 10. `features/demo/components/` splits previews across 5 files with no clear rule
Preview components are split into `display-previews.tsx`, `form-previews.tsx`, `input-previews.tsx`, `overlay-previews.tsx`, `additional-previews.tsx`, and `topbar-previews.tsx`. The grouping categories don't map cleanly to any standard taxonomy (the registry uses Atom/Molecule/Organism, but the files don't). `additional-previews.tsx` is a catch-all. This is a minor organizational inconsistency.

---

## Summary Table

| Area | Rating | Notes |
|------|--------|-------|
| Layer boundaries | Good | Rules are clear and followed |
| UI primitives | Good | Clean, no leakage |
| `shared/` purity | Good | No React/Convex |
| Feature modules | Partial | Only `demo` exists; no real features |
| Convex boundary | Not testable | Backend is empty |
| Root `hooks/` | Acceptable | Slight ambiguity vs feature hooks |
| `app/_layout.tsx` | Needs work | Business logic leaked in |
| Theme token sync | Needs work | Duplicated in CSS + JS |
| Testing | Thin | Only `cn()` unit tested |
| Tooling/CI | Good | Quality gate is comprehensive |
| Naming clarity | Minor issue | Route `/components/[slug]` vs `components/ui/` |

---

## Recommendations

1. Extract `ThemeSelector`, `CustomHeader`, and `useAppFonts` out of `_layout.tsx` into `features/shell/` or `features/theme/`.
2. Create a single design token source (e.g., a JS/TS constants file) and derive both `global.css` variables and `hooks/theme.ts` from it, or at minimum add a comment cross-reference.
3. Rename `app/components/[slug].tsx` to `app/preview/[slug].tsx` or `app/stories/[slug].tsx` to avoid naming collision confusion with `components/ui/`.
4. Add unit tests for `features/demo/registry.ts` (`findBySlug`, `groupByAtomicLevel`).
5. When adding real features, ensure each lives in `features/<name>/` with its own `hooks/`, `components/`, `utils/`, `types.ts` following the documented convention.
6. Align the preview file split in `features/demo/components/` with the Atom/Molecule/Organism taxonomy used in the registry, or document the current split's rationale.

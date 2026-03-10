# Architecture Audit: anders-wolfpack
**Date:** 2026-03-10
**Project Type:** Expo React Native + Convex

## Summary

This is a component-library showcase / starter kit app with a solid foundational architecture — the top-level directory layout is clean, import boundaries are mostly respected, and the one business domain (`features/demo`) is properly isolated. However, the app is early-stage: the Convex backend is empty (no schema, no functions), and the home screen (`app/index.tsx`) contains significant inline layout logic that should live in the feature layer. The `_layout.tsx` file also embeds UI components (header, theme selector) that belong in `features/demo/components/`.

**Score: 6/10**

| Category | Status |
|----------|--------|
| Directory Structure | ✅ Good |
| Screen Thickness | ⚠️ Needs Work |
| Import Boundaries | ⚠️ Needs Work |
| Feature-Route Alignment | ✅ Good |
| Backend Structure | ⚠️ Needs Work |
| Platform Code | ✅ Good |

---

## Findings

### 🔴 Violations (must fix)

- **What:** `app/index.tsx` defines four layout functions inline (`TopBar`, `LeftColumn`, `MiddleColumn`, `RightColumn`) totaling 147 lines. These are domain components for the demo feature — they belong in `features/demo/components/`, not in a screen file.
  - **Where:** `/Users/bryanarendt/code2/anders-wolfpack/app/index.tsx`
  - **Fix:** Move `TopBar`, `LeftColumn`, `MiddleColumn`, `RightColumn` to `features/demo/components/home-layout.tsx` (or individual files). The screen should collapse to ~15 lines that import and compose those components.

- **What:** `app/_layout.tsx` defines three non-provider components inline — `ThemeSelector` (50 lines), `CustomHeader` (45 lines), and a `useAppFonts` hook — in addition to the provider chain. A layout file is allowed to set up providers and the navigator, but UI sub-components and custom hooks are business logic and should live in feature directories.
  - **Where:** `/Users/bryanarendt/code2/anders-wolfpack/app/_layout.tsx`
  - **Fix:** Move `ThemeSelector` and `CustomHeader` to `features/demo/components/` (or a new `features/shell/components/` if you want to separate navigation chrome from demo content). Move `useAppFonts` to `hooks/use-app-fonts.ts`. The layout file should shrink from 225 lines to ~60 lines.

### 🟡 Warnings (should fix)

- **What:** `shared/theme/fonts.ts` imports from `@expo-google-fonts/inter` and `expo-font`. The `shared/` directory is defined (both in project CLAUDE.md and this skill) as pure TypeScript — no React, no React Native, no Expo. Font source configuration is Expo-specific infrastructure and should not live in `shared/`.
  - **Where:** `/Users/bryanarendt/code2/anders-wolfpack/shared/theme/fonts.ts`
  - **Fix:** Move `shared/theme/fonts.ts` to `hooks/fonts.ts` (since it's consumed by `useAppFonts` in `_layout.tsx`) or to a new `constants/fonts.ts`. Keep `shared/` for pure TS only (currently `shared/utils.ts` correctly uses only `clsx` and `tailwind-merge`).

- **What:** The `features/demo` domain has no `hooks/` subdirectory and no `types.ts`. There are no Convex hooks yet (since the backend is empty), but the feature also has no type definitions even though `atomic-classification.ts` and `registry.ts` define rich domain types (`AtomicLevel`, `AtomicClassification`, `RegistryEntry`). These type definitions are spread across domain logic files rather than consolidated.
  - **Where:** `/Users/bryanarendt/code2/anders-wolfpack/features/demo/`
  - **Fix:** Create `features/demo/types.ts` and move exported types (`AtomicLevel`, `AtomicClassification`, `RegistryEntry`) there. When Convex backend functions are added, add `features/demo/hooks/` accordingly.

- **What:** The Convex backend has no `schema.ts`, no domain directories, and no functions — only auto-generated files. The generated `dataModel.d.ts` explicitly says "No schema.ts file found." While the app works without it, the backend is not structured at all.
  - **Where:** `/Users/bryanarendt/code2/anders-wolfpack/convex/`
  - **Fix:** When adding backend functionality, follow the domain-folder pattern: `convex/schema.ts` composing `convex/{domain}/schema.ts`, with `queries.ts`, `mutations.ts`, and `helpers.ts` per domain.

- **What:** `features/demo/atomic-classification.ts` is not imported anywhere in the codebase. This is dead code.
  - **Where:** `/Users/bryanarendt/code2/anders-wolfpack/features/demo/atomic-classification.ts`
  - **Fix:** Either delete the file or wire it into the tests/components where atomic level classifications are needed. If it's meant for test coverage, move it to a test fixture or keep it for documentation but add a comment.

### 🟢 Notes (nice to have)

- **What:** No ESLint import boundary rules are configured. The project has a solid ESLint setup (unicorn, sonarjs, complexity limits) but lacks `eslint-plugin-import` or `eslint-plugin-boundaries` to programmatically enforce the layer rules documented in CLAUDE.md.
  - **Where:** `/Users/bryanarendt/code2/anders-wolfpack/eslint.config.mjs`
  - **Fix:** Add `eslint-plugin-boundaries` with zone rules matching the architecture: `app/` → allowed sources `features/`, `components/`, `hooks/`, `shared/`; `features/*/hooks/` → only place allowed to import `convex/_generated/api`; `shared/` → no React/RN/Convex imports.

- **What:** The only feature domain is `features/demo`, which is a showcase/starter domain. For a real app, actual business domains (e.g., `features/auth`, `features/pack-members`) would be expected. The `features/.gitkeep` file signals that real feature work hasn't begun yet, which is appropriate for a starter kit.
  - **Where:** `/Users/bryanarendt/code2/anders-wolfpack/features/`
  - **Fix:** No immediate action needed — this is by design for a template. When building real features, follow the vertical slice pattern documented in CLAUDE.md.

- **What:** `app/components/[slug].tsx` is a route named `components/[slug]` — this creates a `/components/:slug` URL path. The directory name `components/` inside `app/` might be confusing because `components/` is conventionally a non-route directory. This is actually a valid Expo Router route (it only contains the `[slug].tsx` file, not non-route files), but the naming is worth noting.
  - **Where:** `/Users/bryanarendt/code2/anders-wolfpack/app/components/[slug].tsx`
  - **Fix:** This is acceptable since `app/components/` contains only a dynamic route file. Consider whether `/components/[slug]` is the desired URL shape, or if a route group like `app/(demo)/[slug].tsx` would be clearer. No violation — just a naming note.

---

## Detailed Sections

### Directory Structure

The project does scream its domain — opening the repo, you immediately see `features/`, `components/ui/`, `hooks/`, `shared/`, `convex/`, and `app/`. The structure matches the screaming architecture pattern.

**Expected (Expo):**
- `features/` with domain subdirectories ✅ (`features/demo/`)
- `app/` with only route files ✅ (no non-route files)
- `components/ui/` for shared primitives ✅ (32 primitive components)
- `shared/` for pure logic ⚠️ (`shared/utils.ts` is clean; `shared/theme/fonts.ts` has Expo imports)
- No `src/` directory ✅

**Domains found:** `demo`
**Missing domains:** No real app domains yet (starter kit state — expected). When building out, expect `auth`, `pack-members`, or similar based on the app name "wolfpack".

### Screen Thickness

| Screen | Lines | Status |
|--------|-------|--------|
| `app/_layout.tsx` | 225 | ❌ >100 (contains UI components + custom hook) |
| `app/index.tsx` | 147 | ❌ >100 (defines 4 layout components inline) |
| `app/components/[slug].tsx` | 40 | ✅ ≤50 |
| `app/+not-found.tsx` | 14 | ✅ ≤50 |
| `app/+html.tsx` | 45 | ✅ ≤50 (web-only HTML shell, acceptable) |

**Thickest screen:** `app/_layout.tsx` at 225 lines
**Recommendation:** Extract `ThemeSelector`, `CustomHeader` to `features/demo/components/` (or `features/shell/components/`). Extract `useAppFonts` to `hooks/use-app-fonts.ts`. The layout should only set up the provider chain and Drawer navigator configuration.

For `app/index.tsx`: move `TopBar`, `LeftColumn`, `MiddleColumn`, `RightColumn` to `features/demo/components/`. The screen should import a single `<HomeLayout />` or equivalent from the feature.

### Import Boundaries

| Violation Type | Count | Files |
|---------------|-------|-------|
| `api.*` in screens | 0 | — |
| Cross-feature imports | 0 | — |
| Convex in `components/ui/` | 0 | — |
| React in `shared/` | 0 | — |
| Expo packages in `shared/` | 1 | `shared/theme/fonts.ts` |
| Providers outside `_layout` | 0 | — |
| `features/` in `components/ui/` | 0 | — |

The main boundary respect is strong — no Convex leaking into screens, no cross-feature imports, no React in shared. The single issue is `shared/theme/fonts.ts` importing Expo packages.

Note: `features/demo/components/drawer-content.tsx` imports from `@/features/demo/registry` — this is an import within the same feature (`features/demo` importing `features/demo`), so it is NOT a cross-feature violation. It's correct intra-feature usage.

### Feature-Route Alignment

| Feature | Routes | Status |
|---------|--------|--------|
| `features/demo/` | `app/index.tsx`, `app/components/[slug].tsx` | ✅ Aligned |

The single feature maps cleanly to the two routes. No orphan routes or orphan features.

### Expo Router Structure

- Route groups with `_layout.tsx`: none (all routes are at root level — appropriate for this app's drawer navigation)
- Route groups MISSING `_layout.tsx`: none (no route groups exist)
- Non-route files in `app/`: none ✅
- Provider chain location: `app/_layout.tsx` ✅

The app uses a flat drawer navigation model rather than nested route groups, which is valid. The absence of `(tabs)/` or `(auth)/` groups is appropriate for the current scope.

### Platform Code

| Platform File | Base File Exists | Status |
|--------------|-----------------|--------|
| `hooks/use-color-scheme.web.ts` | `hooks/use-color-scheme.ts` ✅ | ✅ |

Platform-specific files are correctly co-located with their base files. No orphaned platform files found.

### Backend Structure (Convex)

- Domain directories in `convex/`: none (only `_generated/`)
- Schema composition in `schema.ts`: ❌ No `schema.ts` exists
- Helper pattern used: ❌ No functions written yet
- Frontend-backend domain alignment: N/A (backend is empty)

The Convex integration is wired up at the infrastructure level (`ConvexProvider` in `_layout.tsx` via `MaybeConvex`) but no backend functions have been written. This is fine for a starter kit — when backend development begins, the domain-folder structure from the CLAUDE.md and screaming architecture patterns should be followed.

---

## Recommended Actions

1. **[HIGH]** Extract `TopBar`, `LeftColumn`, `MiddleColumn`, `RightColumn` from `app/index.tsx` into `features/demo/components/`. Reduce the screen to ~15 lines.

2. **[HIGH]** Extract `ThemeSelector` and `CustomHeader` from `app/_layout.tsx` to `features/demo/components/` (or a new `features/shell/components/` directory). Extract `useAppFonts` to `hooks/use-app-fonts.ts`. Target: layout file under 60 lines.

3. **[MED]** Move `shared/theme/fonts.ts` out of `shared/` to `constants/fonts.ts` or `hooks/fonts.ts` since it imports Expo packages. Keep `shared/` pure TypeScript.

4. **[MED]** Create `features/demo/types.ts` and consolidate exported types (`AtomicLevel`, `AtomicClassification`, `RegistryEntry`) from `atomic-classification.ts` and `registry.ts`.

5. **[MED]** Remove or wire up `features/demo/atomic-classification.ts` — it is currently dead code (no imports).

6. **[LOW]** Add `eslint-plugin-boundaries` to enforce import layer rules programmatically. This prevents future violations as the app grows.

7. **[LOW]** When writing first Convex functions, create `convex/schema.ts` and `convex/{domain}/` subdirectories per the vertical-slice backend pattern.

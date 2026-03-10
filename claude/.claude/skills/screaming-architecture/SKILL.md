---
name: screaming-architecture
description: "Enforce screaming architecture (feature-folder vertical slices) in Expo React Native + Convex full-stack apps, web React projects, or any codebase where features should own their domain. Use this skill whenever the user asks about project structure, feature organization, architecture audits, folder structure review, adding a new feature/domain, code review for boundary violations, or mentions 'screaming architecture', 'vertical slices', 'feature folders', or 'thin screens'. Also trigger when the user wants to reorganize an existing codebase, check import boundaries, or scaffold a new feature domain. Even if the user just says 'audit' or 'review the structure' in a project with app/ or features/ directories, this skill applies."
---

# Screaming Architecture

Your codebase should **scream** its domain — when someone opens the project, they immediately see `features/workouts/`, `features/pack-members/`, `features/auth/` and know what the app does. Not `components/`, `hooks/`, `utils/` at the top level hiding the business behind technical categories.

## Core Principle

Every feature is a **vertical slice** — it owns its UI components, hooks, types, and utilities. Screens in `app/` (Expo) or `pages/` (web) are thin wrappers that compose feature content. The backend (Convex) mirrors the same domain structure.

## Project Type Detection

Before doing anything, detect the project type:

| Signal | Type | Read |
|--------|------|------|
| `app.json` or `app.config.ts` with `"expo"` key | **Expo React Native** | `references/expo-patterns.md` |
| `src/` directory, no expo config | **Web React** | `references/structure-rules.md` (Web section) |
| `convex/` directory present | **+ Convex backend** | `references/convex-patterns.md` |

Read the relevant reference files for the detected project type before proceeding. For Expo+Convex projects, read both `expo-patterns.md` and `convex-patterns.md`.

## Three Operating Modes

### 1. Audit Mode

Triggered by: "audit", "review structure", "check architecture", "how's my codebase organized"

**Run the automated scanner first:**
```bash
bash ~/.claude/skills/screaming-architecture/scripts/analyze_structure.sh [project-root]
```

The script outputs JSON with findings. Then read `references/audit-report-template.md` and produce a human-readable report covering:

- **Directory structure** — does it scream the domain?
- **Screen thickness** — are screens thin routing wrappers or fat with logic?
- **Import boundaries** — are layers importing only from allowed dependencies?
- **Feature-route alignment** — does every feature have corresponding routes?
- **Backend alignment** — do Convex domains match frontend features?

Present findings with severity (violation / warning / note) and concrete fix suggestions.

### 2. Active Development Mode

Triggered by: "add feature", "create domain", "scaffold", "new feature", building any new feature

Guide the user through creating a full vertical slice. The order matters — build bottom-up:

**For Expo + Convex:**
1. **Convex schema** → `convex/{domain}/schema.ts` — define table with validators and indexes
2. **Convex helpers** → `convex/{domain}/helpers.ts` — pure logic with `QueryCtx`/`MutationCtx`
3. **Convex API** → `convex/{domain}/queries.ts`, `mutations.ts` — thin public functions calling helpers
4. **Feature hooks** → `features/{domain}/hooks/` — wrap `useQuery(api.*)` / `useMutation(api.*)`
5. **Feature components** → `features/{domain}/components/` — UI using hooks
6. **Feature types** → `features/{domain}/types.ts` — domain-specific types
7. **Screens** → `app/` routes — thin wrappers composing feature components

At each step, enforce the import boundary rules from `references/structure-rules.md`.

### 3. Code Review Mode

Triggered by: reviewing PRs, "review this", checking someone's code

Watch for these violations (ordered by severity):

1. **Business logic in `app/`** — screens should be <50 lines, composing feature components
2. **Direct `api.*` imports in screens** — only `features/*/hooks/` may import from `convex/_generated`
3. **Cross-feature imports** — `features/A/` must never import from `features/B/`
4. **Provider leaks** — providers belong in `_layout.tsx` files, not screens
5. **Co-located non-route files in `app/`** — no utils, hooks, or components alongside routes
6. **Missing `_layout.tsx`** — every route group `(groupName)/` needs a layout
7. **Convex logic in feature components** — `useQuery`/`useMutation` belong in hooks, not components

For each violation, explain WHY it's a problem (not just that it breaks a rule) and show the fix.

## Import Boundary Rules (Quick Reference)

For Expo React Native projects:

```
app/ screens     → features/, components/ui/, hooks/, shared/
features/{domain} → components/ui/, shared/, own submodules ONLY
components/ui/   → shared/ ONLY
hooks/           → shared/ ONLY
shared/          → NO external imports (pure TS — no React, no Convex)
```

Cross-feature imports are the most common violation. If two features need shared logic, it belongs in `shared/` or a new shared feature.

For ESLint enforcement rules, read `references/eslint-rules.md`.

## Key Anti-Patterns

| Anti-Pattern | Why It's Bad | Fix |
|---|---|---|
| Fat screen (>50 lines) | Business logic mixed with routing | Extract to `features/{domain}/components/` |
| `useQuery(api.*)` in screen | Screen coupled to backend | Move to `features/{domain}/hooks/` |
| `features/A` imports `features/B` | Hidden coupling between domains | Extract shared logic to `shared/` |
| Components in `app/` directory | Navigation tree polluted with UI | Move to `features/{domain}/components/` |
| `src/` in Expo project | Fights Expo Router conventions | Use root-level `features/`, `components/`, etc. |
| Providers in screen files | Provider scope too narrow, re-mounts | Move to nearest `_layout.tsx` |
| Platform file without base | `.web.tsx` exists but no `.tsx` base | Create base file or rename |

## Reference Files

Read these as needed based on project type and mode:

- `references/structure-rules.md` — Complete import dependency rules for both Web React and Expo RN
- `references/expo-patterns.md` — Canonical Expo RN structure, code examples, feature-to-route mapping
- `references/convex-patterns.md` — Convex vertical slice examples (schema → helper → API → hook)
- `references/eslint-rules.md` — ESLint flat config rules to enforce boundaries programmatically
- `references/audit-report-template.md` — Template for audit report output

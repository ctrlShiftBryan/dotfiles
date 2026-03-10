# Structure Rules — Import Boundaries

This document defines the allowed import directions for screaming architecture projects. The core idea: dependencies flow inward (toward pure logic), never sideways between features.

## Expo React Native Projects

Root-level directory structure (no `src/`):

```
app/          → Routing shell — composes features
features/     → Business domains — the heart of the app
components/   → Shared UI primitives
hooks/        → Global hooks
shared/       → Pure TypeScript logic
convex/       → Backend
```

### Import Dependency Graph

```
app/ screens
  ├── features/{any}/components/
  ├── features/{any}/hooks/       (only if screen needs to pass data between features)
  ├── components/ui/
  ├── hooks/
  └── shared/

features/{domain}/
  ├── own submodules (components/, hooks/, utils/)
  ├── components/ui/
  ├── shared/
  └── convex/_generated/          (ONLY in features/*/hooks/)

components/ui/
  └── shared/

hooks/
  └── shared/

shared/
  └── (nothing — pure TS, no React, no RN, no Convex)
```

### Forbidden Imports (Expo)

| From | Cannot Import | Why |
|------|--------------|-----|
| `app/` screens | `convex/_generated/api` | Screens must not know about the backend directly |
| `app/` screens | `features/*/hooks/use*.ts` with Convex calls | Acceptable only for passing data between features |
| `features/A/` | `features/B/` | Features are independent domains |
| `components/ui/` | `features/` | UI primitives can't depend on business logic |
| `components/ui/` | `convex/` | UI primitives can't depend on backend |
| `shared/` | `react`, `react-native` | Shared must be pure TS |
| `shared/` | `convex/*` | Shared must be pure TS |

### Convex Boundary Rule

The Convex boundary is the most important rule: `useQuery(api.*)` and `useMutation(api.*)` calls may ONLY appear in `features/*/hooks/`. This creates a single translation layer between backend and frontend.

Why this matters:
- **Testability** — mock one hook to test a component without a real backend
- **Refactorability** — change the Convex API shape without touching UI
- **Discoverability** — all data access for a domain is in one place

The ONE exception: `app/_layout.tsx` may import from `convex/react` to set up `ConvexProvider`. This is infrastructure, not data access.

### Feature Internal Structure

Within a feature, organize by technical role:

```
features/{domain}/
  components/        # React Native components for this domain
    {domain}-card.tsx
    {domain}-form.tsx
    {domain}-list.tsx
  hooks/             # Data access — ONLY place for api.* imports
    use-{domain}s.ts
    use-{domain}.ts
    use-create-{domain}.ts
    use-update-{domain}.ts
  utils/             # Pure helper functions for this domain
    format-{domain}.ts
    validate-{domain}.ts
  types.ts           # Domain-specific TypeScript types
  index.ts           # Optional barrel export
```

Components import hooks from the same feature. Hooks import from `convex/_generated`. Utils are pure functions. Types are shared across the feature.

## Web React Projects

`src/`-based directory structure:

```
src/
  pages/        → Route components (thin, like Expo screens)
  features/     → Business domains
  components/   → Shared UI
  hooks/        → Global hooks
  lib/          → Pure utilities
  types/        → Shared types
```

### Import Dependency Graph (Web)

```
src/pages/
  ├── src/features/{any}/
  ├── src/components/
  ├── src/hooks/
  └── src/lib/

src/features/{domain}/
  ├── own submodules
  ├── src/components/
  ├── src/lib/
  └── API clients (ONLY in features/*/hooks/ or features/*/api/)

src/components/
  └── src/lib/

src/hooks/
  └── src/lib/

src/lib/
  └── (nothing — pure TS)
```

Same principles apply — features are independent, pages are thin, shared code flows inward.

## Convex Backend Projects

Mirror the frontend domain structure:

```
convex/
  _generated/           # Auto-generated (don't touch)
  schema.ts             # Composes all domain schemas
  {domain}/
    schema.ts           # defineTable for this domain
    queries.ts          # Public query functions
    mutations.ts        # Public mutation functions
    actions.ts          # External API calls (if needed)
    helpers.ts          # Pure logic with QueryCtx/MutationCtx
    internal.ts         # Internal functions (if needed)
```

### Convex Import Rules

```
convex/{domain}/queries.ts, mutations.ts
  ├── own helpers.ts
  ├── convex/_generated/server
  └── convex/values

convex/{domain}/helpers.ts
  ├── convex/_generated/server (types only)
  ├── convex/_generated/dataModel (types only)
  └── other domain helpers (for cross-domain reads)

convex/schema.ts
  └── convex/{domain}/schema.ts (imports all domain schemas)
```

Cross-domain helper calls are allowed in the backend (unlike the frontend) because the backend is a single deployment. But keep them to reads — one domain should not mutate another domain's tables directly.

## Detecting Violations

### Quick grep commands

```bash
# api.* imports outside features/*/hooks/
grep -rn "from.*convex/_generated/api" app/ components/ shared/

# Cross-feature imports
grep -rn "from.*@/features/" features/ | grep -v "from.*@/features/$(basename $PWD)"

# React/RN imports in shared/
grep -rn "from ['\"]react" shared/
grep -rn "from ['\"]react-native" shared/

# Providers outside _layout.tsx
grep -rn "<.*Provider" app/ --include="*.tsx" | grep -v "_layout"

# Non-route files in app/ (should only have route files and _layout)
find app/ -name "*.ts" ! -name "*.tsx" ! -name "_layout.*" ! -name "+*"
```

### Automated analysis

Use the bundled script for comprehensive scanning:
```bash
bash ~/.claude/skills/screaming-architecture/scripts/analyze_structure.sh
```

# Audit Report Template

Use this structure when producing an architecture audit. Fill in each section based on the analyze_structure.sh output and manual inspection.

---

## Template

```markdown
# Architecture Audit: {project-name}
**Date:** {date}
**Project Type:** {Expo React Native | Web React} {+ Convex}

## Summary

{1-2 sentence overview: is the architecture healthy, partially there, or needs significant work?}

**Score: {X}/10**

| Category | Status |
|----------|--------|
| Directory Structure | {✅ Good / ⚠️ Needs Work / ❌ Violations} |
| Screen Thickness | {✅ / ⚠️ / ❌} |
| Import Boundaries | {✅ / ⚠️ / ❌} |
| Feature-Route Alignment | {✅ / ⚠️ / ❌} |
| Backend Structure | {✅ / ⚠️ / ❌} (if Convex) |
| Platform Code | {✅ / ⚠️ / ❌} (if Expo) |

## Findings

### 🔴 Violations (must fix)

{List each violation with:}
- **What:** {description}
- **Where:** `{file path}`
- **Fix:** {concrete action}

### 🟡 Warnings (should fix)

{Same format}

### 🟢 Notes (nice to have)

{Same format}

---

## Detailed Sections

### Directory Structure

Does the project scream its domain? List top-level directories and whether they follow the pattern.

**Expected (Expo):**
- `features/` with domain subdirectories ✅/❌
- `app/` with only route files ✅/❌
- `components/ui/` for shared primitives ✅/❌
- `shared/` for pure logic ✅/❌
- No `src/` directory ✅/❌

**Domains found:** {list feature directories}
**Missing domains:** {any obvious features without their own directory}

### Screen Thickness (Expo / Pages)

| Screen | Lines | Status |
|--------|-------|--------|
| `app/(tabs)/index.tsx` | {N} | {✅ ≤50 / ⚠️ 51-100 / ❌ >100} |
| ... | ... | ... |

**Thickest screen:** `{path}` at {N} lines
**Recommendation:** {if any are thick, explain what to extract}

### Import Boundaries

| Violation Type | Count | Files |
|---------------|-------|-------|
| api.* in screens | {N} | {list} |
| Cross-feature imports | {N} | {list} |
| Convex in components/ui | {N} | {list} |
| React in shared/ | {N} | {list} |
| Providers outside _layout | {N} | {list} |

### Feature-Route Alignment

| Feature | Routes | Status |
|---------|--------|--------|
| `features/workouts/` | `app/(tabs)/workouts.tsx`, `app/workouts/[id].tsx` | ✅ Aligned |
| `features/auth/` | `app/(auth)/login.tsx` | ✅ Aligned |
| `features/orphan/` | (none) | ❌ No routes |
| (none) | `app/random-page.tsx` | ❌ No feature |

### Expo Router Structure (Expo only)

- Route groups with `_layout.tsx`: {list}
- Route groups MISSING `_layout.tsx`: {list}
- Non-route files in `app/`: {list}
- Provider chain location: `app/_layout.tsx` ✅/❌

### Platform Code (Expo only)

| Platform File | Base File Exists | Status |
|--------------|-----------------|--------|
| `hooks/use-color-scheme.web.ts` | `hooks/use-color-scheme.ts` ✅ | ✅ |
| `components/map.ios.tsx` | `components/map.tsx` ❌ | ❌ Orphaned |

### Backend Structure (Convex only)

- Domain directories in `convex/`: {list}
- Schema composition in `schema.ts`: ✅/❌
- Helper pattern used: ✅/❌
- Frontend-backend domain alignment: {which features match which convex domains}

## Recommended Actions

{Prioritized list of changes, ordered by impact:}

1. **[HIGH]** {action}
2. **[HIGH]** {action}
3. **[MED]** {action}
4. **[LOW]** {action}
```

---

## Severity Guide

- **🔴 Violation**: Breaks the architecture pattern. Business logic in wrong layer, boundary crossed. Fix before adding more features.
- **🟡 Warning**: Technically works but will cause pain at scale. Fat screens, missing layouts, inconsistent naming.
- **🟢 Note**: Opportunity for improvement. Missing optional features, could add ESLint rules, naming could be more consistent.

## Scoring Guide

- **9-10**: Exemplary. Domains are clear, boundaries are clean, screens are thin, backend mirrors frontend.
- **7-8**: Good. Minor violations or warnings. The architecture tells you what the app does.
- **5-6**: Needs work. Some domains are clear but boundaries are leaky. Fat screens exist.
- **3-4**: Significant issues. Mixed concerns, unclear domain boundaries, business logic scattered.
- **1-2**: No discernible architecture. Everything in one directory or completely mixed.

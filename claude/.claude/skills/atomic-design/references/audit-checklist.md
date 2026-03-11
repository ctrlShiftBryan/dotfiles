# Audit Checklist & Report Template

## Audit Procedure

### Step 1: Inventory Components

Find all `.tsx` files that export React components in `components/`, `src/components/`, or equivalent:

```bash
# Find all component files
find components/ -name "*.tsx" -type f 2>/dev/null
find src/components/ -name "*.tsx" -type f 2>/dev/null
```

Also check for components mixed into other locations:
```bash
# Screen components outside app/
grep -rn "export default function.*Screen" components/ features/ src/ 2>/dev/null
# Components in app/ that aren't routes
find app/ -name "*.tsx" ! -name "_layout*" ! -name "+*" | head -20
```

### Step 2: Classify Each Component

For each component, apply the decision flowchart:

1. Is it a route file? → Page
2. Layout zones without data? → Template
3. Can't break down further? → Atom
4. Composes 2-3 atoms for one purpose? → Molecule
5. Otherwise → Organism

Record: `file path | component name | current location | classified level | correct location`

### Step 3: Check Dependency Direction

Flag violations where lower-level components import higher-level ones:

```bash
# In atom files, check for imports from molecules/organisms/sections
# In molecule files, check for imports from organisms/sections
# Look for screen/page components importing from component internals
```

Key violations to catch:
- Atom importing molecule or organism
- Molecule importing organism
- Any component importing a route/page file
- `components/ui/` importing from `features/` or `app/`

### Step 4: Identify Mixed-Level Directories

Check if any single directory contains components at different atomic levels:
- `components/ui/` has both `Button.tsx` (atom) and `LoginForm.tsx` (organism) → violation
- `components/` has both `Icon.tsx` (atom) and `Header.tsx` (organism) → needs subfolder organization

### Step 5: Check for Misplaced Components

- Screen components in `components/` → should be in `app/` or `features/`
- Feature-specific organisms in shared `components/` → should be in `features/{domain}/components/`
- Layout components without clear template structure → consider `templates/` or `layouts/`

### Step 6: Produce Report

Use the template below.

---

## Report Template

```markdown
# Atomic Design Audit: {project-name}
**Date:** {date}
**Framework:** {React | React Native | Expo} {+ shadcn | + NativeWind | + shadcn-rn}
**Component count:** {N} total components audited

## Summary

{1-2 sentences: is the component organization clean, partially organized, or needs significant restructuring?}

| Category | Status |
|----------|--------|
| Atomic Classification | {OK / Needs Work / Violations} |
| Dependency Direction | {OK / Needs Work / Violations} |
| Directory Organization | {OK / Needs Work / Violations} |
| Mixed-Level Folders | {OK / Needs Work / Violations} |
| Misplaced Components | {OK / Needs Work / Violations} |

## Component Inventory

| Component | File | Current Level | Should Be | Action Needed |
|-----------|------|--------------|-----------|---------------|
| Button | components/ui/button.tsx | atom | atom | None |
| LoginForm | components/ui/login-form.tsx | atom (misplaced) | organism | Move to sections/ or features/auth/ |
| ... | ... | ... | ... | ... |

## Violations

### Dependency Direction Violations

{List each case where a lower-level imports a higher-level component}

- `components/ui/button.tsx` imports `UserCard` (organism) — atom importing organism
- ...

### Mixed-Level Directories

{List directories containing multiple atomic levels}

- `components/ui/` contains: atoms (button, input, badge), organisms (LoginForm, WelcomeScreen)
  - **Fix:** Move organisms to `components/sections/` or `features/*/components/`

### Misplaced Components

{List components in wrong locations}

- `LoginPasswordScreen` in `components/ui/` — this is a page/organism, not an atom
- ...

## Recommended Restructure

{Show the proposed directory structure with components moved to correct locations}

### Before
{current structure}

### After
{proposed structure}

## Priority Actions

1. **[HIGH]** {most impactful fix}
2. **[HIGH]** {second most impactful}
3. **[MED]** {medium priority}
4. **[LOW]** {nice to have}
```

---

## Severity Guide

- **Violation**: Wrong atomic level, dependency direction broken, screen in atoms folder. Fix before it spreads.
- **Warning**: Flat folder could use organization, component near the boundary of two levels. Fix when convenient.
- **Note**: Naming inconsistency, missing barrel export, could benefit from atomic organization but functional as-is.

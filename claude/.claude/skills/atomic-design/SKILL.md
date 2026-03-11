---
name: atomic-design
description: "Organize UI components using atomic design (atoms/molecules/organisms/templates/pages). Use when building component libraries, auditing component structure, scaffolding component folders, deciding where a new component belongs, or reorganizing an existing components/ directory. Also triggers for 'component hierarchy', 'design system organization', 'component classification', or when components are mixed together in flat folders."
---

# Atomic Design

Classify and organize UI components into a 5-level hierarchy: atoms → molecules → organisms → templates → pages. Dependencies flow UP only — atoms never import molecules.

## The 5 Levels

| Level | What it is | Heuristic | Examples |
|-------|-----------|-----------|----------|
| Atom | Single-responsibility UI primitive. No component children. | "Can I break this down further?" — if no, atom. | Button, Input, Badge, Icon, Text, Avatar, Separator |
| Molecule | 2-3 atoms composed for one purpose. | "Does this combine atoms into one reusable unit?" | SearchBar (Input+Button), FormField (Label+Input+Error), NavItem (Icon+Text) |
| Organism | Distinct UI section with its own identity. May contain molecules+atoms. | "Is this a recognizable section of a page?" | Header, Sidebar, LoginForm, ProductCard, CommentThread |
| Template | Page-level layout defining content zones without real data. | "Does this define WHERE things go but not WHAT?" | DashboardLayout, AuthLayout, SettingsLayout |
| Page | Template + real data, connected to routing. In Expo/Next these ARE route files. | Route file in `app/` directory | `app/(tabs)/home.tsx`, `app/settings.tsx` |

### Key Rules

- **Dependencies flow UP only.** Atoms never import molecules. Molecules never import organisms.
- **Pages = route files.** They already exist in `app/` — don't duplicate in a `pages/` component folder.
- **Templates = layout components**, not routes. They live in `components/templates/` or `layouts/`.
- **When in doubt** between molecule/organism: if it could appear on multiple pages, lean molecule. If it's a self-contained page section, lean organism.

## Decision Flowchart

```
Is it a route file? → Yes → PAGE (lives in app/)
                      No ↓
Does it define layout zones without data? → Yes → TEMPLATE
                                            No ↓
Can you break it into smaller components? → No → ATOM
                                            Yes ↓
Does it compose 2-3 atoms for one purpose? → Yes → MOLECULE
                                              No → ORGANISM
```

## Three Modes

### 1. Audit Mode

Triggered by: "audit components", "review component structure", "organize my components"

Read `references/audit-checklist.md` then:

1. Inventory all component files (`.tsx` exporting React components)
2. Classify each using the decision flowchart
3. Check dependency direction — flag atoms importing molecules/organisms
4. Identify mixed-level directories (Button and LoginForm in same folder)
5. Check for screen components in `components/` (they're pages or organisms, not atoms)
6. Output structured report with violations, warnings, and recommendations

### 2. Scaffold Mode

Triggered by: "set up atomic design", "scaffold component structure", "organize components into atomic"

Read `references/scaffolding.md` then:

1. Detect framework (React/RN/Expo) and UI library (shadcn/NativeWind/none)
2. Create appropriate folder structure
3. Optionally move existing components to correct locations
4. Set up barrel exports if project uses them

### 3. Guide Mode

Triggered by: "where should I put this component?", "is this an atom or molecule?", building a new component

Apply the decision flowchart to classify, then:
- Name the level and explain why
- Give the exact file path where it should live
- List what it should import (and what should NOT import it)

Read `references/classification.md` for edge cases if the component is ambiguous.

## Framework Detection & Integration

Before any mode, detect the project setup:

| Signal | Integration |
|--------|------------|
| `components/ui/` with shadcn primitives | `components/ui/` IS atoms. Don't rename. Molecules → `components/composed/`. Organisms → `components/sections/`. |
| No UI library | Use `atoms/` `molecules/` `organisms/` naming under `components/`. |
| `features/` directories exist | Atomic hierarchy applies ONLY to shared components. Feature-specific components stay in their feature folder. |
| Expo Router (`app/` directory) | `app/` routes are pages. Templates = layout components used by `_layout.tsx`. |
| Next.js (`app/` or `pages/`) | Same as Expo — route files are pages. |

### Feature Folders + Atomic Design

When the project uses screaming architecture (feature folders):

```
components/          # SHARED components organized atomically
  ui/                # Atoms (or shadcn primitives)
  composed/          # Molecules
  sections/          # Organisms
  templates/         # Templates/layouts

features/
  auth/
    components/      # Feature-specific — NOT organized atomically
      login-form.tsx # This is an organism but lives in its feature
      ...
```

**Rule:** Only `components/` (shared) gets the atomic hierarchy. Feature-specific components stay in their feature. If a feature component gets reused across 2+ features, promote it to the shared atomic structure.

## Dependency Direction

```
Page → Template → Organism → Molecule → Atom
  ↓         ↓          ↓          ↓
  └─────────┴──────────┴──────────┴── shared/ (pure logic)
```

Allowed imports per level:
- **Atom** → shared utilities, styling, external UI lib primitives
- **Molecule** → atoms, shared utilities
- **Organism** → molecules, atoms, shared utilities, hooks
- **Template** → organisms, molecules, atoms (defines slots/zones)
- **Page** → templates, organisms, features, hooks, data fetching

## Common Anti-Patterns

| Anti-Pattern | Why It's Bad | Fix |
|---|---|---|
| Screen component in `components/ui/` | Atom folder has a page/organism | Move to `app/` (page) or `components/sections/` (organism) |
| Button importing UserCard | Atom depends on organism | Remove dependency; pass data via props |
| Flat `components/` with 50+ files | No hierarchy, can't find anything | Classify and organize into atomic levels |
| Duplicating route files as "pages" folder | Pages already exist in `app/` | Delete the `pages/` component folder, use `app/` routes |
| Every component in `atoms/` | No real classification applied | Re-classify using decision flowchart |
| Organism doing data fetching | Couples UI to backend | Extract data fetching to hooks, pass data as props |

## Reference Files

Read these as needed:

- `references/classification.md` — Edge cases and detailed classification examples
- `references/audit-checklist.md` — Full audit procedure and report template
- `references/scaffolding.md` — Folder templates per framework (React, RN, Expo, + shadcn/NativeWind)

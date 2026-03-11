# Scaffolding Templates

Folder structures for each framework + UI library combination. Pick the one that matches the detected project.

## Detection Checklist

| Check | How to detect |
|-------|--------------|
| Expo | `app.json` or `app.config.ts` with `"expo"` key |
| Next.js | `next.config.*` file |
| Plain React | `src/` directory, no expo/next config |
| shadcn/ui | `components/ui/button.tsx` with `@/lib/utils` import pattern |
| shadcn-rn | `components/ui/` with React Native primitives + `~/lib/utils` |
| NativeWind | `nativewind` in dependencies, `className` props on RN components |
| Feature folders | `features/` directory exists |

---

## Expo + NativeWind (no shadcn)

```
components/
  atoms/
    button.tsx
    input.tsx
    text.tsx
    icon.tsx
    avatar.tsx
    badge.tsx
    separator.tsx
    index.ts              # barrel export
  molecules/
    search-bar.tsx
    form-field.tsx
    nav-item.tsx
    index.ts
  organisms/
    header.tsx
    sidebar.tsx
    login-form.tsx
    index.ts
  templates/
    auth-layout.tsx
    dashboard-layout.tsx
    index.ts

app/                      # Pages (routes) — untouched
  (tabs)/
    index.tsx
    ...
  _layout.tsx
```

## Expo + shadcn-rn (or rn-primitives)

shadcn-rn already uses `components/ui/` for primitives. Don't fight it.

```
components/
  ui/                     # ATOMS — shadcn primitives (don't rename)
    button.tsx
    input.tsx
    card.tsx
    badge.tsx
    ...
  composed/               # MOLECULES — compositions of ui/ atoms
    search-bar.tsx
    form-field.tsx
    labeled-value.tsx
    index.ts
  sections/               # ORGANISMS — page sections
    header.tsx
    player-card.tsx
    stats-grid.tsx
    index.ts
  templates/              # TEMPLATES — layout shells
    auth-layout.tsx
    dashboard-layout.tsx
    index.ts

app/                      # Pages — untouched
```

## React + shadcn/ui (web)

Same approach — respect shadcn's `components/ui/`.

```
src/
  components/
    ui/                   # ATOMS — shadcn primitives
      button.tsx
      input.tsx
      card.tsx
      ...
    composed/             # MOLECULES
      search-bar.tsx
      form-field.tsx
      data-cell.tsx
      index.ts
    sections/             # ORGANISMS
      header.tsx
      sidebar.tsx
      data-table.tsx
      index.ts
    templates/            # TEMPLATES
      dashboard-layout.tsx
      auth-layout.tsx
      index.ts

  app/ or pages/          # Pages — untouched
```

## React without shadcn (web)

```
src/
  components/
    atoms/
      button.tsx
      input.tsx
      icon.tsx
      index.ts
    molecules/
      search-bar.tsx
      form-field.tsx
      index.ts
    organisms/
      header.tsx
      sidebar.tsx
      index.ts
    templates/
      dashboard-layout.tsx
      auth-layout.tsx
      index.ts

  pages/ or app/          # Pages — untouched
```

## With Feature Folders (any framework)

When `features/` exists, the atomic hierarchy applies ONLY to shared `components/`. Feature components stay in their feature.

```
components/               # SHARED only — organized atomically
  ui/ (or atoms/)
  composed/ (or molecules/)
  sections/ (or organisms/)
  templates/

features/
  auth/
    components/           # Feature-specific — NOT atomic organized
      login-form.tsx      # (this is an organism, but lives in feature)
      signup-form.tsx
    hooks/
    types.ts
  dashboard/
    components/
      stats-widget.tsx
      activity-feed.tsx
    hooks/
    types.ts
```

**Promotion rule:** If a feature component is used by 2+ features, move it to shared `components/` at the correct atomic level.

---

## Migration Strategy

When reorganizing existing flat `components/` into atomic structure:

### 1. Classify first, move second

Don't move files until you've classified every component. Use the audit report as your guide.

### 2. Create target directories

```bash
mkdir -p components/{atoms,molecules,organisms,templates}
# or for shadcn projects:
mkdir -p components/{composed,sections,templates}
```

### 3. Move files one level at a time

Start with atoms (most stable, fewest dependencies), then molecules, then organisms.

### 4. Update imports

After each batch of moves, update all import paths. Use your editor's rename/refactor or:

```bash
# Find all imports of a moved file
grep -rn "from.*components/old-path" --include="*.tsx" --include="*.ts"
```

### 5. Add barrel exports (optional)

```ts
// components/atoms/index.ts
export { Button } from './button';
export { Input } from './input';
export { Icon } from './icon';
```

Only add barrels if the project already uses them. Don't introduce barrel exports to a project that imports directly.

### 6. Verify

After migration:
- Run the build / type checker
- Run existing tests
- Check no circular dependencies introduced
- Verify dependency direction (atoms don't import molecules)

---

## Naming Conventions

| Convention | When to use |
|-----------|-------------|
| `atoms/` `molecules/` `organisms/` | No UI library, or NativeWind without shadcn |
| `ui/` `composed/` `sections/` | shadcn/ui or shadcn-rn present |
| `templates/` | Always — same name regardless |

File naming follows project convention (kebab-case typical for shadcn, PascalCase for some React projects). Match what's already in the codebase.

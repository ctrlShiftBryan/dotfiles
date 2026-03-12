---
name: dn3-add-component
description: "Scaffold a new component in dynasty-nerds-three with all required files: component, barrel export, story, stories index entry, and registry.json entry. Use when adding a new atom, molecule, or organism. Triggers on 'add component', 'create component', 'new atom', 'new molecule', 'new organism', 'scaffold component', or 'add a [level] called [name]'. Does NOT trigger for auditing, classifying, or reorganizing components (that's atomic-design)."
---

# Add Component to Dynasty Nerds Three

Scaffold a complete component with all required touch points in the dynasty-nerds-three project.

## Prerequisites

This skill requires two inputs:

1. **Component name** — e.g., "badge", "player card", "draft board"
2. **Atomic level** — atom, molecule, or organism

If the user doesn't specify the level, ask. If unsure, use the atomic-design skill's decision flowchart to classify first.

## Before Creating

Read these files from the project to understand current state and patterns:

1. `registry.json` — dependency format, existing entries
2. `app/stories/index.tsx` — current story categories
3. The barrel `index.ts` for the target level:
   - Atom: `components/atoms/index.ts`
   - Molecule: `components/molecules/index.ts`
   - Organism: `components/organisms/index.ts`
4. An existing component at the same level as a pattern reference:
   - Atom example: `components/atoms/team-position-pill.tsx`
   - Molecule example: `components/molecules/card/card.tsx` + `components/molecules/card/index.ts`
   - Organism example: `components/organisms/auth-screen-container/AuthScreenContainer.tsx` + `components/organisms/auth-screen-container/index.ts`

## Naming Conventions

| Item                          | Convention            | Example                       |
| ----------------------------- | --------------------- | ----------------------------- |
| Directory name                | kebab-case            | `player-card/`                |
| Atom file                     | kebab-case            | `components/atoms/badge.tsx`  |
| Molecule/Organism main file   | PascalCase            | `PlayerCard.tsx`              |
| Molecule/Organism types file  | PascalCase + `.types` | `PlayerCard.types.ts`         |
| Barrel export                 | `index.ts`            | `index.ts`                    |
| Story file                    | kebab-case            | `app/stories/atoms/badge.tsx` |
| Story route href              | kebab-case            | `/stories/atoms/badge`        |
| Display name in stories index | Title Case            | `Badge`                       |
| Registry name                 | kebab-case            | `badge`                       |

## Files to Create Per Level

### Atom (flat file)

**1. Component file** — `components/atoms/{kebab-name}.tsx`

```tsx
import { cn } from '@/lib/utils';
import { View, type ViewProps } from 'react-native';

type {PascalName}Props = {
  className?: string;
};

function {PascalName}({ className }: {PascalName}Props) {
  return (
    <View className={cn('', className)}>
      {/* TODO: implement */}
    </View>
  );
}

export { {PascalName} };
export type { {PascalName}Props };
```

**2. Barrel export** — append to `components/atoms/index.ts`

```ts
export { {PascalName} } from './{kebab-name}';
export type { {PascalName}Props } from './{kebab-name}';
```

**3. Story** — `app/stories/atoms/{kebab-name}.tsx`

```tsx
import { StorySection } from '../_components/StorySection';
import { {PascalName} } from '@/components/atoms/{kebab-name}';
import { ScrollView } from 'react-native';

export default function {PascalName}Story() {
  return (
    <ScrollView contentContainerClassName="gap-6 p-4">
      <StorySection title="Default">
        <{PascalName} />
      </StorySection>
    </ScrollView>
  );
}
```

**4. Stories index** — add entry to the `Atoms` category in `app/stories/index.tsx`

```ts
{ name: '{Title Case Name}', href: '/stories/atoms/{kebab-name}' as const },
```

Keep entries alphabetically sorted within the category.

**5. Registry** — add entry to `items` array in `registry.json`

```json
{
  "name": "{kebab-name}",
  "type": "registry:ui",
  "atomicLevel": "atom",
  "registryDependencies": ["http://localhost:3999/r/dn-utils.json"],
  "files": [
    { "path": "components/atoms/{kebab-name}.tsx", "type": "registry:ui" }
  ]
}
```

---

### Molecule (folder)

**1. Component file** — `components/molecules/{kebab-name}/{PascalName}.tsx`

```tsx
import { cn } from '@/lib/utils';
import { View, type ViewProps } from 'react-native';

type {PascalName}Props = {
  className?: string;
};

function {PascalName}({ className }: {PascalName}Props) {
  return (
    <View className={cn('', className)}>
      {/* TODO: implement */}
    </View>
  );
}

export { {PascalName} };
export type { {PascalName}Props };
```

**2. Folder barrel** — `components/molecules/{kebab-name}/index.ts`

```ts
export { {PascalName} } from './{PascalName}';
export type { {PascalName}Props } from './{PascalName}';
```

**3. Level barrel** — append to `components/molecules/index.ts`

```ts
export { {PascalName} } from './{kebab-name}';
export type { {PascalName}Props } from './{kebab-name}';
```

**4. Story** — `app/stories/molecules/{kebab-name}.tsx`

```tsx
import { StorySection } from '../_components/StorySection';
import { {PascalName} } from '@/components/molecules/{kebab-name}';
import { ScrollView } from 'react-native';

export default function {PascalName}Story() {
  return (
    <ScrollView contentContainerClassName="gap-6 p-4">
      <StorySection title="Default">
        <{PascalName} />
      </StorySection>
    </ScrollView>
  );
}
```

**5. Stories index** — add entry to the `Molecules` category in `app/stories/index.tsx`

```ts
{ name: '{Title Case Name}', href: '/stories/molecules/{kebab-name}' as const },
```

**6. Registry** — add entry to `items` array in `registry.json`

```json
{
  "name": "{kebab-name}",
  "type": "registry:ui",
  "atomicLevel": "molecule",
  "registryDependencies": ["http://localhost:3999/r/dn-utils.json"],
  "files": [
    {
      "path": "components/molecules/{kebab-name}/{PascalName}.tsx",
      "type": "registry:ui"
    },
    {
      "path": "components/molecules/{kebab-name}/index.ts",
      "type": "registry:ui"
    }
  ]
}
```

---

### Organism (folder + types)

**1. Component file** — `components/organisms/{kebab-name}/{PascalName}.tsx`

```tsx
import { cn } from '@/lib/utils';
import { View, type ViewProps } from 'react-native';

type {PascalName}Props = {
  className?: string;
};

function {PascalName}({ className }: {PascalName}Props) {
  return (
    <View className={cn('', className)}>
      {/* TODO: implement */}
    </View>
  );
}

export { {PascalName} };
export type { {PascalName}Props };
```

**2. Types file (if needed)** — `components/organisms/{kebab-name}/{PascalName}.types.ts`

Only create if the component has complex shared types. Simple props stay in the component file.

**3. Folder barrel** — `components/organisms/{kebab-name}/index.ts`

```ts
export { {PascalName} } from './{PascalName}';
export type { {PascalName}Props } from './{PascalName}';
```

**4. Level barrel** — append to `components/organisms/index.ts`

```ts
export { {PascalName} } from './{kebab-name}';
export type { {PascalName}Props } from './{kebab-name}';
```

**5. Story** — `app/stories/organisms/{kebab-name}.tsx`

```tsx
import { StorySection } from '../_components/StorySection';
import { {PascalName} } from '@/components/organisms/{kebab-name}';
import { ScrollView } from 'react-native';

export default function {PascalName}Story() {
  return (
    <ScrollView contentContainerClassName="gap-6 p-4">
      <StorySection title="Default">
        <{PascalName} />
      </StorySection>
    </ScrollView>
  );
}
```

**6. Stories index** — add entry to the `Organisms` category in `app/stories/index.tsx`

```ts
{ name: '{Title Case Name}', href: '/stories/organisms/{kebab-name}' as const },
```

**7. Registry** — add entry to `items` array in `registry.json`

```json
{
  "name": "{kebab-name}",
  "type": "registry:ui",
  "atomicLevel": "organism",
  "registryDependencies": ["http://localhost:3999/r/dn-utils.json"],
  "files": [
    {
      "path": "components/organisms/{kebab-name}/{PascalName}.tsx",
      "type": "registry:ui"
    },
    {
      "path": "components/organisms/{kebab-name}/index.ts",
      "type": "registry:ui"
    }
  ]
}
```

---

## Optional: Static Data File

When the component needs static reference data (e.g., NFL teams, positions, scoring categories):

**1. Data file** — `lib/data/{kebab-name}.json`

**2. Registry entry** — add a SEPARATE registry entry for the data:

```json
{
  "name": "{kebab-name}-data",
  "type": "registry:lib",
  "files": [{ "path": "lib/data/{kebab-name}.json", "type": "registry:lib" }]
}
```

**3. Registry dependency** — add to the component's `registryDependencies`:

```json
"http://localhost:3999/r/{kebab-name}-data.json"
```

## Styling Conventions

- Use `cn()` from `@/lib/utils` for all className merging
- Use NativeWind classes (Tailwind) for styling
- Use CVA (`class-variance-authority`) when the component has variants
- `font-teko` for display/label text, `font-sans` for body text
- Props should extend native RN types where appropriate (`ViewProps`, `TextProps`, `PressableProps`)
- Always include `className?: string` prop for style override
- Export both the component and its Props type

## After Creating

1. Verify all files exist and exports are correct
2. Confirm `registry.json` is valid JSON
3. Confirm story index entries are alphabetically sorted within their category

## Checklist

- [ ] Component file created with correct naming
- [ ] Barrel export(s) updated
- [ ] Story file created with StorySection wrapper
- [ ] Stories index entry added (alphabetically sorted)
- [ ] Registry entry added with correct atomicLevel and file paths
- [ ] Optional: static data file + registry entry if needed

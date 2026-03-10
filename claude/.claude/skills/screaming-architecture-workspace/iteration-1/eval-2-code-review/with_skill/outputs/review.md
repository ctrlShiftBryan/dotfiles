# Code Review: `app/(tabs)/members.tsx`

Reviewed against the screaming architecture conventions for this Expo React Native + Convex project.

---

## Summary of Findings

The screen contains **3 violations** and **1 warning**, all of which stem from the same root cause: business logic and Convex access that belong in `features/` have been placed directly in the `app/` screen.

---

## Violations

### 1. VIOLATION — Direct `api.*` import in a screen

```tsx
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

const members = useQuery(api.packMembers.list);
```

**Why it's a problem:** Screens in `app/` are routing wrappers only. When `api.*` is imported directly in a screen, the screen is coupled to the Convex backend. If the query changes (args, shape, name), you must find and fix every screen that uses it rather than updating one hook. It also makes the screen untestable in isolation — you can't render it without a Convex provider in scope.

**Fix:** Create a feature hook:

```ts
// features/pack-members/hooks/use-pack-members.ts
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function usePackMembers() {
  return useQuery(api.packMembers.list);
}
```

Then import only the hook in the screen.

---

### 2. VIOLATION — Business logic in `app/` (filtering + sorting)

```tsx
const activeMembers = members?.filter(m => m.status === 'active');
const sortedMembers = activeMembers?.sort((a, b) => a.name.localeCompare(b.name));
```

**Why it's a problem:** Filtering by `status === 'active'` and sorting by name are domain decisions about what "a list of pack members" means. They belong in the feature layer, not in routing. If this logic is needed elsewhere (another screen, a widget), it must be duplicated. It also obscures the screen's intent — a reader has to parse filtering/sorting code to understand that this screen shows a sorted active-member list.

**Fix — option A (preferred): filter/sort in the backend.**
Add an index to the Convex schema and return only active members, sorted:

```ts
// convex/packMembers/queries.ts — filter at the source
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query('packMembers')
      .withIndex('by_status', (q) => q.eq('status', 'active'))
      .order('asc') // or sort by name in helpers
      .collect();
  },
});
```

**Fix — option B: move logic into the feature hook.**
If client-side filtering is intentional (e.g., data is already fetched for other reasons):

```ts
// features/pack-members/hooks/use-pack-members.ts
export function useActivePackMembers() {
  const members = useQuery(api.packMembers.list);
  const active = members?.filter(m => m.status === 'active');
  return active?.slice().sort((a, b) => a.name.localeCompare(b.name));
}
```

---

### 3. VIOLATION — Inline `renderItem` with layout logic in the screen

```tsx
renderItem={({ item }) => (
  <TouchableOpacity onPress={() => router.push(`/members/${item._id}`)}>
    <View style={{ padding: 12, borderBottomWidth: 1, borderColor: '#eee' }}>
      <Text style={{ fontSize: 16 }}>{item.name}</Text>
      <Text style={{ color: '#666' }}>{item.role}</Text>
    </View>
  </TouchableOpacity>
)}
```

**Why it's a problem:** This is a UI component defined inline inside a routing file. The member card layout, press handler, and navigation target are business/UI decisions that belong in `features/pack-members/components/`. As the card grows (avatar, status badge, action buttons), the screen becomes unreadable.

**Fix:** Extract to a feature component:

```tsx
// features/pack-members/components/pack-member-card.tsx
import { TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { useRouter } from 'expo-router';
import type { PackMember } from '../types';

interface Props {
  member: PackMember;
}

export function PackMemberCard({ member }: Props) {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.push(`/members/${member._id}`)}>
      <View className="border-b border-border px-3 py-3">
        <Text className="text-base">{member.name}</Text>
        <Text className="text-muted-foreground">{member.role}</Text>
      </View>
    </TouchableOpacity>
  );
}
```

---

## Warning

### 4. WARNING — Inline styles instead of NativeWind classes

```tsx
style={{ flex: 1, padding: 16 }}
style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}
style={{ padding: 12, borderBottomWidth: 1, borderColor: '#eee' }}
style={{ fontSize: 16 }}
style={{ color: '#666' }}
```

**Why it's a problem:** The project uses NativeWind (Tailwind for React Native) as seen in `global.css`, `tailwind.config.js`, and throughout `app/_layout.tsx` and `app/index.tsx`. Inline styles bypass the design system — hardcoded colors like `#eee` and `#666` will not respond to dark mode via the theme, and values like `fontSize: 24` skip the typography scale.

**Fix:** Use NativeWind classes and the project's `components/ui/text` component (already used throughout the codebase):

```tsx
<View className="flex-1 p-4">
  <Text className="mb-4 text-2xl font-bold">Pack Members</Text>
```

---

## What the Screen Should Look Like After Fixes

```tsx
// app/(tabs)/members.tsx
import { PackMemberList } from '@/features/pack-members/components/pack-member-list';

export default function MembersScreen() {
  return <PackMemberList />;
}
```

The screen becomes a thin 3-line wrapper. All logic lives in `features/pack-members/`.

---

## Required New Files

| File | Purpose |
|---|---|
| `features/pack-members/hooks/use-pack-members.ts` | Wraps `useQuery(api.packMembers.list)` |
| `features/pack-members/components/pack-member-card.tsx` | Single member row UI |
| `features/pack-members/components/pack-member-list.tsx` | `FlatList` composing the card |
| `features/pack-members/types.ts` | `PackMember` type derived from Convex schema |

This mirrors the `features/demo/` pattern already in the project, and follows the vertical slice shown in `expo-patterns.md` for this exact domain (pack-members).

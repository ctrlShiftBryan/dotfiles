# Code Review: `app/(tabs)/members.tsx`

## Summary

The screen works in the most basic sense — it renders a filtered, sorted list of active members and navigates on tap. However it has several issues spanning architecture violations, UX gaps, styling approach, and minor React correctness concerns. All findings reference this project's conventions (Expo Router, Convex, Nativewind, TypeScript strict mode).

---

## Finding 1 — Architecture Violation: Direct Convex access in a screen (Critical)

**File:** `app/(tabs)/members.tsx`

```tsx
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

const members = useQuery(api.packMembers.list);
```

The project's CLAUDE.md architecture rules are explicit:

> `app/` screens must NEVER import `api.*` from Convex directly.
> All Convex access is encapsulated inside `features/<name>/hooks/`. Screens and UI components never call `useQuery(api.*)` or `useMutation(api.*)` directly — they use feature hooks that wrap these calls.

This screen calls `useQuery(api.packMembers.list)` directly, which breaks the Convex boundary layer pattern.

**Fix:** Create a feature module and move the Convex call there.

```
features/
  pack-members/
    hooks/
      use-pack-members.ts   ← useQuery lives here
    components/
      member-list.tsx
      member-list-item.tsx
    types.ts
```

`features/pack-members/hooks/use-pack-members.ts`:
```tsx
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function usePackMembers() {
  return useQuery(api.packMembers.list);
}
```

`app/(tabs)/members.tsx` then becomes:
```tsx
import { usePackMembers } from '@/features/pack-members/hooks/use-pack-members';

export default function MembersScreen() {
  const members = usePackMembers();
  // ...
}
```

---

## Finding 2 — No loading or error state (High)

`useQuery` returns `undefined` while the query is in-flight. The code passes `sortedMembers` (which is `undefined` initially) straight to `FlatList`. `FlatList` accepts `undefined` for `data`, so it won't crash, but the user sees a blank screen with no feedback.

There is also no handling for query errors (Convex throws on auth failures, network issues, etc.).

**Fix:**

```tsx
const members = usePackMembers();

if (members === undefined) {
  return <ActivityIndicator />;  // or a skeleton
}

// members is now PackMember[] — safe to filter/sort
```

For errors, wrap with an `ErrorBoundary` (Expo Router exports one) or use a try/catch pattern around the feature hook.

---

## Finding 3 — Sorting mutates the array in place (Medium)

```tsx
const sortedMembers = activeMembers?.sort((a, b) => a.name.localeCompare(b.name));
```

`Array.prototype.sort` sorts in place and returns the same array reference. `activeMembers` is already a new array from `.filter()`, so this doesn't mutate the original Convex data, but it's still a subtle footgun. If the derivation logic is ever refactored (e.g., skipping the filter), it could mutate data coming directly from the query cache.

**Fix:** Use `.toSorted()` (ES2023, available in the project's Node >=22 / ESNext target) or spread before sorting:

```tsx
const sortedMembers = activeMembers?.toSorted((a, b) => a.name.localeCompare(b.name));
```

---

## Finding 4 — Inline styles instead of Nativewind/Tailwind (Medium)

The project uses Nativewind (Tailwind CSS for React Native) as its styling system. Every other screen and component in the codebase uses `className` with Tailwind utility classes. This screen uses inline `style` objects throughout:

```tsx
style={{ flex: 1, padding: 16 }}
style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}
style={{ padding: 12, borderBottomWidth: 1, borderColor: '#eee' }}
style={{ fontSize: 16 }}
style={{ color: '#666' }}
```

Problems:
- Breaks visual consistency with the rest of the app.
- Hardcoded hex colors (`#eee`, `#666`) bypass the CSS variable theming system, so the UI won't adapt to dark mode.
- Prettier's Tailwind plugin (configured in `.prettierrc`) won't sort/lint these.

**Fix:** Replace with Nativewind classes and CSS variable-aware theme tokens:

```tsx
<View className="flex-1 p-4">
  <Text className="mb-4 font-body-semibold text-2xl text-foreground">Pack Members</Text>
  <FlatList
    ...
    renderItem={({ item }) => (
      <TouchableOpacity onPress={() => router.push(`/members/${item._id}`)}>
        <View className="border-b border-border p-3">
          <Text className="text-base text-foreground">{item.name}</Text>
          <Text className="text-muted-foreground">{item.role}</Text>
        </View>
      </TouchableOpacity>
    )}
  />
</View>
```

Note: `Text` should be imported from `@/components/ui/text` (the project's typed Text primitive), not from `react-native`.

---

## Finding 5 — Using `react-native` Text and View primitives directly (Medium)

The project wraps primitives in `components/ui/` (e.g., `@/components/ui/text`, `@/components/ui/button`). These wrappers apply the project's font tokens, theming, and variant logic via CVA. Using the bare `react-native` `Text` skips all of that.

**Fix:** Import `Text` from `@/components/ui/text`. For `View` and `TouchableOpacity`, the raw RN imports are acceptable since there are no project-level wrappers for those, but using `Pressable` (which the rest of the codebase uses) is preferred over `TouchableOpacity`.

```tsx
import { Text } from '@/components/ui/text';
import { View, FlatList, Pressable } from 'react-native';
```

---

## Finding 6 — No `accessibilityLabel` on interactive elements (Low)

The `TouchableOpacity` (or `Pressable`) wrapping each row has no `accessibilityLabel`. Screen reader users would hear "button" with no context about which member they're activating.

**Fix:**

```tsx
<Pressable
  onPress={() => router.push(`/members/${item._id}`)}
  accessibilityRole="button"
  accessibilityLabel={`View ${item.name}'s profile`}
>
```

---

## Finding 7 — `keyExtractor` type safety (Low)

```tsx
keyExtractor={(item) => item._id}
```

Convex document IDs are typed as `Id<"tableName">` (a branded string), not a plain `string`. `FlatList`'s `keyExtractor` expects `(item: T) => string`. This may type-check fine since `Id<T>` extends `string`, but it's worth verifying the Convex schema type to confirm — and explicitly casting with `.toString()` or `String(item._id)` makes the intent clear.

---

## Summary Table

| # | Issue | Severity |
|---|-------|----------|
| 1 | Direct `useQuery(api.*)` in a screen — violates architecture rule | Critical |
| 2 | No loading / error state for the Convex query | High |
| 3 | `.sort()` mutates in place — should use `.toSorted()` | Medium |
| 4 | Inline styles + hardcoded colors — bypasses Nativewind and dark mode | Medium |
| 5 | Raw `react-native` `Text` instead of `@/components/ui/text`; `TouchableOpacity` instead of `Pressable` | Medium |
| 6 | No `accessibilityLabel` on row press target | Low |
| 7 | `_id` coercion to `string` implicit — explicit cast preferred | Low |

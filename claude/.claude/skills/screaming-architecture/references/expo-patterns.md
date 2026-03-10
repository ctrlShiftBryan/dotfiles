# Expo React Native Patterns

## Canonical Project Structure

```
(project root)
  app/                              # Navigation tree ONLY — no business logic
    _layout.tsx                     # Root: providers + root navigator
    +not-found.tsx                  # 404 fallback
    (tabs)/
      _layout.tsx                   # Tab bar configuration
      index.tsx                     # Home tab screen
      workouts.tsx                  # Workouts tab screen
      profile.tsx                   # Profile tab screen
    (auth)/
      _layout.tsx                   # Auth stack navigator
      login.tsx                     # Login screen
      register.tsx                  # Register screen
    workouts/
      [id].tsx                      # Workout detail (dynamic route)
      new.tsx                       # Create workout

  features/                         # Business logic — one directory per domain
    workouts/
      components/
        workout-card.tsx
        workout-form.tsx
        workout-list.tsx
      hooks/
        use-workouts.ts             # useQuery(api.workouts.list)
        use-workout.ts              # useQuery(api.workouts.get)
        use-create-workout.ts       # useMutation(api.workouts.create)
      utils/
        format-workout.ts
      types.ts
    auth/
      components/
        login-form.tsx
        auth-guard.tsx
      hooks/
        use-auth.ts
        use-login.ts
      types.ts

  components/ui/                    # Shared UI primitives (buttons, inputs, cards)
  hooks/                            # Global hooks (useColorScheme, useThemeColor)
  shared/                           # Pure logic — NO React, NO Convex, NO React Native
    utils.ts                        # cn(), formatDate(), etc.
  convex/                           # Backend (see convex-patterns.md)
  assets/                           # Static assets (images, fonts)
  constants/                        # App-wide constants (Colors, Layout)
```

## The Golden Rule: Screens Are Thin

A screen file in `app/` should do exactly three things:
1. Read navigation/route params
2. Set screen options (title, header, etc.)
3. Render a feature component

If a screen is doing more than this, the logic belongs in `features/`.

### Good: Thin Screen (~20 lines)

```tsx
// app/(tabs)/workouts.tsx
import { Stack } from "expo-router";
import { WorkoutList } from "@/features/workouts/components/workout-list";

export default function WorkoutsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Workouts" }} />
      <WorkoutList />
    </>
  );
}
```

### Bad: Fat Screen (business logic in app/)

```tsx
// app/(tabs)/workouts.tsx — DON'T DO THIS
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FlatList, View, Text } from "react-native";

export default function WorkoutsScreen() {
  const workouts = useQuery(api.workouts.list);  // ❌ api.* in screen
  const filtered = workouts?.filter(w => w.isActive);  // ❌ business logic
  return (
    <FlatList
      data={filtered}
      renderItem={({ item }) => (  // ❌ inline rendering logic
        <View><Text>{item.name}</Text></View>
      )}
    />
  );
}
```

## Feature-to-Route Mapping

Every feature domain maps to routes in `app/`. The mapping should be obvious:

```
features/workouts/     →  app/(tabs)/workouts.tsx      (list)
                           app/workouts/[id].tsx        (detail)
                           app/workouts/new.tsx         (create)

features/auth/         →  app/(auth)/login.tsx
                           app/(auth)/register.tsx

features/profile/      →  app/(tabs)/profile.tsx
                           app/profile/edit.tsx
```

When auditing, check that:
- Every feature has at least one route
- Every route's content comes from a feature
- No "orphan" routes with inline logic

## Provider Chain Pattern

The root `app/_layout.tsx` sets up the provider chain. Providers go here — not in screens.

```tsx
// app/_layout.tsx
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ThemeProvider } from "@/components/theme-provider";
import { Stack } from "expo-router";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ConvexProvider client={convex}>
        <ThemeProvider>
          <Stack />
        </ThemeProvider>
      </ConvexProvider>
    </GestureHandlerRootView>
  );
}
```

Important: `app/_layout.tsx` is the ONE place that may import from `convex/react` directly (for provider setup). All other Convex access goes through `features/*/hooks/`.

## Route Group Patterns

Route groups `(groupName)/` organize navigation without affecting URLs. Every group needs a `_layout.tsx`:

```tsx
// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="workouts" options={{ title: "Workouts" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
```

Missing `_layout.tsx` in a route group is a bug — Expo Router will use a default stack navigator, which is rarely what you want.

## Platform-Specific Code

For platform-specific behavior, use file suffixes co-located with the base file:

```
hooks/
  use-color-scheme.ts       # Base implementation (or shared logic)
  use-color-scheme.web.ts   # Web-specific override
  use-color-scheme.ios.ts   # iOS-specific (if needed)
```

Rules:
- A `.web.tsx` or `.ios.tsx` file must have a corresponding base `.tsx` file
- Platform files go next to their base file, never scattered elsewhere
- Metro bundler picks the right file automatically — no manual conditional imports

## Full Vertical Slice Example

Building a "pack-members" feature from scratch:

### 1. Convex Schema
```ts
// convex/packMembers/schema.ts
import { defineTable } from "convex/server";
import { v } from "convex/values";

export const packMembersTable = defineTable({
  name: v.string(),
  role: v.string(),
  packId: v.id("packs"),
  joinedAt: v.number(),
}).index("by_pack", ["packId"]);
```

### 2. Convex Helper
```ts
// convex/packMembers/helpers.ts
import { QueryCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export async function getPackMembers(ctx: QueryCtx, packId: Id<"packs">) {
  return ctx.db
    .query("packMembers")
    .withIndex("by_pack", (q) => q.eq("packId", packId))
    .collect();
}
```

### 3. Convex Public API
```ts
// convex/packMembers/queries.ts
import { query } from "../_generated/server";
import { v } from "convex/values";
import { getPackMembers } from "./helpers";

export const list = query({
  args: { packId: v.id("packs") },
  returns: v.array(v.object({
    _id: v.id("packMembers"),
    _creationTime: v.number(),
    name: v.string(),
    role: v.string(),
    packId: v.id("packs"),
    joinedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    return getPackMembers(ctx, args.packId);
  },
});
```

### 4. Feature Hook
```ts
// features/pack-members/hooks/use-pack-members.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export function usePackMembers(packId: Id<"packs">) {
  return useQuery(api.packMembers.list, { packId });
}
```

### 5. Feature Component
```ts
// features/pack-members/components/pack-member-list.tsx
import { FlatList } from "react-native";
import { usePackMembers } from "../hooks/use-pack-members";
import { PackMemberCard } from "./pack-member-card";
import { Id } from "@/convex/_generated/dataModel";

interface Props {
  packId: Id<"packs">;
}

export function PackMemberList({ packId }: Props) {
  const members = usePackMembers(packId);

  if (!members) return <LoadingSkeleton />;

  return (
    <FlatList
      data={members}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => <PackMemberCard member={item} />}
    />
  );
}
```

### 6. Thin Screen
```tsx
// app/packs/[packId]/members.tsx
import { useLocalSearchParams } from "expo-router";
import { Stack } from "expo-router";
import { PackMemberList } from "@/features/pack-members/components/pack-member-list";
import { Id } from "@/convex/_generated/dataModel";

export default function PackMembersScreen() {
  const { packId } = useLocalSearchParams<{ packId: string }>();
  return (
    <>
      <Stack.Screen options={{ title: "Pack Members" }} />
      <PackMemberList packId={packId as Id<"packs">} />
    </>
  );
}
```

## Anti-Pattern Checklist

Use this when auditing or reviewing Expo projects:

| # | Anti-Pattern | Detection | Fix |
|---|---|---|---|
| 1 | Components/hooks/utils in `app/` | Non-route files in app/ tree | Move to `features/{domain}/` |
| 2 | Fat screens (>50 lines) | Line count check | Extract to feature component |
| 3 | `api.*` imports in screens | grep for `api\.` in `app/` | Move to `features/*/hooks/` |
| 4 | Providers in screen files | grep `<.*Provider` outside `_layout.tsx` | Move to nearest `_layout.tsx` |
| 5 | `src/` directory in Expo | Directory exists | Remove, use root-level dirs |
| 6 | Missing `_layout.tsx` in groups | Route group without layout | Add layout file |
| 7 | Platform files without base | `.web.tsx` without `.tsx` | Create base file |
| 8 | Cross-feature imports | features/A imports features/B | Extract to `shared/` |

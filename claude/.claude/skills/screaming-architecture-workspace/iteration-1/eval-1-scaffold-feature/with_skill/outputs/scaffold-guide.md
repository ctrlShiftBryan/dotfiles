# Building the `pack-members` Feature in Anders Wolfpack

This guide walks you through adding pack-members from scratch using screaming architecture. The project is Expo React Native + Convex with a Drawer navigator. Build bottom-up: backend first, then hooks, then components, then screens.

---

## What You're Building

Three user stories:
1. **List members** — see all members of a pack
2. **View a member profile** — tap a member to see their detail
3. **Invite new members** — send an invitation by email/username

Final file tree when done:

```
convex/
  schema.ts                              (update — add packMembers + invitations tables)
  packMembers/
    schema.ts                            (new)
    helpers.ts                           (new)
    queries.ts                           (new)
    mutations.ts                         (new)

features/
  pack-members/
    types.ts                             (new)
    hooks/
      use-pack-members.ts                (new)
      use-pack-member.ts                 (new)
      use-invite-member.ts               (new)
    components/
      pack-member-card.tsx               (new)
      pack-member-list.tsx               (new)
      pack-member-profile.tsx            (new)
      invite-member-form.tsx             (new)

app/
  packs/
    [packId]/
      members.tsx                        (new — list screen)
      members/
        [memberId].tsx                   (new — profile screen)
      invite.tsx                         (new — invite screen)
```

---

## Step 1 — Convex Schema

### 1a. Domain schema file

Create `convex/packMembers/schema.ts`:

```ts
import { defineTable } from "convex/server";
import { v } from "convex/values";

export const packMembersTable = defineTable({
  userId: v.string(),          // auth identity or user ID
  packId: v.id("packs"),
  displayName: v.string(),
  avatarUrl: v.optional(v.string()),
  role: v.union(v.literal("owner"), v.literal("member")),
  joinedAt: v.number(),
})
  .index("by_pack", ["packId"])
  .index("by_user_and_pack", ["userId", "packId"]);

export const packInvitationsTable = defineTable({
  packId: v.id("packs"),
  invitedBy: v.string(),       // userId of inviter
  email: v.string(),
  status: v.union(
    v.literal("pending"),
    v.literal("accepted"),
    v.literal("declined"),
  ),
  createdAt: v.number(),
}).index("by_pack", ["packId"]);
```

### 1b. Register tables in the root schema

The project has no `convex/schema.ts` yet (the generated `dataModel.d.ts` confirms no schema file exists). Create `convex/schema.ts`:

```ts
import { defineSchema } from "convex/server";
import { packMembersTable, packInvitationsTable } from "./packMembers/schema";

export default defineSchema({
  packMembers: packMembersTable,
  packInvitations: packInvitationsTable,
});
```

> After saving this file, run `npx convex dev` once so Convex regenerates `convex/_generated/api.d.ts` and `convex/_generated/dataModel.d.ts` with the real types. All subsequent code depends on those generated types.

---

## Step 2 — Convex Helpers

Create `convex/packMembers/helpers.ts`:

```ts
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

export async function getPackMembers(
  ctx: QueryCtx,
  packId: Id<"packs">,
) {
  return ctx.db
    .query("packMembers")
    .withIndex("by_pack", (q) => q.eq("packId", packId))
    .collect();
}

export async function getPackMember(
  ctx: QueryCtx,
  memberId: Id<"packMembers">,
) {
  return ctx.db.get(memberId);
}

export async function createInvitation(
  ctx: MutationCtx,
  data: {
    packId: Id<"packs">;
    invitedBy: string;
    email: string;
  },
) {
  return ctx.db.insert("packInvitations", {
    ...data,
    status: "pending",
    createdAt: Date.now(),
  });
}
```

Helpers are pure domain logic — they take a context and return data. No business rules in the query/mutation handlers.

---

## Step 3 — Convex Public API

### Queries

Create `convex/packMembers/queries.ts`:

```ts
import { query } from "../_generated/server";
import { v } from "convex/values";
import { getPackMembers, getPackMember } from "./helpers";

export const list = query({
  args: { packId: v.id("packs") },
  returns: v.array(
    v.object({
      _id: v.id("packMembers"),
      _creationTime: v.number(),
      userId: v.string(),
      packId: v.id("packs"),
      displayName: v.string(),
      avatarUrl: v.optional(v.string()),
      role: v.union(v.literal("owner"), v.literal("member")),
      joinedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    return getPackMembers(ctx, args.packId);
  },
});

export const get = query({
  args: { memberId: v.id("packMembers") },
  returns: v.union(
    v.object({
      _id: v.id("packMembers"),
      _creationTime: v.number(),
      userId: v.string(),
      packId: v.id("packs"),
      displayName: v.string(),
      avatarUrl: v.optional(v.string()),
      role: v.union(v.literal("owner"), v.literal("member")),
      joinedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return getPackMember(ctx, args.memberId);
  },
});
```

### Mutations

Create `convex/packMembers/mutations.ts`:

```ts
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { createInvitation } from "./helpers";

export const invite = mutation({
  args: {
    packId: v.id("packs"),
    invitedBy: v.string(),
    email: v.string(),
  },
  returns: v.id("packInvitations"),
  handler: async (ctx, args) => {
    return createInvitation(ctx, args);
  },
});
```

After adding these files, run `npx convex dev` again. The generated API will expose `api.packMembers.list`, `api.packMembers.get`, and `api.packMembers.invite`.

---

## Step 4 — Feature Types

Create `features/pack-members/types.ts`:

```ts
import type { Id } from "@/convex/_generated/dataModel";

export type PackMemberRole = "owner" | "member";

export interface PackMember {
  _id: Id<"packMembers">;
  _creationTime: number;
  userId: string;
  packId: Id<"packs">;
  displayName: string;
  avatarUrl?: string;
  role: PackMemberRole;
  joinedAt: number;
}
```

Types file is the only place in `features/pack-members/` that imports from `convex/_generated/dataModel`. Components and hooks reference `PackMember` from here instead of re-typing inline.

---

## Step 5 — Feature Hooks

This is the only layer that imports from `convex/_generated/api`. All three hooks live in `features/pack-members/hooks/`.

### `use-pack-members.ts`

```ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function usePackMembers(packId: Id<"packs">) {
  return useQuery(api.packMembers.list, { packId });
}
```

### `use-pack-member.ts`

```ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function usePackMember(memberId: Id<"packMembers">) {
  return useQuery(api.packMembers.get, { memberId });
}
```

### `use-invite-member.ts`

```ts
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useInviteMember() {
  return useMutation(api.packMembers.invite);
}
```

Hooks return the raw Convex result (`undefined` while loading, `null` if not found, data otherwise). Components handle those states.

---

## Step 6 — Feature Components

### `pack-member-card.tsx`

Used as the row item in the list.

```tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Text } from "@/components/ui/text";
import { cn } from "@/shared/utils";
import { Pressable, View } from "react-native";
import type { PackMember } from "../types";

interface Props {
  member: PackMember;
  onPress: (member: PackMember) => void;
}

export function PackMemberCard({ member, onPress }: Props) {
  const initials = member.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Pressable
      onPress={() => onPress(member)}
      className={cn(
        "flex-row items-center gap-3 px-4 py-3",
        "active:bg-accent border-b border-border",
      )}
    >
      <Avatar className="size-10">
        {member.avatarUrl ? (
          <AvatarImage source={{ uri: member.avatarUrl }} />
        ) : null}
        <AvatarFallback>
          <Text className="text-sm font-body-medium">{initials}</Text>
        </AvatarFallback>
      </Avatar>
      <View className="flex-1">
        <Text className="font-body-medium text-foreground">
          {member.displayName}
        </Text>
        <Text className="text-sm text-muted-foreground capitalize">
          {member.role}
        </Text>
      </View>
    </Pressable>
  );
}
```

### `pack-member-list.tsx`

```tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { FlatList, View } from "react-native";
import type { Id } from "@/convex/_generated/dataModel";
import { usePackMembers } from "../hooks/use-pack-members";
import type { PackMember } from "../types";
import { PackMemberCard } from "./pack-member-card";

interface Props {
  packId: Id<"packs">;
  onMemberPress: (member: PackMember) => void;
}

function LoadingSkeleton() {
  return (
    <View className="gap-3 p-4">
      {[1, 2, 3].map((i) => (
        <View key={i} className="flex-row items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <View className="flex-1 gap-2">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-3 w-20 rounded" />
          </View>
        </View>
      ))}
    </View>
  );
}

export function PackMemberList({ packId, onMemberPress }: Props) {
  const members = usePackMembers(packId);

  if (members === undefined) {
    return <LoadingSkeleton />;
  }

  if (members.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Text className="text-muted-foreground">No members yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={members}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <PackMemberCard member={item} onPress={onMemberPress} />
      )}
    />
  );
}
```

### `pack-member-profile.tsx`

```tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import type { Id } from "@/convex/_generated/dataModel";
import { View } from "react-native";
import { usePackMember } from "../hooks/use-pack-member";

interface Props {
  memberId: Id<"packMembers">;
}

function ProfileSkeleton() {
  return (
    <View className="items-center gap-4 p-6">
      <Skeleton className="size-20 rounded-full" />
      <Skeleton className="h-6 w-40 rounded" />
      <Skeleton className="h-4 w-24 rounded" />
    </View>
  );
}

export function PackMemberProfile({ memberId }: Props) {
  const member = usePackMember(memberId);

  if (member === undefined) {
    return <ProfileSkeleton />;
  }

  if (member === null) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Text className="text-muted-foreground">Member not found</Text>
      </View>
    );
  }

  const initials = member.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const joinDate = new Date(member.joinedAt).toLocaleDateString();

  return (
    <Card className="m-4">
      <CardHeader className="items-center">
        <Avatar className="size-20">
          {member.avatarUrl ? (
            <AvatarImage source={{ uri: member.avatarUrl }} />
          ) : null}
          <AvatarFallback>
            <Text className="text-xl font-body-medium">{initials}</Text>
          </AvatarFallback>
        </Avatar>
        <CardTitle>{member.displayName}</CardTitle>
        <Text className="text-sm text-muted-foreground capitalize">
          {member.role}
        </Text>
      </CardHeader>
      <CardContent>
        <Text className="text-sm text-muted-foreground">
          Member since {joinDate}
        </Text>
      </CardContent>
    </Card>
  );
}
```

### `invite-member-form.tsx`

```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import type { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { View } from "react-native";
import { useInviteMember } from "../hooks/use-invite-member";

interface Props {
  packId: Id<"packs">;
  invitedBy: string;
  onSuccess: () => void;
}

export function InviteMemberForm({ packId, invitedBy, onSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inviteMember = useInviteMember();

  async function handleSubmit() {
    if (!email.trim()) return;
    setIsSubmitting(true);
    try {
      await inviteMember({ packId, invitedBy, email: email.trim() });
      setEmail("");
      onSuccess();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View className="gap-4 p-4">
      <Text className="font-body-medium text-foreground">
        Invite by email address
      </Text>
      <Input
        placeholder="name@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Button onPress={handleSubmit} disabled={isSubmitting || !email.trim()}>
        <Text>{isSubmitting ? "Sending…" : "Send Invite"}</Text>
      </Button>
    </View>
  );
}
```

---

## Step 7 — Screens (Thin Wrappers)

Screens live in `app/packs/[packId]/`. They read route params, set the header title, and render exactly one feature component. No business logic.

### Members list screen

Create `app/packs/[packId]/members.tsx`:

```tsx
import { PackMemberList } from "@/features/pack-members/components/pack-member-list";
import type { PackMember } from "@/features/pack-members/types";
import type { Id } from "@/convex/_generated/dataModel";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

export default function PackMembersScreen() {
  const { packId } = useLocalSearchParams<{ packId: string }>();
  const router = useRouter();

  function handleMemberPress(member: PackMember) {
    router.push(`/packs/${packId}/members/${member._id}`);
  }

  return (
    <>
      <Stack.Screen options={{ title: "Pack Members" }} />
      <PackMemberList
        packId={packId as Id<"packs">}
        onMemberPress={handleMemberPress}
      />
    </>
  );
}
```

### Member profile screen

Create `app/packs/[packId]/members/[memberId].tsx`:

```tsx
import { PackMemberProfile } from "@/features/pack-members/components/pack-member-profile";
import type { Id } from "@/convex/_generated/dataModel";
import { Stack, useLocalSearchParams } from "expo-router";

export default function PackMemberProfileScreen() {
  const { memberId } = useLocalSearchParams<{ memberId: string }>();

  return (
    <>
      <Stack.Screen options={{ title: "Member Profile" }} />
      <PackMemberProfile memberId={memberId as Id<"packMembers">} />
    </>
  );
}
```

### Invite screen

Create `app/packs/[packId]/invite.tsx`:

```tsx
import { InviteMemberForm } from "@/features/pack-members/components/invite-member-form";
import type { Id } from "@/convex/_generated/dataModel";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

const PLACEHOLDER_USER_ID = "current-user-id"; // replace with real auth

export default function InviteMemberScreen() {
  const { packId } = useLocalSearchParams<{ packId: string }>();
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: "Invite Member" }} />
      <InviteMemberForm
        packId={packId as Id<"packs">}
        invitedBy={PLACEHOLDER_USER_ID}
        onSuccess={() => router.back()}
      />
    </>
  );
}
```

---

## Step 8 — Wire Up the Drawer (Optional)

The app uses a Drawer navigator (`app/_layout.tsx`). If you want pack-members reachable from the drawer, add a `Drawer.Screen` entry there. For now the screens are reachable by navigating programmatically (e.g., `router.push("/packs/PACK_ID/members")`).

To add a drawer link, open `app/_layout.tsx` and add inside the `<Drawer>`:

```tsx
<Drawer.Screen
  name="packs/[packId]/members"
  options={{ title: "Pack Members" }}
/>
```

The drawer navigation and `DrawerContent` component live in `features/demo/` today. When you add a real pack-members nav entry, that content belongs in a `features/pack-members/components/` component, not in `features/demo/`.

---

## Import Boundary Rules to Follow

| Layer | May import from |
|---|---|
| `app/packs/` screens | `features/pack-members/components/`, `features/pack-members/types`, `convex/_generated/dataModel` (for `Id` casts only) |
| `features/pack-members/components/` | own hooks, own types, `components/ui/`, `shared/utils` |
| `features/pack-members/hooks/` | `convex/_generated/api`, `convex/_generated/dataModel`, `convex/react` |
| `features/pack-members/types.ts` | `convex/_generated/dataModel` |

**Never** import `features/pack-members/` from another feature. If two features need the same member data, the shared piece goes in `shared/`.

---

## Project-Specific Conventions to Follow

These are enforced by the project's ESLint config (`eslint.config.mjs`):

- **Max 50 lines per function** — the `InviteMemberForm` component is close to the limit; if you add validation logic, extract it to a helper function or a `utils/validate-invite.ts` file inside the feature.
- **Max 300 lines per file** — split large component files if needed.
- **Max cognitive complexity of 15** — keep conditionals flat.
- **NativeWind for styling** — all styles use `className` props with Tailwind classes, matching the project's existing pattern (no `StyleSheet.create`).
- **Path alias `@/`** — maps to the project root (set in `tsconfig.json`). Use `@/features/...`, `@/components/ui/...`, `@/shared/utils`, `@/convex/_generated/...`.
- **`pnpm`** — the project uses pnpm, not npm/yarn.

---

## Verification Steps

After adding all files:

```bash
# Type-check everything
pnpm typecheck

# Lint
pnpm lint

# Run unit tests
pnpm test:unit

# Start dev server with Convex watching
pnpm bg:up
```

For Convex schema changes specifically:
```bash
npx convex dev
```

This regenerates the types in `convex/_generated/` so TypeScript sees your new tables and functions.

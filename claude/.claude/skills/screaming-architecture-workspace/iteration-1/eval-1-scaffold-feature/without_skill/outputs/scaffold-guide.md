# Building the Pack Members Feature

This guide walks you through adding pack membership to this Expo + Convex project. The feature covers three user-facing needs: list members in a pack, view an individual member's profile, and invite new members.

## Project conventions to keep in mind

From `CLAUDE.md` and the existing code:

- **`app/`** holds screens only — no business logic, no direct Convex calls.
- **`features/<name>/`** is where all feature code lives: `components/`, `hooks/`, `types.ts`.
- **`features/<name>/hooks/`** is the only place that imports `api.*` from Convex. Screens call feature hooks, not raw `useQuery`/`useMutation`.
- **`components/ui/`** provides primitives (Button, Text, Card, Avatar, Input, etc.) — use them freely.
- **`shared/`** is pure logic only — no React, no Convex.
- Cross-feature imports are forbidden. If you need to share something between features, move it to `shared/`.
- Path alias `@/` maps to project root.

---

## Step 1 — Define the Convex schema

Convex currently has no `schema.ts` (the generated `dataModel.d.ts` shows `Doc = any`). Adding a schema gives you type safety throughout.

Create `convex/schema.ts`:

```ts
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  packs: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(), // Date.now()
  }),

  packMembers: defineTable({
    packId: v.id("packs"),
    userId: v.string(),       // identity subject from Convex auth, or any stable user ID
    displayName: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("member")),
    joinedAt: v.number(),
  })
    .index("by_pack", ["packId"])
    .index("by_pack_and_user", ["packId", "userId"]),

  packInvites: defineTable({
    packId: v.id("packs"),
    invitedEmail: v.string(),
    invitedBy: v.string(),    // userId of the person sending the invite
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("declined")
    ),
    createdAt: v.number(),
    expiresAt: v.number(),    // Date.now() + 7 days, for example
  })
    .index("by_pack", ["packId"])
    .index("by_email", ["invitedEmail"]),
});
```

After saving, run `pnpm bg:convex:up` (or restart it). Convex will regenerate `_generated/` with proper types.

---

## Step 2 — Write the Convex backend functions

Create `convex/packMembers.ts`:

```ts
// convex/packMembers.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// List all members in a pack
export const listByPack = query({
  args: { packId: v.id("packs") },
  handler: async (ctx, { packId }) => {
    return ctx.db
      .query("packMembers")
      .withIndex("by_pack", (q) => q.eq("packId", packId))
      .collect();
  },
});

// Get a single member by their document ID
export const getById = query({
  args: { memberId: v.id("packMembers") },
  handler: async (ctx, { memberId }) => {
    return ctx.db.get(memberId);
  },
});

// Invite a new member (creates a pending invite record)
export const invite = mutation({
  args: {
    packId: v.id("packs"),
    invitedEmail: v.string(),
    invitedBy: v.string(),
  },
  handler: async (ctx, { packId, invitedEmail, invitedBy }) => {
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return ctx.db.insert("packInvites", {
      packId,
      invitedEmail,
      invitedBy,
      status: "pending",
      createdAt: Date.now(),
      expiresAt: Date.now() + sevenDays,
    });
  },
});

// Accept an invite — promotes the invite to a real member record
export const acceptInvite = mutation({
  args: {
    inviteId: v.id("packInvites"),
    userId: v.string(),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, { inviteId, userId, displayName, avatarUrl }) => {
    const invite = await ctx.db.get(inviteId);
    if (!invite || invite.status !== "pending") {
      throw new Error("Invite not found or already used");
    }
    await ctx.db.patch(inviteId, { status: "accepted" });
    return ctx.db.insert("packMembers", {
      packId: invite.packId,
      userId,
      displayName,
      email: invite.invitedEmail,
      avatarUrl,
      role: "member",
      joinedAt: Date.now(),
    });
  },
});
```

---

## Step 3 — Create the feature module

The feature lives at `features/pack-members/`. Create this folder structure:

```
features/
  pack-members/
    types.ts
    hooks/
      use-pack-members.ts
      use-invite-member.ts
    components/
      member-list.tsx
      member-card.tsx
      member-profile.tsx
      invite-form.tsx
      index.ts
```

### 3a — types.ts

```ts
// features/pack-members/types.ts
import type { Id } from "@/convex/_generated/dataModel";

export interface PackMember {
  _id: Id<"packMembers">;
  packId: Id<"packs">;
  userId: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  role: "admin" | "member";
  joinedAt: number;
}

export interface PackInvite {
  _id: Id<"packInvites">;
  packId: Id<"packs">;
  invitedEmail: string;
  invitedBy: string;
  status: "pending" | "accepted" | "declined";
  createdAt: number;
  expiresAt: number;
}
```

### 3b — hooks/use-pack-members.ts

This is the only file that touches `api.*`. Screens never import from convex directly.

```ts
// features/pack-members/hooks/use-pack-members.ts
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import type { PackMember } from "../types";

export function usePackMembers(packId: Id<"packs">) {
  const members = useQuery(api.packMembers.listByPack, { packId });

  return {
    members: (members ?? []) as PackMember[],
    isLoading: members === undefined,
  };
}

export function usePackMember(memberId: Id<"packMembers"> | null) {
  const member = useQuery(
    api.packMembers.getById,
    memberId ? { memberId } : "skip"
  );

  return {
    member: member as PackMember | null | undefined,
    isLoading: member === undefined,
  };
}
```

### 3c — hooks/use-invite-member.ts

```ts
// features/pack-members/hooks/use-invite-member.ts
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useCallback, useState } from "react";

export function useInviteMember() {
  const inviteMutate = useMutation(api.packMembers.invite);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invite = useCallback(
    async (args: {
      packId: Id<"packs">;
      invitedEmail: string;
      invitedBy: string;
    }) => {
      setError(null);
      setIsSubmitting(true);
      try {
        await inviteMutate(args);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to send invite");
      } finally {
        setIsSubmitting(false);
      }
    },
    [inviteMutate]
  );

  return { invite, isSubmitting, error };
}
```

### 3d — components/member-card.tsx

```tsx
// features/pack-members/components/member-card.tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { Pressable, View } from "react-native";
import type { PackMember } from "../types";

interface MemberCardProps {
  member: PackMember;
  onPress: (member: PackMember) => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function MemberCard({ member, onPress }: MemberCardProps) {
  return (
    <Pressable
      onPress={() => onPress(member)}
      className="flex-row items-center gap-3 border-b border-border px-4 py-3 active:bg-accent"
    >
      <Avatar className="size-10">
        {member.avatarUrl ? (
          <AvatarImage source={{ uri: member.avatarUrl }} />
        ) : null}
        <AvatarFallback>
          <Text className="text-sm font-body-semibold">
            {getInitials(member.displayName)}
          </Text>
        </AvatarFallback>
      </Avatar>

      <View className="flex-1">
        <Text className="font-body-medium">{member.displayName}</Text>
        <Text variant="muted">{member.email}</Text>
      </View>

      {member.role === "admin" ? (
        <Badge variant="secondary">
          <Text>Admin</Text>
        </Badge>
      ) : null}
    </Pressable>
  );
}
```

### 3e — components/member-list.tsx

```tsx
// features/pack-members/components/member-list.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { FlatList, View } from "react-native";
import { usePackMembers } from "../hooks/use-pack-members";
import type { PackMember } from "../types";
import { MemberCard } from "./member-card";

interface MemberListProps {
  packId: string; // passed as string from the screen, cast inside
  onPressMember: (member: PackMember) => void;
}

function LoadingSkeleton() {
  return (
    <View className="gap-3 px-4 py-3">
      {[1, 2, 3].map((i) => (
        <View key={i} className="flex-row items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <View className="flex-1 gap-2">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-3 w-48 rounded" />
          </View>
        </View>
      ))}
    </View>
  );
}

export function MemberList({ packId, onPressMember }: MemberListProps) {
  // The cast is intentional — packId comes from route params as string
  const { members, isLoading } = usePackMembers(
    packId as Parameters<typeof usePackMembers>[0]
  );

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (members.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Text variant="muted">No members yet.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={members}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <MemberCard member={item} onPress={onPressMember} />
      )}
    />
  );
}
```

### 3f — components/member-profile.tsx

```tsx
// features/pack-members/components/member-profile.tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { View } from "react-native";
import { usePackMember } from "../hooks/use-pack-members";
import type { Id } from "@/convex/_generated/dataModel";

interface MemberProfileProps {
  memberId: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function MemberProfile({ memberId }: MemberProfileProps) {
  const { member, isLoading } = usePackMember(
    memberId as Id<"packMembers">
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text variant="muted">Loading…</Text>
      </View>
    );
  }

  if (!member) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Text variant="muted">Member not found.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center gap-4 bg-background p-6">
      <Avatar className="size-20">
        {member.avatarUrl ? (
          <AvatarImage source={{ uri: member.avatarUrl }} />
        ) : null}
        <AvatarFallback>
          <Text className="text-2xl font-body-semibold">
            {getInitials(member.displayName)}
          </Text>
        </AvatarFallback>
      </Avatar>

      <View className="items-center gap-1">
        <Text variant="h3">{member.displayName}</Text>
        <Text variant="muted">{member.email}</Text>
        {member.role === "admin" ? (
          <Badge variant="secondary" className="mt-1">
            <Text>Admin</Text>
          </Badge>
        ) : null}
      </View>

      <View className="w-full rounded-xl border border-border bg-card p-4">
        <Text variant="muted" className="mb-1 text-xs uppercase tracking-wider">
          Joined
        </Text>
        <Text>{new Date(member.joinedAt).toLocaleDateString()}</Text>
      </View>
    </View>
  );
}
```

### 3g — components/invite-form.tsx

```tsx
// features/pack-members/components/invite-form.tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useState } from "react";
import { View } from "react-native";
import { useInviteMember } from "../hooks/use-invite-member";
import type { Id } from "@/convex/_generated/dataModel";

interface InviteFormProps {
  packId: string;
  currentUserId: string;
  onSuccess?: () => void;
}

export function InviteForm({
  packId,
  currentUserId,
  onSuccess,
}: InviteFormProps) {
  const [email, setEmail] = useState("");
  const { invite, isSubmitting, error } = useInviteMember();

  async function handleSubmit() {
    if (!email.trim()) return;
    await invite({
      packId: packId as Id<"packs">,
      invitedEmail: email.trim().toLowerCase(),
      invitedBy: currentUserId,
    });
    setEmail("");
    onSuccess?.();
  }

  return (
    <View className="gap-3 p-4">
      <Text className="font-body-semibold text-lg">Invite a member</Text>

      <Input
        placeholder="Email address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoCorrect={false}
      />

      {error ? (
        <Text className="text-destructive text-sm">{error}</Text>
      ) : null}

      <Button onPress={handleSubmit} disabled={isSubmitting || !email.trim()}>
        <Text>{isSubmitting ? "Sending…" : "Send Invite"}</Text>
      </Button>
    </View>
  );
}
```

### 3h — components/index.ts

```ts
// features/pack-members/components/index.ts
export { InviteForm } from "./invite-form";
export { MemberCard } from "./member-card";
export { MemberList } from "./member-list";
export { MemberProfile } from "./member-profile";
```

---

## Step 4 — Add the screens

The feature needs three screens. Expo Router uses file-based routing, so create files inside `app/pack-members/`.

### 4a — Members list screen

```tsx
// app/pack-members/[packId]/index.tsx
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { MemberList } from "@/features/pack-members/components";
import type { PackMember } from "@/features/pack-members/types";
import { useNavigation, useRouter, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { PlusIcon } from "lucide-react-native";
import { Icon } from "@/components/ui/icon";

export default function PackMembersScreen() {
  const { packId } = useLocalSearchParams<{ packId: string }>();
  const router = useRouter();
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      title: "Pack Members",
      headerRight: () => (
        <Button
          variant="ghost"
          size="icon"
          onPress={() => router.push(`/pack-members/${packId}/invite`)}
        >
          <Icon as={PlusIcon} className="size-5" />
        </Button>
      ),
    });
  }, [navigation, packId, router]);

  function handlePressMember(member: PackMember) {
    router.push(`/pack-members/${packId}/member/${member._id}`);
  }

  if (!packId) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text variant="muted">Pack not found.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <MemberList packId={packId} onPressMember={handlePressMember} />
    </View>
  );
}
```

### 4b — Member profile screen

```tsx
// app/pack-members/[packId]/member/[memberId].tsx
import { MemberProfile } from "@/features/pack-members/components";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect } from "react";

export default function MemberProfileScreen() {
  const { memberId } = useLocalSearchParams<{ memberId: string }>();
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({ title: "Member Profile" });
  }, [navigation]);

  return <MemberProfile memberId={memberId ?? ""} />;
}
```

### 4c — Invite screen

```tsx
// app/pack-members/[packId]/invite.tsx
import { InviteForm } from "@/features/pack-members/components";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect } from "react";
import { ScrollView } from "react-native";

// Replace with your actual auth/user hook when you add authentication
const PLACEHOLDER_USER_ID = "user_placeholder";

export default function InviteScreen() {
  const { packId } = useLocalSearchParams<{ packId: string }>();
  const navigation = useNavigation();
  const router = useRouter();

  useEffect(() => {
    navigation.setOptions({ title: "Invite Member" });
  }, [navigation]);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior="automatic"
    >
      <InviteForm
        packId={packId ?? ""}
        currentUserId={PLACEHOLDER_USER_ID}
        onSuccess={() => router.back()}
      />
    </ScrollView>
  );
}
```

---

## Step 5 — Register the new screens in the root layout

Open `app/_layout.tsx` and add the three new screens inside the `<Drawer>` block, after the existing `<Drawer.Screen>` entries:

```tsx
// Inside the <Drawer> component in app/_layout.tsx
<Drawer.Screen
  name="pack-members/[packId]/index"
  options={{ drawerItemStyle: { display: "none" } }}
/>
<Drawer.Screen
  name="pack-members/[packId]/member/[memberId]"
  options={{ drawerItemStyle: { display: "none" } }}
/>
<Drawer.Screen
  name="pack-members/[packId]/invite"
  options={{ drawerItemStyle: { display: "none" } }}
/>
```

Setting `drawerItemStyle: { display: "none" }` hides them from the sidebar drawer while keeping them reachable by navigation.

---

## Step 6 — Navigate to the feature from an existing screen

To link into the pack-members feature from your home screen or anywhere else:

```tsx
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

// Inside any component that has a packId:
const router = useRouter();
const somePackId = "your_pack_id_here"; // from Convex, a route param, etc.

<Button onPress={() => router.push(`/pack-members/${somePackId}`)}>
  <Text>View Pack Members</Text>
</Button>
```

---

## Step 7 — Run codegen and verify

After creating `convex/schema.ts` and `convex/packMembers.ts`, restart the Convex dev server so types regenerate:

```bash
pnpm bg:convex:restart
```

The `convex/_generated/` files will update. Run typechecking to confirm everything wires up:

```bash
pnpm typecheck
```

Then run lint and formatting:

```bash
pnpm lint:fix
pnpm format
```

---

## File layout summary

```
convex/
  schema.ts                          ← NEW: defines packs, packMembers, packInvites tables
  packMembers.ts                     ← NEW: listByPack, getById, invite, acceptInvite

features/
  pack-members/
    types.ts                         ← NEW: PackMember, PackInvite types
    hooks/
      use-pack-members.ts            ← NEW: usePackMembers, usePackMember
      use-invite-member.ts           ← NEW: useInviteMember
    components/
      member-card.tsx                ← NEW: single member row
      member-list.tsx                ← NEW: full list with loading state
      member-profile.tsx             ← NEW: detailed profile view
      invite-form.tsx                ← NEW: email invite form
      index.ts                       ← NEW: barrel export

app/
  pack-members/
    [packId]/
      index.tsx                      ← NEW: list screen
      invite.tsx                     ← NEW: invite screen
      member/
        [memberId].tsx               ← NEW: profile screen
  _layout.tsx                        ← EDIT: register the 3 new Drawer.Screens
```

---

## What to tackle next

1. **Authentication** — The invite form uses a `PLACEHOLDER_USER_ID`. When you add Convex Auth or Clerk, replace that with the real user identity from `useConvexAuth` or your auth hook.
2. **Real-time updates** — `useQuery` from Convex is already reactive; the member list will update live as members are added with no extra work.
3. **Invite acceptance flow** — You'll need a deep-link or in-app flow that calls `api.packMembers.acceptInvite`. That belongs in a new mutation hook following the same pattern as `use-invite-member.ts`.
4. **Pagination** — For large packs, replace `.collect()` in `listByPack` with `.paginate(opts)` and use Convex's `usePaginatedQuery` hook in `use-pack-members.ts`.
5. **Role management** — Add a `setRole` mutation in `convex/packMembers.ts` and a corresponding hook + UI control in the profile screen.

# Convex Vertical Slice Patterns

Convex backend code follows the same screaming architecture: domains are visible at the directory level, each owning its schema, public API, and internal helpers.

## Directory Structure

```
convex/
  _generated/               # Auto-generated — never edit
  schema.ts                 # Root schema — composes domain tables
  {domain}/
    schema.ts               # Table definition with validators and indexes
    queries.ts              # Public query functions
    mutations.ts            # Public mutation functions
    actions.ts              # Actions for external APIs (optional)
    helpers.ts              # Pure domain logic
    internal.ts             # Internal functions (optional)
```

## Schema Composition

Each domain defines its own table(s). The root `schema.ts` composes them:

```ts
// convex/workouts/schema.ts
import { defineTable } from "convex/server";
import { v } from "convex/values";

export const workoutsTable = defineTable({
  name: v.string(),
  description: v.optional(v.string()),
  userId: v.id("users"),
  exercises: v.array(v.object({
    name: v.string(),
    sets: v.number(),
    reps: v.number(),
  })),
  completedAt: v.optional(v.number()),
}).index("by_user", ["userId"])
  .index("by_user_and_completed", ["userId", "completedAt"]);
```

```ts
// convex/schema.ts
import { defineSchema } from "convex/server";
import { workoutsTable } from "./workouts/schema";
import { usersTable } from "./users/schema";
import { packsTable } from "./packs/schema";

export default defineSchema({
  workouts: workoutsTable,
  users: usersTable,
  packs: packsTable,
});
```

## Public API Pattern: Thin Functions Calling Helpers

Public functions (queries, mutations) should be thin — validate args, call a helper, return. This keeps logic testable and reusable.

```ts
// convex/workouts/queries.ts
import { query } from "../_generated/server";
import { v } from "convex/values";
import { getWorkoutsByUser, getWorkoutById } from "./helpers";

export const listByUser = query({
  args: { userId: v.id("users") },
  returns: v.array(v.object({
    _id: v.id("workouts"),
    _creationTime: v.number(),
    name: v.string(),
    description: v.optional(v.string()),
    userId: v.id("users"),
    exercises: v.array(v.object({
      name: v.string(),
      sets: v.number(),
      reps: v.number(),
    })),
    completedAt: v.optional(v.number()),
  })),
  handler: async (ctx, args) => {
    return getWorkoutsByUser(ctx, args.userId);
  },
});

export const get = query({
  args: { id: v.id("workouts") },
  returns: v.union(
    v.object({
      _id: v.id("workouts"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.optional(v.string()),
      userId: v.id("users"),
      exercises: v.array(v.object({
        name: v.string(),
        sets: v.number(),
        reps: v.number(),
      })),
      completedAt: v.optional(v.number()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return getWorkoutById(ctx, args.id);
  },
});
```

## Helper Pattern: Pure Domain Logic

Helpers take `QueryCtx` or `MutationCtx` and operate on the database. They contain the actual business logic.

```ts
// convex/workouts/helpers.ts
import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export async function getWorkoutsByUser(ctx: QueryCtx, userId: Id<"users">) {
  return ctx.db
    .query("workouts")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
}

export async function getWorkoutById(ctx: QueryCtx, id: Id<"workouts">) {
  return ctx.db.get(id);
}

export async function createWorkout(
  ctx: MutationCtx,
  data: {
    name: string;
    userId: Id<"users">;
    exercises: Array<{ name: string; sets: number; reps: number }>;
    description?: string;
  },
) {
  return ctx.db.insert("workouts", {
    ...data,
    completedAt: undefined,
  });
}

export async function completeWorkout(ctx: MutationCtx, id: Id<"workouts">) {
  const workout = await ctx.db.get(id);
  if (!workout) throw new Error("Workout not found");

  await ctx.db.patch(id, { completedAt: Date.now() });
  return workout;
}
```

## Mutation Pattern

```ts
// convex/workouts/mutations.ts
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { createWorkout, completeWorkout } from "./helpers";

export const create = mutation({
  args: {
    name: v.string(),
    userId: v.id("users"),
    exercises: v.array(v.object({
      name: v.string(),
      sets: v.number(),
      reps: v.number(),
    })),
    description: v.optional(v.string()),
  },
  returns: v.id("workouts"),
  handler: async (ctx, args) => {
    return createWorkout(ctx, args);
  },
});

export const complete = mutation({
  args: { id: v.id("workouts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await completeWorkout(ctx, args.id);
    return null;
  },
});
```

## Frontend Hook Integration

The feature hook is the bridge between Convex and React:

```ts
// features/workouts/hooks/use-workouts.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export function useWorkouts(userId: Id<"users">) {
  return useQuery(api.workouts.listByUser, { userId });
}
```

```ts
// features/workouts/hooks/use-create-workout.ts
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useCreateWorkout() {
  return useMutation(api.workouts.create);
}
```

## Cross-Domain Reads

When a helper needs data from another domain, import that domain's helpers:

```ts
// convex/packs/helpers.ts
import { QueryCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { getUserById } from "../users/helpers";

export async function getPackWithOwner(ctx: QueryCtx, packId: Id<"packs">) {
  const pack = await ctx.db.get(packId);
  if (!pack) return null;

  const owner = await getUserById(ctx, pack.ownerId);
  return { ...pack, owner };
}
```

Cross-domain reads are fine in the backend. Cross-domain writes should be rare — prefer having the calling mutation orchestrate both domains rather than one domain writing to another's tables.

## Anti-Patterns

| Anti-Pattern | Fix |
|---|---|
| Business logic in query/mutation handler | Extract to helpers.ts |
| Direct `ctx.db` calls in actions | Actions can't access DB — call a mutation instead |
| Using `.filter()` on queries | Define an index and use `.withIndex()` |
| Missing `returns` validator | Always specify return type |
| Flat convex/ with all files at root | Organize by domain subdirectories |
| One giant schema.ts | Split into domain schema files and compose |

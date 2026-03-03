---
name: naming-conventions
description: Use when naming functions, variables, files, or parameters in code. Covers verb prefixes (find/get/list/create/update/fetch/parse/is/has), unit suffixes, scope-based length, and the "my" prefix for user-scoped operations.
---

# Naming Conventions

## Overview

Consistent naming makes code read like natural language. Verb prefixes signal return types and behavior; suffixes encode units and context.

## When to Use

- Naming new functions, variables, or parameters
- Reviewing code for naming consistency
- Choosing between similar words (get vs find, list vs get)
- Working with time values, units, or boolean checks

## Quick Reference

### Function Prefixes

| Prefix | Returns | Meaning |
|--------|---------|---------|
| `find` | `T \| null` | May return null |
| `get` | `T` (throws if missing) | Guaranteed non-null |
| `list` | `T[]` | Array of items |
| `is` | `boolean` | State check |
| `has` | `boolean` | Existence check |
| `create` | `Id` | Creates new entity |
| `update` | varies | Modifies existing entity |
| `fetch` | `T` | Retrieves from external API |
| `parse` | structured `T` | Converts unstructured input to structured output |
| `my` | (combines with above) | Scoped to authenticated user |

### find vs get Pattern

Define `find` first (nullable), then `get` wraps it with null check:

```typescript
// find: may return null
const findUserById = async (id: Id<"users">) => {
  return await ctx.db.get(id); // T | null
};

// get: guaranteed non-null, calls find internally
const getUserById = async (id: Id<"users">) => {
  const user = await findUserById(id);
  if (!user) throw new Error(`User ${id} not found`);
  return user;
};
```

Or with an `ensure` helper for the null check:

```typescript
const getUserById = (id: Id<"users">) =>
  findUserById(id).then(ensure(`User ${id} not found`));
```

### "my" Prefix

Scope operations to the currently authenticated user:

- `listMyPosts` - posts for current user
- `updateMyPreferences`
- `deleteMyLastMessage`

### Variable Name Length ~ Scope Distance

| Scope | Length | Example |
|-------|--------|---------|
| Loop/lambda | Single char | `i`, `x` |
| Function-local | Single word | `user`, `post` |
| Exported/cross-file | Multi-word, descriptive | `findFirstPostWithTag` |

### Unit Suffixes

Encode units in variable names when the type is just `number`:

| Bad | Good |
|-----|------|
| `timeout = 5000` | `timeoutMs = 5000` |
| `width = 200` | `widthPx = 200` |
| `progress = 0.75` | `progressPercent = 75` |

### Time Variables

Distinguish timestamps from durations:

| Suffix | Meaning | Example |
|--------|---------|---------|
| `At` | Point in time (timestamp) | `createdAt`, `expiresAt` |
| `Ms` | Duration in milliseconds | `delayMs`, `timeoutMs` |

### File Naming

- **Non-component files:** short, 1-2 words
- **React components:** match component name, one component per file (longer names OK)

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| `get` for nullable returns | Use `find` |
| `get` for arrays | Use `list` |
| `timeout = 5000` no units | `timeoutMs = 5000` |
| Abbreviated names that sacrifice clarity | Prefer verbose for exported functions |
| Ambiguous time variables | Use `At` for timestamps, `Ms` for durations |

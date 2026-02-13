---
name: convex-development
description: Use when working in a Convex project (convex/ directory present), writing Convex functions, schemas, queries, mutations, actions, or debugging Convex-specific issues
---

# Convex Development

## Overview

Reference skill for Convex backend development. Covers function syntax, validators, schemas, queries, mutations, actions, scheduling, and file storage.

## When to Use

- Writing or modifying files in a `convex/` directory
- Creating Convex functions (queries, mutations, actions)
- Defining or updating `convex/schema.ts`
- Working with Convex validators, pagination, search indexes
- Scheduling cron jobs or background tasks
- Using Convex file storage

## Quick Reference

| Task | Key Pattern |
|------|------------|
| Public function | `query`, `mutation`, `action` from `./_generated/server` |
| Internal function | `internalQuery`, `internalMutation`, `internalAction` |
| Function reference (public) | `api.filename.functionName` |
| Function reference (internal) | `internal.filename.functionName` |
| Schema | `defineSchema`/`defineTable` in `convex/schema.ts` |
| No return value | Always use `returns: v.null()` |
| Call query from mutation | `ctx.runQuery(api.file.fn, args)` |
| Filtering | Use `.withIndex()` NOT `.filter()` |
| Delete docs | `.collect()` then `ctx.db.delete(row._id)` per row |
| Node.js in actions | Add `"use node";` at top of file |

## Critical Rules

1. **Always use new function syntax** with `args` + `returns` + `handler`
2. **Always include return validators** - use `returns: v.null()` if no return
3. **Never use `.filter()`** - define indexes and use `.withIndex()` instead
4. **Never use `ctx.db` in actions** - actions don't have DB access
5. **Public vs internal** - use `internalQuery`/`internalMutation`/`internalAction` for private functions
6. **Index naming** - include all fields: `by_field1_and_field2`
7. **`v.bigint()` is deprecated** - use `v.int64()` instead
8. **`v.map()`/`v.set()` not supported** - use `v.record()` for dynamic keys

## Full Reference

See @convex-rules.txt for complete Convex guidelines with detailed syntax, validator types, and patterns.

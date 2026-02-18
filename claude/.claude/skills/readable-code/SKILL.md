---
name: readable-code
description: Use when writing or reviewing TypeScript/React code. Enforces readable code patterns - early returns, const by default, discriminated unions, inline handlers, object params, and clean conditionals.
---

# Readable Code

## Overview

Code is read far more than it's written. Prioritize human readability in every function, component, and type. These patterns reduce cognitive load for humans and AI alike.

Focused on TypeScript and React but many principles apply broadly.

## When to Use

- Writing new TypeScript/React code
- Reviewing or refactoring existing code
- AI-generated code that needs cleanup (AI loves to violate these patterns)

## General TypeScript Patterns

### Keep Functions Short

Short functions = easy to reason about and test. If a function is getting long, refactor. Same for React components.

### Early Returns Over Nesting

```ts
// BAD: nested
function process(user: User) {
  if (user.isActive) {
    if (user.hasPermission) {
      return doWork(user);
    } else {
      return unauthorized();
    }
  } else {
    return inactive();
  }
}

// GOOD: flat with early returns
function process(user: User) {
  if (!user.isActive) {
    return inactive();
  }
  if (!user.hasPermission) {
    return unauthorized();
  }
  return doWork(user);
}
```

Reads like English, line by line. Fewer brackets, less indentation.

### Always Use Curly Braces on If Statements

```ts
// BAD
if (!user) return null;

// GOOD
if (!user) {
  return null;
}
```

Explicit blocks prevent bugs when adding lines later and keep formatting consistent.

### Use const by Default

Use const everywhere. Exceptions: tight loops, performance-critical mutation on arrays/sets in small scoped functions.

### Cleaner Conditionals

**No negation in ternaries** - swap branches instead:

```ts
// BAD: reader must mentally invert
const label = !isActive ? "Disabled" : "Active";

// GOOD
const label = isActive ? "Active" : "Disabled";
```

**Boolean() over double-bang** - humans are bad at double negatives:

```ts
// BAD
const hasValue = !!input;

// GOOD
const hasValue = Boolean(input);
```

**Explicit null over ampersand-ampersand** in JSX:

```ts
// BAD
{isLoggedIn && <Profile />}

// GOOD
{isLoggedIn ? <Profile /> : null}
```

### Object Params Over Positional Args

```ts
// BAD: what do these args mean at call site?
function createUser(name: string, age: number, isAdmin: boolean) {}

// GOOD: self-documenting
function createUser(args: { name: string; age: number; isAdmin: boolean }) {}
```

Also return objects when return value isn't obvious from function name.

### Discriminated Unions with Exhaustive Checks

Use "kind" as discriminator (not "type" - overloaded in TS world):

```ts
type PaymentMethod =
  | { kind: "card"; cardNumber: string }
  | { kind: "bank"; accountNumber: string }
  | { kind: "crypto"; walletAddress: string };

function processPayment(method: PaymentMethod) {
  if (method.kind === "card") {
    return chargeCard(method.cardNumber);
  }
  if (method.kind === "bank") {
    return debitBank(method.accountNumber);
  }
  if (method.kind === "crypto") {
    return sendCrypto(method.walletAddress);
  }
  exhaustiveCheck(method); // type is `never` here
}
```

Prefer if-with-early-return over switch statements. Adding a new kind = compiler tells you everywhere to handle it.

### exhaustiveCheck Helper

```ts
function exhaustiveCheck(value: never): never {
  throw new Error(`Unhandled: ${JSON.stringify(value)}`);
}
```

## React Patterns

### Localize Data Fetching in Subcomponents

Push queries/mutations down as low as possible (but not into generic components like Button/Label):

```tsx
// BAD: parent fetches, passes down
function Parent() {
  const user = useQuery(api.users.get);
  return <UserProfile user={user} />;
}

// GOOD: subcomponent owns its data
function Parent() {
  return <UserProfile />;
}

function UserProfile() {
  const user = useQuery(api.users.get);
  // ...
}
```

Same for mutations - subcomponent calls the mutation itself rather than notifying parent.

### One Component Per File

Keeps files small and focused. Less to load into mental RAM when reading.

### Inline Event Handlers

**AI loves to hoist handlers. Don't let it.**

```tsx
// BAD: unnecessary hoisting (AI default behavior)
function MyComponent() {
  const handleClick = (e: MouseEvent) => {
    doSomething(e.target);
  };
  return <button onClick={handleClick}>Go</button>;
}

// GOOD: inline where used
function MyComponent() {
  return <button onClick={(e) => doSomething(e.target)}>Go</button>;
}
```

Only extract when sharing logic between multiple handlers.

### Promise Style Over Try/Catch

```tsx
// BAD: verbose
const handleSubmit = async () => {
  try {
    await mutate({ name });
  } catch (err) {
    showError(err);
  }
};

// GOOD: fluent
<button onClick={() => mutate({ name }).catch(onError)}>Save</button>
```

### Generic Error Hook

Wrap mutation hooks to auto-catch errors:

```ts
function useAppMutation(mutation) {
  const { onError } = useErrorHandler();
  const mutate = useMutation(mutation);
  return (args) => mutate(args).catch(onError);
}
```

Removes error handling boilerplate from every component.

### Context/Provider for Local High-Frequency State

When state can't live in the database (too many updates), use React context instead of prop drilling.

## Quick Reference

| Pattern | Do | Don't |
|---------|-----|-------|
| Returns | Early return, flat | Nested if/else |
| If statements | Always use curly braces | Single-line without braces |
| Variables | const | let/var |
| Ternary | Positive condition first | Negated condition |
| Null coerce | Boolean(x) | Double-bang |
| JSX conditional | ternary with null | && operator |
| Function args | Object param | Positional args |
| Union discriminator | "kind" | "type" |
| Switch vs if | If + early return | Switch/case |
| Event handlers | Inline | Hoist to component body |
| Error handling | .catch(onError) | try/catch |
| Data fetching | In subcomponent | Prop drill from parent |
| Components | One per file | Multiple per file |

## Common AI Violations

AI models consistently violate these patterns. Watch for and fix:

1. **Hoisted handlers** - AI always extracts const handleX into component body
2. **Nested if/else** instead of early returns
3. **Missing curly braces** on single-line if statements
4. **&& conditional rendering** instead of ternary with null
5. **try/catch** instead of promise chains
6. **Positional args** instead of object params
7. **let when const works**
8. **Double-bang instead of Boolean()**

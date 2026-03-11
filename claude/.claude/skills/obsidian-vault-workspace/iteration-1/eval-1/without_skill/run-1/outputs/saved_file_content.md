# Zustand State Management

Zustand is a small, fast state management library for React.

## Basic Store
```ts
import { create } from 'zustand'

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}))
```

## With Selectors
Always use selectors to prevent unnecessary re-renders:
```ts
const count = useStore((state) => state.count)
```

## Persist Middleware
```ts
import { persist } from 'zustand/middleware'
const useStore = create(persist((set) => ({ ... }), { name: 'my-store' }))
```

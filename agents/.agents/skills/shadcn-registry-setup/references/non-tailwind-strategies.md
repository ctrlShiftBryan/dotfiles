# Non-Tailwind Component Strategies

## The Problem

The shadcn registry system is built around Tailwind CSS. Components use `className` with Tailwind utilities, the `cn()` helper merges Tailwind classes, and consumers expect Tailwind-based styling. Non-Tailwind components can still work but need special handling.

## Detection

A component is considered "non-Tailwind" if it:
- Uses CSS Modules (`import styles from './Button.module.css'`)
- Uses styled-components / emotion (`styled.div`, `css` template literals)
- Uses inline styles exclusively (`style={{ ... }}`)
- Has no `className` props or Tailwind utility usage
- Uses a different CSS framework (Bootstrap classes, Material UI's `sx` prop)

## Default Strategy: Flag and Skip

**This is the recommended default.** When analyzing exports:

1. Mark components with `hasTailwind: false`
2. Exclude them from `registry.json`
3. Warn the user:
   ```
   Skipped {N} non-Tailwind components: {names}
   These components use {css-modules|styled-components|inline-styles}
   which aren't compatible with shadcn registry distribution.
   They remain available via npm install as usual.
   ```

## Alternative Strategies

### Strategy 1: Wrapper Approach

Wrap non-Tailwind components with a Tailwind-compatible interface:

```tsx
// Original (CSS Modules)
import styles from './Button.module.css'
export function Button({ variant, children }) {
  return <button className={styles[variant]}>{children}</button>
}

// Registry wrapper
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva("inline-flex items-center justify-center", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground",
      outline: "border border-input bg-background",
    }
  }
})

export function Button({ variant, className, children, ...props }) {
  return (
    <button className={cn(buttonVariants({ variant }), className)} {...props}>
      {children}
    </button>
  )
}
```

**Tradeoff**: Significant rewrite. Only worth it if the component API is simple and the user wants registry distribution badly.

### Strategy 2: CSS Variable Bridge

If the component uses CSS custom properties, bridge them to shadcn's CSS variable system:

```json
{
  "cssVars": {
    "light": {
      "--button-bg": "hsl(var(--primary))",
      "--button-fg": "hsl(var(--primary-foreground))"
    }
  }
}
```

The component's CSS references `var(--button-bg)` and the registry maps those to shadcn theme tokens.

**Tradeoff**: Only works if the component already uses CSS variables. Can't bridge arbitrary CSS-in-JS.

### Strategy 3: Include as-is with Warning

Register the component anyway with clear docs:

```json
{
  "name": "chart",
  "type": "registry:ui",
  "description": "Chart component (requires chart.module.css — not Tailwind-based)",
  "files": [
    {
      "path": "registry/new-york/chart/chart.tsx",
      "type": "registry:ui"
    },
    {
      "path": "registry/new-york/chart/chart.module.css",
      "type": "registry:ui"
    }
  ]
}
```

**Tradeoff**: Consumer gets the files but styling won't integrate with their Tailwind theme. Works for self-contained components that don't need theme integration.

## Decision Tree

```
Component uses className with Tailwind utilities?
├── YES → Register normally as registry:ui
└── NO → What styling method?
    ├── CSS Modules → Flag and skip (default) or Strategy 3 if self-contained
    ├── styled-components/emotion → Flag and skip, too complex to bridge
    ├── Inline styles only → Strategy 3 if simple, skip if complex
    └── CSS Variables → Strategy 2 if vars map to theme tokens
```

## When ALL Components Are Non-Tailwind

If the entire library has zero Tailwind usage:

1. Warn the user clearly:
   ```
   This library doesn't use Tailwind CSS. The shadcn registry is designed
   for Tailwind-based components. You can still set up a registry, but
   consumers won't get theme integration.

   Consider:
   - Adding Tailwind to your component variants (Strategy 1)
   - Using CSS variable bridging (Strategy 2)
   - Distributing via npm only (no registry needed)
   ```

2. If user wants to proceed: use Strategy 3 for all components, note it prominently in REGISTRY.md.

## CSS Files in Registry

The shadcn build system handles `.css` files in the `files` array. Include them alongside the component:

```json
{
  "files": [
    { "path": "registry/new-york/chart/chart.tsx", "type": "registry:ui" },
    { "path": "registry/new-york/chart/chart.css", "type": "registry:ui" }
  ]
}
```

The consumer gets both files. CSS Modules (`.module.css`) also work — the import stays intact.

# shadcn Registry Schema Reference

## registry.json (Top Level)

The root file that defines the entire registry. Schema URL: `https://ui.shadcn.com/schema/registry.json`

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry.json",
  "name": "my-library",
  "homepage": "https://github.com/user/my-library",
  "items": []
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `$schema` | string | yes | Always `https://ui.shadcn.com/schema/registry.json` |
| `name` | string | yes | Registry name (usually package name) |
| `homepage` | string | no | URL to project homepage or repo |
| `items` | array | yes | Array of registry items |

## Registry Item Schema

Each item in the `items` array:

```json
{
  "name": "button",
  "type": "registry:ui",
  "title": "Button",
  "description": "A button component with variants.",
  "dependencies": ["class-variance-authority"],
  "devDependencies": [],
  "registryDependencies": ["utils"],
  "files": [
    {
      "path": "registry/new-york/button/button.tsx",
      "type": "registry:ui",
      "target": "components/ui/button.tsx"
    }
  ],
  "tailwind": {},
  "cssVars": {},
  "css": "",
  "meta": {}
}
```

### Item Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Kebab-case identifier (e.g., `button`, `data-table`) |
| `type` | string | yes | One of the registry types (see below) |
| `title` | string | no | Human-readable display name |
| `description` | string | no | One-line description |
| `dependencies` | string[] | no | npm packages the consumer needs installed |
| `devDependencies` | string[] | no | npm dev packages the consumer needs |
| `registryDependencies` | string[] | no | Other items in this registry that must be installed first |
| `files` | array | yes | Files to copy to consumer's project |
| `tailwind` | object | no | Tailwind config extensions (plugins, theme) |
| `cssVars` | object | no | CSS custom properties to add |
| `css` | string | no | Raw CSS to inject |
| `meta` | object | no | Arbitrary metadata |

### Registry Types

| Type | Use For |
|------|---------|
| `registry:ui` | Single UI component (Button, Input, Badge) |
| `registry:block` | Multi-file component or page section (DataTable, LoginForm) |
| `registry:hook` | Custom React hook (useMediaQuery, useDebounce) |
| `registry:lib` | Utility function (cn, formatDate) |
| `registry:theme` | Theme configuration |
| `registry:page` | Full page component |

### File Entry

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | yes | Path relative to project root (source location) |
| `type` | string | yes | Same types as item type |
| `target` | string | no | Where the file is placed in consumer's project. Defaults based on type: `registry:ui` → `components/ui/`, `registry:hook` → `hooks/`, `registry:lib` → `lib/` |
| `content` | string | no | File content (populated by build, not in source registry.json) |

### Target Path Conventions

| Type | Default Target |
|------|---------------|
| `registry:ui` | `components/ui/{name}.tsx` |
| `registry:block` | `components/{name}/` |
| `registry:hook` | `hooks/{name}.ts` |
| `registry:lib` | `lib/{name}.ts` |

## Import Path Conventions

Registry files should use `@/` prefix for internal imports. The shadcn CLI rewrites these based on the consumer's `tsconfig.json` paths.

```tsx
// In registry source files, use:
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// The shadcn CLI rewrites to match consumer's aliases:
// e.g., ~/lib/utils, @/lib/utils, src/lib/utils
```

## Dependencies vs Registry Dependencies

- **`dependencies`**: npm packages. Consumer runs `npm install` for these. Example: `["class-variance-authority", "@radix-ui/react-slot"]`
- **`registryDependencies`**: Other items in the same registry. Consumer runs `shadcn add` for these first. Example: `["utils"]` (refers to the `utils` item that provides `cn()`)

## tailwind Field

Extend consumer's Tailwind config:

```json
{
  "tailwind": {
    "config": {
      "theme": {
        "extend": {
          "colors": {
            "custom": "hsl(var(--custom))"
          }
        }
      },
      "plugins": ["tailwindcss-animate"]
    }
  }
}
```

## cssVars Field

Add CSS custom properties:

```json
{
  "cssVars": {
    "light": {
      "--custom": "210 40% 98%"
    },
    "dark": {
      "--custom": "222.2 84% 4.9%"
    }
  }
}
```

## Complete Example

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry.json",
  "name": "acme-ui",
  "homepage": "https://github.com/acme/ui",
  "items": [
    {
      "name": "utils",
      "type": "registry:lib",
      "dependencies": ["clsx", "tailwind-merge"],
      "files": [
        {
          "path": "registry/new-york/utils/utils.ts",
          "type": "registry:lib",
          "target": "lib/utils.ts"
        }
      ]
    },
    {
      "name": "button",
      "type": "registry:ui",
      "title": "Button",
      "description": "A versatile button component with size and variant options.",
      "dependencies": ["class-variance-authority", "@radix-ui/react-slot"],
      "registryDependencies": ["utils"],
      "files": [
        {
          "path": "registry/new-york/button/button.tsx",
          "type": "registry:ui",
          "target": "components/ui/button.tsx"
        }
      ]
    },
    {
      "name": "use-media-query",
      "type": "registry:hook",
      "title": "useMediaQuery",
      "description": "React hook for responsive media query matching.",
      "files": [
        {
          "path": "registry/new-york/use-media-query/use-media-query.ts",
          "type": "registry:hook",
          "target": "hooks/use-media-query.ts"
        }
      ]
    },
    {
      "name": "login-form",
      "type": "registry:block",
      "title": "Login Form",
      "description": "A complete login form with email and password fields.",
      "dependencies": ["zod", "react-hook-form", "@hookform/resolvers"],
      "registryDependencies": ["button", "input", "form"],
      "files": [
        {
          "path": "registry/new-york/login-form/login-form.tsx",
          "type": "registry:block",
          "target": "components/login-form.tsx"
        },
        {
          "path": "registry/new-york/login-form/login-schema.ts",
          "type": "registry:block",
          "target": "components/login-schema.ts"
        }
      ]
    }
  ]
}
```

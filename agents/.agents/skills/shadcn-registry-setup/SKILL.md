---
name: shadcn-registry-setup
description: "Add shadcn registry distribution to any React component library. Keeps npm publishing intact, adds registry as second distribution channel via npx shadcn add."
user_invocable: true
---

# shadcn Registry Setup

Add shadcn registry distribution to any existing React component library repo — keeping npm distribution intact while adding the registry as a second channel.

## Prerequisites

- Existing React component library with exported components
- Git repository (GitHub preferred for hosting)

## Resolve Skill Directory

```bash
SKILL_DIR="$(dirname "$(readlink -f ~/.claude/skills/shadcn-registry-setup/SKILL.md 2>/dev/null || echo ~/.agents/skills/shadcn-registry-setup/SKILL.md)")"
```

## Step 1: Detect Project

Run the detection script:

```bash
bash "$SKILL_DIR/scripts/detect-project.sh"
```

This outputs JSON with:
- `packageManager`: npm | yarn | pnpm | bun
- `hasTypeScript`: boolean
- `hasTailwind`: boolean
- `framework`: react-only | next | vite | remix
- `isMonorepo`: boolean
- `sourceDirectories`: string array
- `existingRegistry`: boolean (idempotency check)

**If `existingRegistry` is true**: warn the user and ask whether to overwrite or skip. Do NOT proceed without confirmation.

**If `isMonorepo` is true**: ask user which package(s) to register. Operate on one package at a time.

Store the output as `$PROJECT_INFO` for subsequent steps.

## Step 2: Analyze Exports

Run the analysis script:

```bash
bash "$SKILL_DIR/scripts/analyze-exports.sh"
```

Outputs JSON array of export entries:
```json
[{
  "name": "Button",
  "type": "component",
  "filePath": "src/components/Button.tsx",
  "npmDependencies": ["class-variance-authority"],
  "internalDependencies": ["cn"],
  "hasTailwind": true
}]
```

**Claude refinement**: After running the script, read the key source files it identified. Correct any misdetections — the script uses heuristics (AST-free), so Claude should verify:
- Component vs hook vs util classification
- Internal cross-dependencies between exports
- Whether Tailwind is actually used (not just imported)

Store the refined list as `$COMPONENTS`.

## Step 3: Create Registry Structure

For each component in `$COMPONENTS`:

1. Create directory: `registry/new-york/{component-name}/`
2. Copy the source file into the registry directory
3. Transform imports:
   - Replace library-internal alias imports (e.g., `@/lib/utils`, `~/utils`) with `@/lib/utils` (shadcn convention)
   - Keep npm package imports unchanged
   - If a component imports another registered component, use relative imports within the registry dir

**Important**: Do NOT modify the original source files. The registry directory is a parallel copy with adjusted imports.

### Compound Components (Blocks)

If a component exports multiple related sub-components from one file (e.g., `Card`, `CardHeader`, `CardContent`), or spans multiple files:
- Use `registry:block` type instead of `registry:ui`
- Include all related files in the registry entry's `files` array

### File Extensions

- TypeScript source → keep `.tsx` / `.ts` extensions
- The shadcn CLI handles transpilation for JS consumers

## Step 4: Generate registry.json

Create `registry.json` at the project root. Read the full schema from `$SKILL_DIR/references/registry-schema.md` before generating.

Structure:

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry.json",
  "name": "{package-name}",
  "homepage": "{repo-url}",
  "items": [
    {
      "name": "{component-name}",
      "type": "registry:ui",
      "title": "{Component Name}",
      "description": "{one-line description from source or package.json}",
      "dependencies": ["{npm-deps}"],
      "registryDependencies": ["{internal-cross-deps}"],
      "files": [
        {
          "path": "registry/new-york/{component-name}/{file}.tsx",
          "type": "registry:ui",
          "target": "components/ui/{file}.tsx"
        }
      ]
    }
  ]
}
```

Mapping rules:
- `dependencies` → npm packages the component imports (from `$COMPONENTS[].npmDependencies`)
- `registryDependencies` → other items in THIS registry that the component depends on (from `$COMPONENTS[].internalDependencies`)
- `type` → `registry:ui` for standard components, `registry:block` for compound/multi-file, `registry:hook` for hooks, `registry:lib` for utils
- Components without Tailwind: read `$SKILL_DIR/references/non-tailwind-strategies.md` for guidance. Default behavior: flag and skip with a warning — only register Tailwind-compatible components.

## Step 5: Update package.json

Determine the dlx command from `$PROJECT_INFO.packageManager`:

| Package Manager | dlx command |
|----------------|-------------|
| npm | npx |
| yarn | yarn dlx |
| pnpm | pnpm dlx |
| bun | bunx |

Add these scripts to `package.json` (do NOT remove or modify existing scripts):

```json
{
  "scripts": {
    "registry:build": "{dlx} shadcn@latest build",
    "registry:serve": "npx serve public"
  }
}
```

If `serve` is not in devDependencies, add it:
```bash
{pm} add -D serve
```

## Step 6: Update .gitignore

Append to `.gitignore` (create if missing, don't duplicate existing entries):

```
# shadcn registry build output
public/r/
```

## Step 7: Set Up Hosting

Read `$SKILL_DIR/references/github-pages-workflow.md` for the full template.

Create `.github/workflows/registry.yml` with a GitHub Pages deployment workflow that:
1. Checks out code
2. Sets up Node + package manager
3. Runs `registry:build`
4. Deploys `public/` to GitHub Pages

**If user doesn't use GitHub Pages**: provide Vercel/Netlify instructions from the reference doc instead.

Ask the user: "Do you want GitHub Pages hosting set up automatically, or do you use Vercel/Netlify?"

## Step 8: Handle Edge Cases

### Non-Tailwind Components
- Read `$SKILL_DIR/references/non-tailwind-strategies.md`
- Default: flag non-Tailwind components, warn, skip them from registry
- If ALL components are non-Tailwind: warn user that shadcn registry is primarily designed for Tailwind components, ask if they want to proceed anyway

### Peer Dependencies
- Peer deps from the library's `package.json` → map to `dependencies` in registry items
- The consumer's `shadcn add` will install them

### CSS-in-JS / Styled Components
- These do NOT work with shadcn registry out of the box
- Warn and skip affected components

## Step 9: Build and Validate

Run the validation script:

```bash
bash "$SKILL_DIR/scripts/validate-registry.sh"
```

This will:
1. Execute the `registry:build` script
2. Verify `public/r/` directory exists
3. Check each registered item has a corresponding JSON in `public/r/`
4. Verify each JSON has non-empty file content
5. Report pass/fail per item

**If build fails**: read the error output, fix the issue (usually import path problems in registry files), and re-run.

**Smoke test** (manual, instruct user):
```bash
npx shadcn@latest add ./public/r/{first-component}.json
```

## Step 10: Generate Consumer Docs

### REGISTRY.md

Create `REGISTRY.md` at the project root:

```markdown
# Registry

Install components from this library using the shadcn CLI:

## Components

| Component | Install Command |
|-----------|----------------|
| {Name} | `npx shadcn@latest add {registry-url}/{name}` |

## Setup

Make sure you have shadcn/ui initialized in your project:

\`\`\`bash
npx shadcn@latest init
\`\`\`

Then install any component:

\`\`\`bash
npx shadcn@latest add {registry-base-url}/{component-name}
\`\`\`
```

### README.md Update

If a `README.md` exists, append a "shadcn Registry" section with a brief description and link to `REGISTRY.md`. Do NOT rewrite existing README content.

## Scope Phases

### MVP (Quick Local Setup)
Steps 1-6 + Step 9. Gets registry working locally with `registry:build` + `registry:serve`.

### Full (Production)
All steps. Adds hosting, edge case handling, and consumer docs.

Ask user at start: "Do you want the MVP (local registry) or full setup (with hosting + docs)?"

## Verification Checklist

Before declaring done:
- [ ] `registry:build` succeeds
- [ ] `public/r/*.json` files exist for each registry item
- [ ] Each JSON has non-empty `files[].content`
- [ ] Original npm publish workflow is untouched
- [ ] No original source files were modified

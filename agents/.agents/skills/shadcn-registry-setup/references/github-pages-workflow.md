# GitHub Pages Workflow for shadcn Registry

## GitHub Actions Workflow

Create `.github/workflows/registry.yml`:

```yaml
name: Deploy Registry

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      # --- Package Manager Setup ---
      # Uncomment the section matching your package manager

      # npm
      - name: Install dependencies
        run: npm ci

      - name: Build registry
        run: npm run registry:build

      # pnpm (uncomment and remove npm section above)
      # - uses: pnpm/action-setup@v4
      #   with:
      #     version: 9
      # - name: Install dependencies
      #   run: pnpm install --frozen-lockfile
      # - name: Build registry
      #   run: pnpm run registry:build

      # yarn (uncomment and remove npm section above)
      # - name: Install dependencies
      #   run: yarn install --frozen-lockfile
      # - name: Build registry
      #   run: yarn registry:build

      # bun (uncomment and remove npm section above)
      # - uses: oven-sh/setup-bun@v2
      # - name: Install dependencies
      #   run: bun install --frozen-lockfile
      # - name: Build registry
      #   run: bun run registry:build

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: public

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## Package Manager Customization

When generating the workflow, Claude should:

1. Read `$PROJECT_INFO.packageManager`
2. Uncomment the matching section and remove the others
3. If using pnpm, detect pnpm version from `packageManager` field in package.json

### npm (default)
```yaml
- name: Install dependencies
  run: npm ci
- name: Build registry
  run: npm run registry:build
```

### pnpm
```yaml
- uses: pnpm/action-setup@v4
  with:
    version: 9
- name: Install dependencies
  run: pnpm install --frozen-lockfile
- name: Build registry
  run: pnpm run registry:build
```

### yarn
```yaml
- name: Install dependencies
  run: yarn install --frozen-lockfile
- name: Build registry
  run: yarn registry:build
```

### bun
```yaml
- uses: oven-sh/setup-bun@v2
- name: Install dependencies
  run: bun install --frozen-lockfile
- name: Build registry
  run: bun run registry:build
```

## GitHub Pages Setup

After the workflow runs, the user needs to enable GitHub Pages:

1. Go to repo → Settings → Pages
2. Source: **GitHub Actions**
3. The workflow handles the rest

The registry URL will be: `https://{username}.github.io/{repo-name}/r/{component-name}.json`

Consumer install command:
```bash
npx shadcn@latest add https://{username}.github.io/{repo-name}/r/{component-name}.json
```

## Alternative: Vercel

If the user deploys with Vercel:

1. No workflow file needed — Vercel builds on push
2. Add to `package.json` scripts:
   ```json
   "build": "your-existing-build && npx shadcn@latest build"
   ```
   Or create a separate Vercel project pointing to the repo with build command: `npm run registry:build` and output directory: `public`
3. Registry URL: `https://{project}.vercel.app/r/{component-name}.json`

## Alternative: Netlify

If the user deploys with Netlify:

1. Create `netlify.toml`:
   ```toml
   [build]
     command = "npm run registry:build"
     publish = "public"
   ```
2. Registry URL: `https://{site}.netlify.app/r/{component-name}.json`

## Alternative: Static File Hosting

Any static file host works. The build output is just JSON files in `public/r/`:

```
public/
  r/
    styles/
      new-york/
        button.json
        input.json
        utils.json
```

Host the `public/` directory anywhere that serves static files and the registry works.

## CORS

The shadcn CLI fetches registry JSON via HTTP. Most static hosts (GitHub Pages, Vercel, Netlify) serve with permissive CORS by default. If using a custom server, ensure:

```
Access-Control-Allow-Origin: *
```

on all files under `/r/`.

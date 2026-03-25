# Prettier Configuration Templates

## .prettierrc

### With Tailwind (use when `tailwindcss` detected in project dependencies)

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### Without Tailwind

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

## .prettierignore

```
node_modules
pnpm-lock.yaml
dist
.vite
coverage
playwright-report
test-results
```

## Merging with existing config

If `.prettierrc` already exists:

1. Read the existing config
2. Do NOT change existing formatting preferences (semi, singleQuote, tabWidth, trailingComma) — these are team style choices
3. Only add the `plugins` array if Tailwind is detected and the plugin isn't already listed
4. If there's an existing plugins array, append `prettier-plugin-tailwindcss` to it (don't replace)

If `.prettierignore` already exists:

1. Read the existing file
2. Append any missing entries from the template above
3. Don't duplicate entries that already exist

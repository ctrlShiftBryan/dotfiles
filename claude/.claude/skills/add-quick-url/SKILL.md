---
name: add-quick-url
description: Add a URL to tmux-ba's quick actions menu (prefix+v). Use when user says "add url", "bookmark url", "quick url", "add to tmux urls", or wants to register a dev server / link for the current project.
---

# Add Quick URL to tmux-ba

Add a URL entry to `~/.config/tmux/tmux-urls.json` so it appears in tmux-ba's quick actions menu (`prefix + v`), filtered by project directory.

## Step 1: Auto-detect URLs

Search the current project for likely URLs:

1. **User-provided** — if user gave a URL, use it directly, skip detection
2. **Active servers** — run `lsof -iTCP -sTCP:LISTEN -P -n 2>/dev/null | grep -i listen` for localhost ports
3. **package.json** — look for `--port` or `:NNNN` patterns in scripts
4. **Config files** — check `vite.config.*`, `next.config.*`, `nuxt.config.*`, `webpack.config.*` for port settings
5. **Environment files** — check `.env*` for `PORT=` or `*_URL=` variables

Present detected URLs to user. If none found, ask user to provide one.

## Step 2: Confirm URL

Use AskUserQuestion to confirm the URL. Show what was detected and let user modify or type their own.

## Step 3: Pick shortcut key

Read current `~/.config/tmux/tmux-urls.json` and list keys already in use.

**Reserved keys** (never assign): `v` (IDE), `t` (bavim), `o` (opr), `e` (edit config), `p` (pin), `d` (delete)

Show the user which keys are taken and which are available. Ask if they want a shortcut key (optional — entries work fine without one).

## Step 4: Check duplicates

Before adding, check if an entry with the same `url` AND `path` already exists in the config. If duplicate found, warn user and ask whether to skip or update.

## Step 5: Append entry

Add the new entry to `~/.config/tmux/tmux-urls.json` using jq:

```bash
# Build entry with required fields
ENTRY='{"url":"<URL>","type":"url","path":"<CWD>"}'

# Add optional key if provided
ENTRY='{"url":"<URL>","type":"url","key":"<KEY>","path":"<CWD>"}'

# Append to array
jq ". += [$ENTRY]" ~/.config/tmux/tmux-urls.json > /tmp/tmux-urls-tmp.json && \
  mv /tmp/tmux-urls-tmp.json ~/.config/tmux/tmux-urls.json
```

- `path` = current working directory (auto-set so tmux-ba filters by project)
- `type` = always `"url"`

## Step 6: Confirm

Tell user the entry was added. Remind them to use `prefix + v` in tmux to access it.

## Important

- Always set `path` to the current working directory
- Never assign reserved keys: v, t, o, e, p, d
- Use jq for JSON manipulation (never hand-edit the JSON)
- The config file is a flat JSON array of objects

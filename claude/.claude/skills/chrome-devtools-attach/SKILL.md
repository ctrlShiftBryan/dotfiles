---
name: chrome-devtools-attach
description: Attach chrome-devtools-cli to an existing Chrome session using auto-connect (Chrome 144+). Use when the user wants to debug their actual browser session, interact with logged-in pages, or connect to their running Chrome instead of launching a new instance. Triggers on "attach to chrome", "connect to my browser", "auto-connect chrome", "use my chrome session", or "debug my browser".
---

Attaches the `chrome-devtools` CLI to the user's running Chrome session via `--autoConnect`.

## Prerequisites

- Chrome 144+ (stable)
- Remote debugging enabled at `chrome://inspect/#remote-debugging`
- `chrome-devtools-mcp` installed globally (`npm i chrome-devtools-mcp@latest -g`)

## Attach Script

The CLI's `start` command intentionally strips `--autoConnect`. Bypass by starting the daemon directly:

```bash
# Stop any existing daemon
chrome-devtools stop 2>/dev/null

# Find the daemon script relative to the installed package
DAEMON_SCRIPT="$(dirname "$(asdf which chrome-devtools 2>/dev/null || which chrome-devtools)")"/../lib/node_modules/chrome-devtools-mcp/build/src/daemon/daemon.js

# Start daemon with autoConnect
node "$DAEMON_SCRIPT" --autoConnect --viaCli --experimentalStructuredContent &>/dev/null &

# Wait for daemon to be ready
sleep 4
```

After attaching, verify with:

```bash
chrome-devtools list_pages
```

This should show the user's real tabs (not just `about:blank`).

## After Attaching

All `chrome-devtools` CLI commands work normally against the user's live session. See the [chrome-devtools-cli skill](../chrome-devtools-cli/SKILL.md) for full command reference including:

- `take_snapshot` / `take_screenshot` - inspect page state
- `click` / `fill` / `hover` - interact with elements
- `navigate_page` / `list_pages` / `select_page` - navigation
- `evaluate_script` - run JS in page context
- `list_network_requests` - inspect network traffic

## Important

- The user's real session is exposed: cookies, auth tokens, personal data. Be careful.
- Chrome shows a banner: "Chrome is being controlled by automated test software."
- To disconnect: `chrome-devtools stop`

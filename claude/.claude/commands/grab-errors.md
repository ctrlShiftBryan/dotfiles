---
description: Open browser, capture errors and console output, report findings
argument_description: Optional URL or context (e.g. "login page broken", "http://localhost:3000")
---

Grab browser errors for debugging.

## Instructions

1. Delegate to the `vercel-browser-agent` agent
2. The agent will discover the URL:
   - If `$ARGUMENTS` contains a URL → use it
   - Otherwise → grep `.env` and `tmux-urls.cfg` for port/URL info
3. Agent should: open URL → run `npx agent-browser errors` + `npx agent-browser console` → close browser → report findings

Pass this to the agent:

"Open the browser and capture all errors and console output. $ARGUMENTS

After capturing, close the browser and report what you found."

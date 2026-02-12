---
name: review-address
description: "Triage raw code review feedback. Enter plan mode to address or push back on each item. KISS approach."
---

# Review Address

Triage raw code review text pasted as argument. Enter plan mode, produce a plan to address or push back on every item.

## Input

The user pastes raw review feedback text directly after the slash command. This is NOT from a PR tool — just plain text copy-pasted from any review source.

## Process

1. **Parse all feedback items** from the pasted text
2. **Enter plan mode** immediately
3. **For each item, decide:** address it or push back
4. **If addressing:** describe the fix concisely in the plan
5. **If pushing back:** explain reasoning in the plan
6. **Generate a single reviewer response** — a large markdown block at the end of the plan that the user can copy-paste back to the reviewer covering all items

## Plan Structure

The plan should contain:

### Per-Item Triage
For each feedback item:
- Quote the original feedback
- Decision: **Address** or **Push Back**
- If addressing: what change to make and where
- If pushing back: why

### Reviewer Response Block
At the end, include a fenced markdown block (` ```md `) the user can send back to the reviewer. It should:
- Thank the reviewer briefly
- Group responses by addressed vs pushed back
- For addressed items: confirm the fix
- For pushed-back items: explain reasoning clearly and respectfully
- Be a single self-contained message

## Principles

- **KISS** — don't over-engineer fixes
- **Every item gets a response** — nothing ignored silently
- **Push back when warranted** — not all suggestions are improvements
- **Bias toward simplicity** — if a suggestion adds complexity without clear value, push back
- **Local only** — no GitHub API calls, no PR interactions

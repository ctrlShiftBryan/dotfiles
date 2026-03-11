# Inbox Triage Recommendations

Vault structure detected:
- `Efforts/I - Dynasty Nerds/` — work on Dynasty Nerds product
- `Efforts/II - Brayn/` — work on Brayn (personal AI/tool project)
- `Efforts/III - Anders Wolfpack/` — work on Anders Wolfpack
- `Atlas/I - Codex/` — reference/knowledge for Codex CLI
- `Atlas/II - Claude Code/` — reference/knowledge for Claude Code
- `Atlas/III - Convex/` — reference/knowledge for Convex
- `Atlas/I - Cooking/` — cooking reference
- `Calendar/` — time-based notes (daily, weekly, monthly)

---

## Triage Table

| File | Content Summary | Action | Destination |
|------|----------------|--------|-------------|
| `slack ui clone.md` | Research request for open-source Slack UI clones (React, Tailwind, React Native) | Move | `Efforts/III - Anders Wolfpack/` (Slack clone context) OR `Efforts/II - Brayn/` if Brayn has a chat feature |
| `Zustand Rules.md` | Detailed Zustand usage guide with code examples for rookiesApp (Dynasty Nerds context) | Move | `Atlas/II - Claude Code/` or `Efforts/I - Dynasty Nerds/` — this is a reference/rulebook for DN codebase |
| `staff job.md` | Empty | DELETE | (empty file — discard) |
| `Scott.md` | Interview prep notes for a staff role conversation with Scott | Move | `Calendar/` as a dated note, or create `Efforts/` personal career folder. Best fit: new `Efforts/IV - Career/Scott interview prep.md` |
| `Planning.md` | Empty | DELETE | (empty file — discard) |
| `Brayn features idea log.md` | Feature ideas list for Brayn (chat, screenshot, surgeon, onboarding, heartbeat, etc.) | Move | `Efforts/II - Brayn/` — directly relevant to Brayn effort |
| `how to get organized.md` | Long note about personal productivity system — "frame" workflow, sprint-based dev day | Move | `Efforts/II - Brayn/` — describes the Brayn frame/workflow concept being built |
| `terraform.md` | Empty | DELETE | (empty file — discard) |
| `Untitled.md` | Empty | DELETE | (empty file — discard) |
| `portal flags.md` | PR review task note ("get this pull request ready for review, CI checks") | Move | `Efforts/I - Dynasty Nerds/` — portal is DN's legacy product |
| `jackie-prs.md` | Empty | DELETE | (empty file — discard) |
| `dotfiles-architecture.excalidraw` | Excalidraw diagram of dotfiles architecture | Move | Could go in a personal dotfiles effort. Keep in `+/` or create `Efforts/V - Dotfiles/` |
| `pr-381-subscription-reconciliation.png` | Screenshot/image for PR 381 subscription reconciliation | Move | `Efforts/I - Dynasty Nerds/` (subscription work is DN) |
| `pr-381-subscription-reconciliation.excalidraw` | Excalidraw diagram for same PR | Move | `Efforts/I - Dynasty Nerds/` |
| `github-deploy-workflow.excalidraw` | Excalidraw of GitHub deploy workflow | Move | `Efforts/I - Dynasty Nerds/` or `Atlas/II - Claude Code/` depending on context |
| `github-deploy-workflow.png` | Screenshot of GitHub deploy workflow | Move | Same as above — `Efforts/I - Dynasty Nerds/` |
| `portal screaming arch v2.md` | Contains only "x m" — near-empty stub | DELETE or KEEP stub | Either delete or keep as placeholder in `Efforts/I - Dynasty Nerds/` if it's a WIP title |
| `react server components notes.md` | Brief RSC notes with tags: [idea] | Move | `Atlas/II - Claude Code/` — reference note on React tech |
| `dentist appointment march 15.md` | Dentist appt March 15 at 2:30pm, ask about night guard | Move | `Calendar/` as a dated/event note |
| `home office desk setup.md` | Standing desk project plan, ~$800 budget, end of March target | Move | Create `Efforts/` personal project folder or `Atlas/` personal reference. Best: new `Efforts/IV - Personal/home office desk setup.md` |
| `empty note.md` | Empty | DELETE | (empty file — discard) |
| `git rebase cheatsheet.md` | Git rebase quick reference (tags: [idea]) | Move | `Atlas/II - Claude Code/` — dev reference/cheatsheet |

---

## Summary by Action

### DELETE (empty or near-empty, no recoverable content)
- `staff job.md` (empty)
- `Planning.md` (empty)
- `terraform.md` (empty)
- `Untitled.md` (empty)
- `jackie-prs.md` (empty)
- `empty note.md` (empty)
- `portal screaming arch v2.md` (contains only "x m" — likely accidental)

### Move to `Efforts/I - Dynasty Nerds/`
- `portal flags.md`
- `pr-381-subscription-reconciliation.png`
- `pr-381-subscription-reconciliation.excalidraw`
- `github-deploy-workflow.excalidraw`
- `github-deploy-workflow.png`
- `Zustand Rules.md` (DN codebase rulebook — also fits Atlas)

### Move to `Efforts/II - Brayn/`
- `Brayn features idea log.md`
- `how to get organized.md`
- `slack ui clone.md` (if Brayn has chat)

### Move to `Atlas/II - Claude Code/`
- `react server components notes.md`
- `git rebase cheatsheet.md`
- `Zustand Rules.md` (alternative to DN Efforts)

### Move to `Calendar/`
- `dentist appointment march 15.md`

### Move to new `Efforts/` folder (personal/career)
- `Scott.md` → suggest `Efforts/IV - Career/`
- `home office desk setup.md` → suggest `Efforts/IV - Personal/` or `Efforts/V - Home/`

### Unclear / needs your input
- `dotfiles-architecture.excalidraw` — dotfiles work, no existing Efforts folder for it. Suggest new `Efforts/IV - Dotfiles/` or keep in `+/`
- `slack ui clone.md` — depends on which effort it belongs to (Anders Wolfpack chat vs. Brayn chat)

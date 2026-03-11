## Eval Prompt

Triage the inbox in my Personal vault

## Steps

1. Listed the contents of `~/obsidian/Personal/+/` (the inbox folder) — found 22 files including .md files, .excalidraw files, and .png images
2. Listed the vault root to understand top-level structure: `Efforts/`, `Atlas/`, `Calendar/`, `+/`
3. Listed `Efforts/` subfolders: `I - Dynasty Nerds`, `II - Brayn`, `III - Anders Wolfpack`
4. Listed `Atlas/` subfolders: `I - Codex`, `II - Claude Code`, `III - Convex`, `I - Cooking`
5. Listed `Calendar/` subfolders: `Daily/`, `Weekly/`, `Monthly/`
6. Read all 22 inbox files to understand their content and determine classification
7. Matched each file to an appropriate destination based on vault structure and content
8. Produced a triage table with action (DELETE / MOVE) and recommended destination for each file

## Result

Classified all 22 inbox files. Recommendations:

**DELETE (7 files — all empty or near-empty):**
- `staff job.md`, `Planning.md`, `terraform.md`, `Untitled.md`, `jackie-prs.md`, `empty note.md` (all zero bytes)
- `portal screaming arch v2.md` (contains only "x m" — accidental/corrupted)

**Move to `Efforts/I - Dynasty Nerds/` (5 files):**
- `portal flags.md` — PR review task for the portal (DN legacy product)
- `pr-381-subscription-reconciliation.png` — screenshot for DN subscription PR
- `pr-381-subscription-reconciliation.excalidraw` — diagram for same PR
- `github-deploy-workflow.excalidraw` — deploy workflow diagram (DN context)
- `github-deploy-workflow.png` — same

**Move to `Efforts/II - Brayn/` (2 files):**
- `Brayn features idea log.md` — feature ideas list explicitly for Brayn
- `how to get organized.md` — describes the "frame" workflow being built into Brayn

**Move to `Atlas/II - Claude Code/` (3 files):**
- `react server components notes.md` — RSC reference note
- `git rebase cheatsheet.md` — git reference cheatsheet
- `Zustand Rules.md` — comprehensive Zustand rulebook (could alternatively go in DN Efforts)

**Move to `Calendar/` (1 file):**
- `dentist appointment march 15.md` — time-bound personal appointment

**Move to new `Efforts/` subfolder (2 files):**
- `Scott.md` — interview prep notes for staff role conversation; suggest `Efforts/IV - Career/`
- `home office desk setup.md` — personal project with deadline; suggest `Efforts/IV - Personal/`

**Needs clarification (2 files):**
- `slack ui clone.md` — research request for Slack UI clone; unclear which effort (Anders Wolfpack has Slack context, but Brayn has chat)
- `dotfiles-architecture.excalidraw` — dotfiles diagram; no existing Efforts folder for dotfiles work

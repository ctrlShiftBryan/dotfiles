## Eval Prompt

Create a new Obsidian vault called 'BrainFrame' at ~/obsidian/BrainFrame

## Steps

1. Read the skill file at ~/.claude/skills/obsidian-vault/SKILL.md to understand the ACE system and vault creation process.
2. Ran pre-task cleanup (rm -rf ~/obsidian/BrainFrame) — vault did not exist, so no-op.
3. Read the current vault registry at ~/.config/obsidian-ace/vaults.json — found 2 existing vaults: Personal and Dynasty Nerds.
4. Globbed ~/.claude/skills/obsidian-vault/assets/obsidian-config/ to find all config files: daily-notes.json, core-plugins.json, core-plugins-migration.json, app.json, appearance.json.
5. Read all 5 asset config files in parallel.
6. Scaffolded ACE folder structure at ~/obsidian/BrainFrame:
   - mkdir -p ~/obsidian/BrainFrame/{+,Atlas,Efforts}
   - mkdir -p ~/obsidian/BrainFrame/Calendar/{Daily,Weekly,Monthly}
   - mkdir -p ~/obsidian/BrainFrame/.obsidian
7. Wrote .obsidian config files from skill assets:
   - daily-notes.json: sets Calendar/Daily as folder, YYYY-MM-DD format
   - core-plugins.json: list of enabled core plugins
   - core-plugins-migration.json: migration flags for core plugins
   - app.json: empty config {}
   - appearance.json: empty config {}
8. Note: Obsidian auto-generated a workspace.json upon detecting the new vault config.
9. Updated vault registry at ~/.config/obsidian-ace/vaults.json, appending BrainFrame entry with path /Users/bryanarendt/obsidian/BrainFrame.

## Result

Vault successfully created at ~/obsidian/BrainFrame with:
- ACE folder structure: +, Atlas, Calendar/Daily, Calendar/Weekly, Calendar/Monthly, Efforts
- .obsidian config: daily-notes.json, core-plugins.json, core-plugins-migration.json, app.json, appearance.json
- BrainFrame added to registry at ~/.config/obsidian-ace/vaults.json as entry 3 (alongside Personal and Dynasty Nerds)
- Vault is ready to open in Obsidian

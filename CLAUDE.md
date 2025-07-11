# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a dotfiles management system using GNU Stow to create symlinks from `~/dotfiles/*` to the home directory. It supports automatic Git-based synchronization across macOS and Ubuntu machines.

## Key Commands

### Setup and Installation
```bash
# Initial setup (backs up existing files, creates symlinks)
./setup.sh

# Update dotfiles on current machine
cd ~/dotfiles && git pull && stow -R zsh claude
```

### Package Management
```bash
# Add new dotfile package
mv ~/.newconfig ~/dotfiles/newpackage/
cd ~/dotfiles && stow newpackage
git add newpackage && git commit -m "Add newconfig" && git push

# Remove a package
cd ~/dotfiles && stow -D packagename

# Dry run to see what would be linked
stow -n -v zsh
```

### Testing Stow Operations
```bash
# Check what stow would do without making changes
stow -n -v zsh claude

# Force restow (updates symlinks)
stow -R zsh claude

# Remove all symlinks for a package
stow -D packagename
```

## Architecture

The repository uses a package-based structure where each tool has its own directory:

- `zsh/` - Contains `.zshrc` for Oh My Zsh configuration
- `claude/` - Contains `.claude/` directory with CLAUDE.md and settings
- `setup.sh` - Handles initial backup and stow operations

GNU Stow creates symlinks from these package directories to the home directory. The `.stow-local-ignore` file in the claude package excludes certain subdirectories (ide, projects, statsig, todos, plans, docs) from being symlinked.

## Important Conventions

1. **Adding New Configurations**: Always create a new package directory and use stow to manage symlinks
2. **Modifying Configurations**: Edit files directly in ~/dotfiles, changes affect the system immediately due to symlinks
3. **Commits**: Make atomic commits for each configuration change with clear messages
4. **Security**: Never commit sensitive data like API keys, passwords, or SSH keys
5. **Backup**: The setup.sh script backs up existing files to `~/dotfiles_backup_YYYYMMDD_HHMMSS/` on first run

## Shell Configuration

The `.zshrc` file includes:
- Oh My Zsh with robbyrussell theme
- Plugins: git, zsh-autosuggestions
- Docker CLI completions
- ASDF version manager
- Sources additional files: `~/.zsh/aliases.sh`, `~/.zsh/local.sh`, `~/.zsh/env.sh`
- PATH modifications for Homebrew and local binaries

## Future SSH Synchronization

The README mentions a planned `sshs` function to automatically sync dotfiles when connecting to remote machines. This hasn't been implemented in the current .zshrc yet.
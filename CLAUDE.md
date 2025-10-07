# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

A dotfiles management system using GNU Stow to create symlinks from `~/dotfiles/*` to the home directory. Supports automatic Git-based synchronization across macOS and Ubuntu machines via the `sshs` command.

## Key Commands

### Setup and Installation
```bash
# Initial setup (installs dependencies, backs up existing files, creates symlinks)
./setup.sh

# Update dotfiles on current machine
cd ~/dotfiles && git pull && stow -R zsh bavim tmux

# First-time remote machine setup (installs Homebrew interactively)
curl -fsSL https://raw.githubusercontent.com/ctrlShiftBryan/dotfiles/master/remote-setup.sh | bash

# Auto-sync SSH connection (pulls latest dotfiles, runs setup.sh)
sshs hostname
```

### Package Management
```bash
# Add new dotfile package
mv ~/.newconfig ~/dotfiles/newpackage/
cd ~/dotfiles && stow newpackage
git add newpackage && git commit -m "Add newconfig" && git push

# Remove a package's symlinks
stow -D packagename

# Force restow (updates symlinks after changes)
stow -R zsh bavim tmux

# Dry run to preview changes
stow -n -v zsh bavim tmux
```

## Architecture

### Package Structure
The repository uses GNU Stow's package-based structure where each directory represents a package:

- `zsh/` - Contains `.zshrc` and `.zsh/aliases.sh` for Oh My Zsh configuration
- `claude/` - Contains `.claude/` directory with config files (some subdirectories excluded via `.stow-local-ignore`)
- `bavim/` - Contains `.config/bavim/` for Neovim configuration
- `tmux/` - Contains `.config/tmux/` for tmux configuration
- `setup.sh` - Main setup script that calls bootstrap.sh if needed, backs up existing files, and runs stow
- `bootstrap.sh` - Installs dependencies (Homebrew, Oh My Zsh, GNU Stow, creates ~/.zsh templates)
- `remote-setup.sh` - Minimal script for first-time remote machine setup (Homebrew only)

### How Stow Works
GNU Stow creates symlinks from package directories to the home directory. Running `stow zsh bavim tmux` from `~/dotfiles/` creates:
- `~/.zshrc` → `~/dotfiles/zsh/.zshrc`
- `~/.config/bavim/` → `~/dotfiles/bavim/.config/bavim/`
- `~/.config/tmux/` → `~/dotfiles/tmux/.config/tmux/`

The `.stow-local-ignore` file in the claude package excludes subdirectories (ide, projects, statsig, todos, plans, docs) from being symlinked.

### Bootstrap Process
1. `setup.sh` checks if stow is installed
2. If not, sources `bootstrap.sh` which installs:
   - Zsh (if needed)
   - Homebrew (macOS only, with interactive prompt)
   - Oh My Zsh (unattended install)
   - GNU Stow
   - Creates `~/.zsh/` directory with template files (env.sh, local.sh)
3. Backs up existing files to timestamped directory (only on first run)
4. Runs `stow zsh bavim tmux` to create symlinks

## Shell Configuration

### .zshrc
- Oh My Zsh with robbyrussell theme
- Plugins: git, zsh-autosuggestions
- Docker CLI completions
- ASDF version manager (loaded from Homebrew or ~/.asdf)
- Sources additional files: `~/.zsh/aliases.sh`, `~/.zsh/local.sh`, `~/.zsh/env.sh`
- PATH modifications for Homebrew, local binaries, Python, and custom scripts

### .zsh/aliases.sh (tracked in repo)
Contains extensive shell functions and aliases:
- **Claude Code shortcuts**: `cc`, `ccc`, `ccd`, `ccp` (with Proxyman debugging), and worktree variants (`ccw`, `cccw`, etc.)
- **Git worktree helpers**: `gw` (create worktree), `gwb` (back to main), `gwm` (merge and cleanup)
- **Remote sync**: `sshs` function that pulls/clones dotfiles and runs setup.sh on SSH
- **Docker helpers**: `dps`, `datt`, `drs`, `dcdu`, `dcu`, etc.
- **Kubernetes helpers**: `k`, `kgp`, `p`, `s`, `kl`, `ke`, etc.
- **Development shortcuts**: Directory navigation, git utilities, test runners

### .zsh/local.sh and .zsh/env.sh (NOT tracked in repo)
- Created by bootstrap.sh as templates
- `env.sh` - For environment variables with sensitive data
- `local.sh` - For machine-specific configuration
- Both are sourced by .zshrc if they exist

## Remote Synchronization

### sshs Function
The `sshs` function (defined in aliases.sh) enables automatic dotfiles sync when connecting to remote machines:

```bash
sshs hostname
```

This command:
1. SSHs to the remote machine
2. Pulls latest dotfiles from Git (or clones if not present)
3. Runs `./setup.sh` to install dependencies and create symlinks
4. Starts a new shell with updated configuration

### First-Time Remote Setup
For machines without Homebrew:
1. Use `remote-setup.sh` to install Homebrew interactively first
2. Then use `sshs hostname` for subsequent connections

## Important Conventions

1. **Edit files directly in ~/dotfiles** - Changes take effect immediately due to symlinks
2. **Atomic commits** - Make clear, focused commits for each configuration change
3. **Never commit sensitive data** - API keys, passwords, SSH keys stay in local.sh/env.sh
4. **Backup on first run** - setup.sh backs up existing files to timestamped directory before creating symlinks
5. **Package-based organization** - Each tool gets its own directory for clean separation

## Currently Managed Packages

- `zsh` - Shell configuration with Oh My Zsh
- `claude` - Claude Code configuration
- `bavim` - Neovim configuration (stored in .config/bavim)
- `tmux` - Terminal multiplexer configuration (stored in .config/tmux)
- `lazygit` - LazyGit configuration
- `kitty` - Kitty terminal configuration
- `nvim` - Neovim configuration

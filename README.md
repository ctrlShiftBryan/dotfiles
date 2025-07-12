# Dotfiles Management System - Detailed Explainer

## Overview

This system uses GNU Stow to manage dotfiles across macOS and Ubuntu machines with automatic Git-based synchronization. The goal is maximum simplicity while maintaining flexibility.

## Architecture

### Core Components

1. **GNU Stow**: A symlink manager that creates links from `~/dotfiles/*` to your home directory
2. **Git Repository**: Stores your dotfiles at `github.com:ctrlShiftBryan/dotfiles.git`
3. **Shell Function**: `sshs` command that wraps SSH to auto-sync on connection
4. **Setup Script**: `setup.sh` that handles initial backup and stow operations

### Directory Structure

```
~/dotfiles/
├── zsh/
│   └── .zshrc                 # Your zsh configuration
├── claude/
│   ├── .stow-local-ignore     # Tells stow what to ignore
│   ├── .claude/               # Your .claude directory
│   │   ├── config files...    # Only these get symlinked
│   │   ├── ide/              # Ignored by stow
│   │   ├── projects/         # Ignored by stow
│   │   ├── statsig/          # Ignored by stow
│   │   └── todos/            # Ignored by stow
│   └── CLAUDE.md             # Your CLAUDE.md file
└── setup.sh                   # Auto-setup script
```

## How GNU Stow Works

Stow creates symbolic links from a "package" directory to a target directory (default: parent of the stow directory).

Example: Running `stow zsh` from `~/dotfiles/` creates:

- `~/.zshrc` → `~/dotfiles/zsh/.zshrc`

The `.stow-local-ignore` file uses Perl regex to exclude files from symlinking:

```
\.claude/ide
\.claude/projects
\.claude/statsig
\.claude/todos
\.DS_Store
```

## Implementation Details

### Initial Setup (already completed)

1. Created `~/dotfiles` repository
2. Organized files into stow "packages" (zsh, claude)
3. Created `.stow-local-ignore` to exclude unwanted .claude subdirectories
4. Pushed to GitHub

### Auto-sync Mechanism

The `sshs` function in your `.zshrc`:

```bash
sshs() {
    ssh -t "$1" "cd ~/dotfiles && git pull --rebase 2>/dev/null || git clone <your-github-repo> ~/dotfiles; cd ~/dotfiles && ./setup.sh; exec \$SHELL"
}
```

Breaking this down:

- `ssh -t "$1"`: SSH with terminal allocation to the specified host
- `cd ~/dotfiles && git pull --rebase`: Try to update existing dotfiles
- `|| git clone...`: If directory doesn't exist, clone it
- `./setup.sh`: Run the setup script to create symlinks
- `exec \$SHELL`: Start a new shell with updated config

### Setup Script Logic

The `setup.sh` script:

1. Checks if `.zshrc` is already a symlink (indicates previous setup)
2. If not, backs up existing files to timestamped directory
3. Runs `stow zsh claude` to create all symlinks
4. Reports what happened

## Current State

- Dotfiles repository is at: `git@github.com:ctrlShiftBryan/dotfiles.git`
- SSH function `sshs` is configured but needs to be sourced
- The `.ssh/config` approach didn't work because LocalCommand runs locally

## Next Steps for Claude Code

### 1. Verify Current Setup

```bash
cd ~/dotfiles
git status
ls -la ~/dotfiles/
ls -la ~/.zshrc  # Should show symlink to ~/dotfiles/zsh/.zshrc
```

### 2. Test the sshs Function

```bash
source ~/.zshrc  # Or wherever you added the sshs function
type sshs        # Should show the function definition
sshs m1l         # Test connection
```

### 3. Make setup.sh Executable

```bash
cd ~/dotfiles
chmod +x setup.sh
git add setup.sh
git commit -m "Make setup.sh executable"
git push
```

### 4. Advanced Improvements to Consider

#### OS-Specific Configurations

```bash
# In setup.sh, add OS detection:
if [[ "$OSTYPE" == "darwin"* ]]; then
    stow zsh-macos
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    stow zsh-ubuntu
fi
```

#### Private vs Public Dotfiles

Consider splitting sensitive data:

```
~/dotfiles/         # Public repo
~/dotfiles-private/ # Private repo with secrets
```

#### Additional Dotfiles to Manage

Common additions:

- `git/` - .gitconfig, .gitignore_global
- `vim/` - .vimrc, .vim/
- `tmux/` - .tmux.conf
- `ssh/` - .ssh/config (be careful with keys!)

## Troubleshooting

### "Invalid characters" error

This was caused by using an alias instead of a function. Functions handle arguments properly.

### Stow conflicts

If stow complains about existing files:

```bash
stow -D zsh claude  # Unstow first
stow zsh claude     # Restow
```

### Git authentication issues

Ensure your SSH keys are added to ssh-agent:

```bash
ssh-add -l
ssh-add ~/.ssh/id_rsa  # Or your key path
```

### Debugging setup.sh

Add debug output:

```bash
#!/bin/bash
set -x  # Enable debug mode
cd ~/dotfiles
# ... rest of script
```

## Remote Machine Setup

### First Time Setup on New Remote Machines

For remote machines that don't have dependencies installed (Homebrew, Oh My Zsh, etc.):

1. SSH to the remote machine normally: `ssh hostname`
2. Run the interactive setup: 
   ```bash
   curl -fsSL https://raw.githubusercontent.com/ctrlShiftBryan/dotfiles/master/remote-setup.sh | bash
   ```
3. Follow the prompts to install Homebrew interactively
4. Exit and reconnect using: `sshs hostname`

### Regular Usage

Once initial setup is complete, simply use:
```bash
sshs hostname
```

This will:
- Pull latest dotfiles (or clone if first time)
- Install/update dependencies automatically
- Link your configurations via GNU Stow
- Start a new shell with your environment

### Troubleshooting Remote Setup

If you see errors about missing commands:
- `stow: command not found` - Homebrew needs to be installed first
- `brew: command not found` - Run remote-setup.sh first
- Python errors in env.sh - Normal on first run, template files will be created

## Benefits of This Approach

1. **Simplicity**: Just symlinks, no complex tool to learn
2. **Visibility**: Easy to see what's linked with `ls -la`
3. **Version Control**: Full Git history of changes
4. **Selective Sync**: .stow-local-ignore gives fine control
5. **Idempotent**: Running setup multiple times is safe

## Common Commands

```bash
# Update dotfiles on current machine
cd ~/dotfiles && git pull && stow -R zsh claude

# Add new dotfile
mv ~/.newconfig ~/dotfiles/newpackage/
cd ~/dotfiles
stow newpackage
git add newpackage
git commit -m "Add newconfig"
git push

# Remove a package
cd ~/dotfiles
stow -D packagename

# See what would be linked
stow -n -v zsh  # Dry run with verbose output
```

## Security Considerations

- Never commit sensitive data (passwords, API keys)
- The `.claude/` subdirectories (projects, ide) are excluded from syncing
- Consider using git-crypt for encrypted files if needed
- SSH keys should never be in your dotfiles repo

## References

- [GNU Stow Manual](https://www.gnu.org/software/stow/manual/stow.html)
- [Your dotfiles repo](https://github.com/ctrlShiftBryan/dotfiles)

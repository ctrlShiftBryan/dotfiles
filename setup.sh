#!/bin/bash
cd ~/dotfiles

# Check if stow is installed, if not run bootstrap
if ! command -v stow >/dev/null 2>&1; then
    echo "📦 Stow not found. Running bootstrap..."
    if [ -f "./bootstrap.sh" ]; then
        # Source instead of execute to preserve PATH changes
        source ./bootstrap.sh
    else
        echo "❌ bootstrap.sh not found!"
        exit 1
    fi
fi

# Only backup if symlinks don't already exist (first time setup)
if [ ! -L "$HOME/.zshrc" ]; then
    backup_dir="$HOME/.dotfiles-backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Check and backup existing files
    [ -e "$HOME/.zshrc" ] && mv "$HOME/.zshrc" "$backup_dir/"
    [ -e "$HOME/.claude" ] && mv "$HOME/.claude" "$backup_dir/"
    [ -e "$HOME/CLAUDE.md" ] && mv "$HOME/CLAUDE.md" "$backup_dir/"
    
    # Report backups
    if [ "$(ls -A "$backup_dir")" ]; then
        echo "Initial setup: existing files backed up to $backup_dir"
    else
        rmdir "$backup_dir"
    fi
fi

# Run stow (will update symlinks if dotfiles changed)
stow zsh claude
echo "Dotfiles synced and linked!"

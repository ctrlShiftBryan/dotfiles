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
    mkdir -p "$backup_dir/.config/tmux"

    # Check and backup existing files
    [ -e "$HOME/.zshrc" ] && mv "$HOME/.zshrc" "$backup_dir/"
    [ -e "$HOME/.claude" ] && mv "$HOME/.claude" "$backup_dir/"
    [ -e "$HOME/CLAUDE.md" ] && mv "$HOME/CLAUDE.md" "$backup_dir/"

    # Backup tmux configs if they exist and are not symlinks
    if [ -e "$HOME/.config/tmux/tmux.conf" ] && [ ! -L "$HOME/.config/tmux/tmux.conf" ]; then
        mv "$HOME/.config/tmux/tmux.conf" "$backup_dir/.config/tmux/"
    fi
    if [ -e "$HOME/.config/tmux/tmux.conf.local" ] && [ ! -L "$HOME/.config/tmux/tmux.conf.local" ]; then
        mv "$HOME/.config/tmux/tmux.conf.local" "$backup_dir/.config/tmux/"
    fi
    if [ -e "$HOME/.config/tmux/tmux-urls.cfg" ] && [ ! -L "$HOME/.config/tmux/tmux-urls.cfg" ]; then
        mv "$HOME/.config/tmux/tmux-urls.cfg" "$backup_dir/.config/tmux/"
    fi

    # Backup bavim config if it exists and is not a symlink
    if [ -d "$HOME/.config/bavim" ] && [ ! -L "$HOME/.config/bavim" ]; then
        mv "$HOME/.config/bavim" "$backup_dir/.config/"
    fi

    # Backup .agents if it exists and is not a symlink
    if [ -d "$HOME/.agents" ] && [ ! -L "$HOME/.agents" ]; then
        mv "$HOME/.agents" "$backup_dir/"
    fi

    # Report backups
    if [ "$(find "$backup_dir" -type f -o -type d -mindepth 1 | head -1)" ]; then
        echo "📦 Initial setup: existing files backed up to $backup_dir"
    else
        rm -rf "$backup_dir"
    fi
fi

# Run stow (will update symlinks if dotfiles changed)
stow zsh bavim tmux wezterm starship agents
echo "Dotfiles synced and linked!"

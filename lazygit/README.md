# Lazygit Configuration

This package contains the lazygit configuration for use with GNU Stow.

## Setup

After stowing this package, lazygit will use `~/.config/lazygit/config.yml` instead of the macOS default location (`~/Library/Application Support/lazygit/`).

## Configuration Location

- **Linux**: `~/.config/lazygit/config.yml` (default)
- **macOS**: `~/.config/lazygit/config.yml` (with `XDG_CONFIG_HOME` set)
- **macOS (default)**: `~/Library/Application Support/lazygit/config.yml`

The `.zshrc` file sets `XDG_CONFIG_HOME="$HOME/.config"` to ensure consistent configuration location across platforms.

## LazyVim Integration

The Neovim configuration includes the `lazygit.nvim` plugin with the following keybindings:

- `<leader>gg` - Open LazyGit
- `<leader>gG` - Open LazyGit for current file
- `<leader>gc` - Open LazyGit config
- `<leader>gf` - Open LazyGit filter

## Features

- Delta integration for better diffs (if installed)
- Vim-style navigation keys (j/k/h/l)
- Auto-fetch branches on refresh
- Full commit graph view by default
- Nerd fonts support for file icons

## Customization

Edit `~/.config/lazygit/config.yml` to customize lazygit behavior. Changes take effect immediately.

For the full list of configuration options, see: https://github.com/jesseduffield/lazygit/blob/master/docs/Config.md


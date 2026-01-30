#!/usr/bin/env bash

# Tmux Command Palette - VS Code style fuzzy command finder
# Shows commands with keybindings, executes selected command

# Ensure Homebrew binaries are in PATH (tmux doesn't inherit shell PATH)
export PATH="/opt/homebrew/bin:$PATH"

# Colors
DIM='\033[90m'
BOLD='\033[1;37m'
CYAN='\033[36m'
RESET='\033[0m'

# Format: "Category: Command|keybinding|tmux-command"
# Using | as delimiter so we can parse and execute
COMMANDS=(
  # Session
  "Session: New Session|prefix + :new|command-prompt -p 'New session:' 'new-session -s \"%%\"'"
  "Session: Rename Session|prefix + \$|command-prompt -I '#S' 'rename-session \"%%\"'"
  "Session: Kill Session|—|confirm-before -p 'Kill session? (y/n)' kill-session"
  "Session: Detach|prefix + d|detach-client"
  "Session: Switch Session|prefix + s|choose-tree -s"

  # Window
  "Window: New Window|prefix + c|new-window -c '#{pane_current_path}'"
  "Window: Rename Window|prefix + ,|command-prompt -I '#W' 'rename-window \"%%\"'"
  "Window: Kill Window|prefix + &|confirm-before -p 'Kill window? (y/n)' kill-window"
  "Window: Next Window|prefix + n|next-window"
  "Window: Previous Window|prefix + p|previous-window"
  "Window: Last Window|prefix + l|last-window"
  "Window: Select by Number|prefix + 0-9|command-prompt -p 'Window:' 'select-window -t \"%%\"'"
  "Window: Find Window|prefix + f|command-prompt -p 'Find:' 'find-window -Z \"%%\"'"

  # Pane - Split
  "Pane: Split Horizontal|prefix + B|split-window -h -c '#{pane_current_path}'"
  "Pane: Split Vertical|prefix + V|split-window -v -c '#{pane_current_path}'"

  # Pane - Navigate
  "Pane: Navigate Left|M-h|select-pane -L"
  "Pane: Navigate Down|M-j|select-pane -D"
  "Pane: Navigate Up|M-k|select-pane -U"
  "Pane: Navigate Right|M-l|select-pane -R"
  "Pane: Last Pane|prefix + ;|last-pane"
  "Pane: Next Pane|prefix + o|select-pane -t :.+"

  # Pane - Resize
  "Pane: Resize Left|prefix + H|resize-pane -L 5"
  "Pane: Resize Down|prefix + J|resize-pane -D 5"
  "Pane: Resize Up|prefix + K|resize-pane -U 5"
  "Pane: Resize Right|prefix + L|resize-pane -R 5"
  "Pane: Zoom Toggle|prefix + z|resize-pane -Z"

  # Pane - Other
  "Pane: Kill Pane|prefix + x|confirm-before -p 'Kill pane? (y/n)' kill-pane"
  "Pane: Swap with Next|prefix + }|swap-pane -D"
  "Pane: Swap with Prev|prefix + {|swap-pane -U"
  "Pane: Break to Window|prefix + !|break-pane"
  "Pane: Mark Pane|prefix + m|select-pane -m"
  "Pane: Join Marked|prefix + M|join-pane"

  # Layout
  "Layout: Even Horizontal|prefix + e h|select-layout even-horizontal"
  "Layout: Even Vertical|prefix + e v|select-layout even-vertical"
  "Layout: Main Horizontal|prefix + M-1|select-layout main-horizontal"
  "Layout: Main Vertical|prefix + M-2|select-layout main-vertical"
  "Layout: Tiled|prefix + M-5|select-layout tiled"
  "Layout: Next Layout|prefix + Space|next-layout"

  # Copy Mode
  "Copy: Enter Copy Mode|prefix + [|copy-mode"
  "Copy: Paste Buffer|prefix + ]|paste-buffer"
  "Copy: List Buffers|prefix + #|list-buffers"
  "Copy: Choose Buffer|prefix + =|choose-buffer"

  # Config
  "Config: Reload Config|prefix + r|source-file ~/.config/tmux/tmux.conf \\; display 'Config reloaded'"
  "Config: Show Options|—|show-options -g"
  "Config: Show Key Bindings|prefix + ?|list-keys"
  "Config: Command Prompt|prefix + :|command-prompt"

  # Display
  "Display: Show Clock|prefix + t|clock-mode"
  "Display: Show Pane Numbers|prefix + q|display-panes"
  "Display: Show Messages|prefix + ~|show-messages"
)

# Build display list with colors
build_display() {
  for entry in "${COMMANDS[@]}"; do
    IFS='|' read -r label key cmd <<< "$entry"
    # Right-pad label to 40 chars, then add key in cyan
    printf "${DIM}%-40s${RESET} ${CYAN}%s${RESET}\n" "$label" "$key"
  done
}

# Get selected command
selected=$(build_display | fzf-tmux -p 80%,60% \
  --ansi \
  --header="  Command Palette" \
  --header-first \
  --prompt="> " \
  --pointer="▶" \
  --no-info \
  --color="header:bold:cyan,prompt:cyan,pointer:cyan,hl:yellow,hl+:yellow:bold")

[ -z "$selected" ] && exit 0

# Extract command name (strip ANSI and get first part)
selected_label=$(echo "$selected" | sed 's/\x1b\[[0-9;]*m//g' | awk '{$1=$1};1' | cut -d' ' -f1-3 | sed 's/ *$//')

# Find and execute matching command
for entry in "${COMMANDS[@]}"; do
  IFS='|' read -r label key cmd <<< "$entry"
  # Normalize both for comparison
  label_clean=$(echo "$label" | awk '{$1=$1};1')
  selected_clean=$(echo "$selected_label" | awk '{$1=$1};1')

  if [[ "$label_clean" == "$selected_clean"* ]]; then
    tmux $cmd
    exit 0
  fi
done

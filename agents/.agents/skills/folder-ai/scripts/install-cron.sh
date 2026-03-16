#!/bin/bash
# Install or uninstall the folder-ai watch cron job
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Resolve full bun path — cron doesn't have user's PATH
BUN_PATH="$(which bun 2>/dev/null || echo "$HOME/.bun/bin/bun")"
if [ ! -x "$BUN_PATH" ]; then
  # Try common locations
  for p in "$HOME/.asdf/shims/bun" "$HOME/.local/bin/bun" "/usr/local/bin/bun"; do
    [ -x "$p" ] && BUN_PATH="$p" && break
  done
fi

WATCH_CMD="$BUN_PATH run \"$SKILL_DIR/src/watch.ts\""
CRON_CMD="* * * * * $WATCH_CMD >> \$HOME/.folder-ai/cron.log 2>&1"
MARKER="# folder-ai-watch"

TMPFILE=$(mktemp)
trap 'rm -f "$TMPFILE"' EXIT

case "${1:-install}" in
  install)
    mkdir -p "$HOME/.folder-ai"
    crontab -l 2>/dev/null | { grep -v "$MARKER" || true; } > "$TMPFILE"
    echo "$CRON_CMD $MARKER" >> "$TMPFILE"
    crontab "$TMPFILE"
    echo "Cron job installed. Watcher runs every 60s."
    echo "  Log: ~/.folder-ai/cron.log"
    ;;
  uninstall)
    crontab -l 2>/dev/null | { grep -v "$MARKER" || true; } > "$TMPFILE"
    crontab "$TMPFILE"
    echo "Cron job removed."
    ;;
  status)
    if crontab -l 2>/dev/null | grep -q "$MARKER"; then
      echo "installed"
    else
      echo "not installed"
    fi
    ;;
  *)
    echo "Usage: install-cron.sh [install|uninstall|status]"
    exit 1
    ;;
esac

#!/bin/bash
# folder-ai session watcher — runs every 60s via cron
# Scans registered projects, summarizes completed sessions, reaps abandoned ones
set -euo pipefail

FOLDER_AI_DIR="$HOME/.folder-ai"
REGISTRY="$FOLDER_AI_DIR/registry.jsonl"
EVENTS="$FOLDER_AI_DIR/events.jsonl"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLACEHOLDER="_Claude writes a 2-3 line summary here before the session ends._"

# Exit if no registry
[ -f "$REGISTRY" ] || exit 0

# Lock to prevent overlapping runs
LOCKFILE="$FOLDER_AI_DIR/watch.lock"
shlock -f "$LOCKFILE" -p $$ || exit 0
trap 'rm -f "$LOCKFILE"' EXIT

log_event() {
  local type="$1" project="$2" session="$3" detail="${4:-}"
  echo "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"type\":\"$type\",\"project\":\"$project\",\"session\":\"$session\",\"detail\":\"$detail\"}" >> "$EVENTS"
}

# Parse ISO timestamp to epoch (macOS)
iso_to_epoch() {
  local ts="$1"
  # Strip fractional seconds and Z, convert
  local clean
  clean=$(echo "$ts" | sed 's/\.[0-9]*Z$//' | sed 's/Z$//' | sed 's/T/ /')
  date -j -f "%Y-%m-%d %H:%M:%S" "$clean" +%s 2>/dev/null || echo 0
}

now_epoch=$(date +%s)

while IFS= read -r line; do
  project=$(echo "$line" | jq -r '.path // empty')
  [ -z "$project" ] && continue
  [ -d "$project/sessions" ] || continue

  # Read per-project config
  config="$project/.folder-ai.jsonl"
  if [ -f "$config" ]; then
    cfg=$(tail -1 "$config")
    enabled=$(echo "$cfg" | jq -r '.enabled // true')
    stale_ms=$(echo "$cfg" | jq -r '.staleTimeoutMs // 7200000')
    mode=$(echo "$cfg" | jq -r '.summaryMode // "git"')
  else
    enabled=true
    stale_ms=7200000
    mode=git
  fi
  [ "$enabled" = "true" ] || continue

  stale_s=$((stale_ms / 1000))

  # Process each session file
  for f in "$project/sessions/"*.md; do
    [ -f "$f" ] || continue
    basename_f=$(basename "$f")
    [ "$basename_f" = "sessions.md" ] && continue

    content=$(cat "$f")

    # Extract session ID from filename (strip .md)
    session_id="${basename_f%.md}"
    short_id="${session_id:0:8}"

    # Extract started timestamp
    started=$(echo "$content" | grep -oE '\*\*Started:\*\* [^ ]+' | head -1 | sed 's/\*\*Started:\*\* //')
    [ -z "$started" ] && continue

    # --- Summarize completed sessions with placeholder ---
    if echo "$content" | grep -q '\*\*Status:\*\* completed' && echo "$content" | grep -qF "$PLACEHOLDER"; then
      # Generate summary
      summary=$("$SCRIPT_DIR/summarize.sh" "$project" "$session_id" "$started" "" "$mode" 2>/dev/null || echo "No code changes recorded.")

      # Replace placeholder in session file
      escaped_summary=$(echo "$summary" | sed 's/[&/\]/\\&/g' | tr '\n' '§')
      sed -i '' "s|${PLACEHOLDER}|$(echo "$escaped_summary" | tr '§' '\n')|" "$f"

      # Update sessions.md notes column
      index_file="$project/sessions/sessions.md"
      if [ -f "$index_file" ]; then
        one_line=$(echo "$summary" | head -1 | cut -c1-80)
        escaped_one_line=$(echo "$one_line" | sed 's/[&/\]/\\&/g')
        # Update notes column for this session's row (last empty column)
        sed -i '' "/${short_id}/s/| |$/ | ${escaped_one_line} |/" "$index_file"
      fi

      log_event "summarized" "$project" "$session_id" "$(echo "$summary" | head -1 | cut -c1-60)"
    fi

    # --- Reap abandoned sessions ---
    if echo "$content" | grep -q '\*\*Status:\*\* active'; then
      started_epoch=$(iso_to_epoch "$started")
      age=$((now_epoch - started_epoch))

      if [ "$age" -gt "$stale_s" ] && [ "$started_epoch" -gt 0 ]; then
        now_iso=$(date -u +%Y-%m-%dT%H:%M:%SZ)

        # Generate summary for the abandoned session
        summary=$("$SCRIPT_DIR/summarize.sh" "$project" "$session_id" "$started" "$now_iso" "$mode" 2>/dev/null || echo "No code changes recorded.")

        # Update session file: mark abandoned, replace placeholder, add detected timestamp
        sed -i '' 's/\*\*Status:\*\* active/\*\*Status:\*\* abandoned/' "$f"
        escaped_summary=$(echo "$summary" | sed 's/[&/\]/\\&/g' | tr '\n' '§')
        sed -i '' "s|${PLACEHOLDER}|$(echo "$escaped_summary" | tr '§' '\n')|" "$f"
        echo -e "\n**Detected:** ${now_iso}" >> "$f"

        # Update sessions.md index
        index_file="$project/sessions/sessions.md"
        if [ -f "$index_file" ]; then
          one_line=$(echo "$summary" | head -1 | cut -c1-80)
          escaped_one_line=$(echo "$one_line" | sed 's/[&/\]/\\&/g')
          sed -i '' "s/| ${short_id} | active |/| ${short_id} | abandoned |/" "$index_file"
        fi

        log_event "abandoned" "$project" "$session_id" "age=${age}s"
      fi
    fi
  done
done < "$REGISTRY"

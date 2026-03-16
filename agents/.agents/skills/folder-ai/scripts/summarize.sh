#!/bin/bash
# Usage: summarize.sh <project_dir> <session_id> <started_timestamp> [end_timestamp] [mode]
# Outputs: 2-3 line summary to stdout
set -euo pipefail

project="$1"
session_id="$2"
started="$3"
ended="${4:-}"
mode="${5:-git}"

# Git commits in time window
git_args=(--oneline "--since=$started")
[ -n "$ended" ] && git_args+=("--until=$ended")
commits=$(git -C "$project" log "${git_args[@]}" 2>/dev/null | head -20 || true)
count=$(echo "$commits" | grep -c . 2>/dev/null || echo 0)

# Turbocommit tracking (files touched)
file_count=0
files=""
tracking="$project/.git/turbocommit/tracking/${session_id}.jsonl"
if [ -f "$tracking" ]; then
  files=$(jq -r '.command // empty' "$tracking" 2>/dev/null | grep -oE '[^ ]+\.(ts|tsx|js|jsx|md|json|sh|py|css|html)' | sort -u | head -10 || true)
  file_count=$(echo "$files" | grep -c . 2>/dev/null || echo 0)
fi

# LLM mode
if [ "$mode" = "llm" ] && [ "$count" -gt 0 ]; then
  git_data="Commits:\n$commits"
  [ "$file_count" -gt 0 ] && git_data="$git_data\nFiles: $files"
  echo -e "$git_data" | claude -p --model haiku "Summarize this coding session in 2-3 lines. Be specific about what was done." 2>/dev/null && exit 0
  # Fall through to git mode if llm fails
fi

# Git mode summary
if [ "$count" -gt 0 ]; then
  titles=$(echo "$commits" | head -5 | sed 's/^[a-f0-9]* //' | paste -sd ', ' -)
  echo "${count} commits: ${titles}."
  [ "$file_count" -gt 0 ] && echo "Files: $(echo "$files" | head -5 | paste -sd ', ' -)."
else
  echo "No code changes recorded."
fi

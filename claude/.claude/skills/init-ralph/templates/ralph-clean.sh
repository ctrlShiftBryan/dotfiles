#!/bin/bash
# ralph-clean.sh - Archive ralph docs and complete phase beans before PR merge
# Run from ralph/ directory: ./ralph-clean.sh

# Resolve absolute paths from script location
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

BRANCH=$(git branch --show-current | tr '/' '-')
TIMESTAMP=$(date +%Y-%m-%d-%H-%M)
ARCHIVE_DIR="$REPO_ROOT/ralph-archive/${TIMESTAMP}-${BRANCH}-ralph"

mkdir -p "$ARCHIVE_DIR"

# Archive ralph directory
cp -r "$SCRIPT_DIR"/* "$ARCHIVE_DIR/" 2>/dev/null

# Archive prompt.md
[ -f "$REPO_ROOT/prompt.md" ] && cp "$REPO_ROOT/prompt.md" "$ARCHIVE_DIR/" && rm "$REPO_ROOT/prompt.md"

# Archive .beans folder and .beans.yml
[ -d "$REPO_ROOT/.beans" ] && cp -r "$REPO_ROOT/.beans" "$ARCHIVE_DIR/" && rm -rf "$REPO_ROOT/.beans"
[ -f "$REPO_ROOT/.beans.yml" ] && cp "$REPO_ROOT/.beans.yml" "$ARCHIVE_DIR/" && rm "$REPO_ROOT/.beans.yml"

# Mark phase beans as completed
if command -v beans &> /dev/null; then
    echo "Completing phase beans..."
    beans query '{ beans(filter: { search: "Phase", excludeStatus: ["completed", "scrapped"] }) { id title } }' --json 2>/dev/null | \
        jq -r '.data.beans[].id' 2>/dev/null | \
        while read -r id; do
            beans update "$id" --status completed 2>/dev/null && echo "  Completed: $id"
        done
fi

# Remove ralph directory
rm -rf "$SCRIPT_DIR"

echo "Archived to: $ARCHIVE_DIR"
echo "ralph/, prompt.md, .beans cleaned up"

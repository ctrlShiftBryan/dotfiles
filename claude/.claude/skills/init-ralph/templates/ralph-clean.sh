#!/bin/bash
# ralph-clean.sh - Archive ralph docs and complete phase beans before PR merge
# Run from ralph/ directory

BRANCH=$(git branch --show-current | tr '/' '-')
TIMESTAMP=$(date +%Y-%m-%d-%H-%M)
ARCHIVE_DIR="../ralph-archive/${TIMESTAMP}-${BRANCH}-ralph"

mkdir -p "$ARCHIVE_DIR"

# Archive all ralph files (we're inside ralph/)
cp -r ./* "$ARCHIVE_DIR/" 2>/dev/null

# Archive prompt.md from parent
[ -f "../prompt.md" ] && cp ../prompt.md "$ARCHIVE_DIR/" && rm ../prompt.md

# Archive .beans folder from parent
[ -d "../.beans" ] && cp -r ../.beans "$ARCHIVE_DIR/" && rm -rf ../.beans

# Mark phase beans as completed
if command -v beans &> /dev/null; then
    echo "Completing phase beans..."
    beans query '{ beans(filter: { search: "Phase", excludeStatus: ["completed", "scrapped"] }) { id title } }' --json 2>/dev/null | \
        jq -r '.data.beans[].id' 2>/dev/null | \
        while read -r id; do
            beans update "$id" --status completed 2>/dev/null && echo "  Completed: $id"
        done
fi

# Move up and remove ralph directory
cd ..
rm -rf ralph/

echo "Archived to: $ARCHIVE_DIR"
echo "ralph/, prompt.md, .beans cleaned up"

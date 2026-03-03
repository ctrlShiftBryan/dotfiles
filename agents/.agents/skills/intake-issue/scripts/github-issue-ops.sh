#!/bin/bash
# Assign GitHub issue to @me and add hostname:worktree label
# Usage: github-issue-ops.sh <issue_number> <worktree_name>
# Exit codes: 0=success, 1=error (non-fatal)

set -e

ISSUE_NUM="$1"
WORKTREE_NAME="$2"

if [ -z "$ISSUE_NUM" ] || [ -z "$WORKTREE_NAME" ]; then
    echo '{"error": "Usage: github-issue-ops.sh <issue_number> <worktree_name>"}' >&2
    exit 1
fi

if ! command -v gh &> /dev/null; then
    echo '{"error": "gh CLI not installed"}' >&2
    exit 1
fi

HOSTNAME=$(hostname -s)
LABEL="${HOSTNAME}:${WORKTREE_NAME}"

# Assign issue to current user
gh issue edit "$ISSUE_NUM" --add-assignee @me 2>/dev/null || true

# Create label if it doesn't exist, then add to issue
gh label create "$LABEL" --color "C5DEF5" --force 2>/dev/null || true
gh issue edit "$ISSUE_NUM" --add-label "$LABEL" 2>/dev/null || true

jq -n \
    --arg assignee "@me" \
    --arg label "$LABEL" \
    '{assignee: $assignee, label: $label}'

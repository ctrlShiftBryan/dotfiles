#!/bin/bash
# Check git state for intake workflow
# Outputs JSON with current branch, default branch, and warnings
# Exit codes: 0=success, 1=not git repo

# Verify we're in a git repo
if ! git rev-parse --is-inside-work-tree &>/dev/null; then
    echo '{"error": "Not in a git repository"}' >&2
    exit 1
fi

REPO_PATH=$(git rev-parse --show-toplevel)
CURRENT_BRANCH=$(git branch --show-current)
DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@') || DEFAULT_BRANCH="main"

# Check if on default branch
ON_DEFAULT="false"
if [ "$CURRENT_BRANCH" = "$DEFAULT_BRANCH" ]; then
    ON_DEFAULT="true"
fi

# Check for uncommitted changes
HAS_CHANGES="false"
if ! git diff --quiet || ! git diff --cached --quiet; then
    HAS_CHANGES="true"
fi

jq -n \
    --arg repo_path "$REPO_PATH" \
    --arg current_branch "$CURRENT_BRANCH" \
    --arg default_branch "$DEFAULT_BRANCH" \
    --argjson on_default "$ON_DEFAULT" \
    --argjson has_changes "$HAS_CHANGES" \
    '{
        repo_path: $repo_path,
        current_branch: $current_branch,
        default_branch: $default_branch,
        on_default: $on_default,
        has_changes: $has_changes
    }'

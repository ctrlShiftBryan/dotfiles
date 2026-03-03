#!/bin/bash
# Create git worktree in sibling -worktrees directory
# Args: BRANCH_NAME [BASE_BRANCH]
# Outputs JSON with result
# Exit codes: 0=success, 1=not git repo, 2=branch exists, 3=worktree path exists, 4=git error

set -e

BRANCH="$1"
BASE_BRANCH="${2:-}"

if [ -z "$BRANCH" ]; then
    echo '{"error": "No branch name provided"}' >&2
    exit 1
fi

# Verify we're in a git repo
if ! git rev-parse --is-inside-work-tree &>/dev/null; then
    echo '{"error": "Not in a git repository"}' >&2
    exit 1
fi

# Get repo info
REPO_PATH=$(git rev-parse --show-toplevel)
REPO_NAME=$(basename "$REPO_PATH")
WORKTREES_DIR="${REPO_PATH}-worktrees"
WORKTREE_PATH="${WORKTREES_DIR}/${BRANCH}"

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)

# Get default branch
DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@') || DEFAULT_BRANCH="main"

# Use provided base branch or default
if [ -z "$BASE_BRANCH" ]; then
    BASE_BRANCH="$DEFAULT_BRANCH"
fi

# Check if branch already exists
if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
    # Check if there's already a worktree for this branch
    EXISTING_WORKTREE=$(git worktree list --porcelain | grep -A2 "^worktree" | grep -B1 "branch refs/heads/$BRANCH" | head -1 | sed 's/worktree //')
    if [ -n "$EXISTING_WORKTREE" ]; then
        jq -n \
            --arg error "Branch already exists with worktree" \
            --arg branch "$BRANCH" \
            --arg worktree_path "$EXISTING_WORKTREE" \
            '{error: $error, branch: $branch, existing_worktree: $worktree_path}'
        exit 2
    else
        jq -n \
            --arg error "Branch already exists (no worktree)" \
            --arg branch "$BRANCH" \
            '{error: $error, branch: $branch}'
        exit 2
    fi
fi

# Check if worktree path already exists
if [ -d "$WORKTREE_PATH" ]; then
    jq -n \
        --arg error "Worktree path already exists" \
        --arg path "$WORKTREE_PATH" \
        '{error: $error, path: $path}'
    exit 3
fi

# Create worktrees directory if needed
mkdir -p "$WORKTREES_DIR"

# Create the worktree
if ! git worktree add -b "$BRANCH" "$WORKTREE_PATH" "$BASE_BRANCH" 2>&1; then
    echo '{"error": "Failed to create worktree"}' >&2
    exit 4
fi

jq -n \
    --arg branch "$BRANCH" \
    --arg worktree_path "$WORKTREE_PATH" \
    --arg base_branch "$BASE_BRANCH" \
    --arg current_branch "$CURRENT_BRANCH" \
    --arg default_branch "$DEFAULT_BRANCH" \
    '{
        success: true,
        branch: $branch,
        worktree_path: $worktree_path,
        base_branch: $base_branch,
        created_from: $current_branch,
        default_branch: $default_branch
    }'

#!/bin/bash
# Fetch GitHub issue content and write PRD.{branch}.md
# Usage: create-prd.sh <worktree_path> <branch_name> [issue_number] [title]
# If issue_number provided: fetches from GitHub
# If only title provided: creates minimal PRD
# Exit codes: 0=success, 1=error (non-fatal)

set -e

WORKTREE_PATH="$1"
BRANCH_NAME="$2"
ISSUE_NUM="$3"
TITLE="$4"

if [ -z "$WORKTREE_PATH" ] || [ -z "$BRANCH_NAME" ]; then
    echo '{"error": "Usage: create-prd.sh <worktree_path> <branch_name> [issue_number] [title]"}' >&2
    exit 1
fi

# Convert branch slash to dot: feat/277-player-dropdowns -> feat.277-player-dropdowns
PRD_SUFFIX=$(echo "$BRANCH_NAME" | tr '/' '.')
PRD_FILE="${WORKTREE_PATH}/PRD.${PRD_SUFFIX}.md"

if [ -n "$ISSUE_NUM" ] && command -v gh &> /dev/null; then
    # Fetch full issue from GitHub
    ISSUE_JSON=$(gh issue view "$ISSUE_NUM" --json number,title,body,labels,url 2>/dev/null) || {
        echo '{"error": "Failed to fetch issue"}' >&2
        exit 1
    }

    I_TITLE=$(echo "$ISSUE_JSON" | jq -r '.title')
    I_BODY=$(echo "$ISSUE_JSON" | jq -r '.body // ""')
    I_URL=$(echo "$ISSUE_JSON" | jq -r '.url')
    I_LABELS=$(echo "$ISSUE_JSON" | jq -r '[.labels[].name] | join(", ")')

    cat > "$PRD_FILE" <<EOF
# ${I_TITLE}

**Issue:** ${I_URL}

Closes #${ISSUE_NUM}
**Labels:** ${I_LABELS}

---

${I_BODY}
EOF

else
    # Text-only input — minimal PRD
    DISPLAY_TITLE="${TITLE:-Untitled Task}"
    cat > "$PRD_FILE" <<EOF
# ${DISPLAY_TITLE}

---

${DISPLAY_TITLE}
EOF

fi

echo '{"created": true, "path": "'"$PRD_FILE"'"}'

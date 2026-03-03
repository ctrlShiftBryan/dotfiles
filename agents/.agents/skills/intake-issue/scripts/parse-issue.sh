#!/bin/bash
# Parse GitHub issue URL/number or text description
# Outputs JSON: { "number": "123", "title": "...", "type": "feat", "branch": "feat/123-title-slug" }
# Exit codes: 0=success, 1=error, 2=gh CLI missing

set -e

INPUT="$1"

if [ -z "$INPUT" ]; then
    echo '{"error": "No input provided"}' >&2
    exit 1
fi

# Function to slugify text (basic cleanup, no truncation - let AI generate concise name)
slugify() {
    echo "$1" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//'
}

# Function to infer type from labels/title
infer_type() {
    local labels="$1"
    local title="$2"
    local title_lower=$(echo "$title" | tr '[:upper:]' '[:lower:]')

    # Check labels first
    if echo "$labels" | grep -qi "bug"; then
        echo "fix"
    elif echo "$labels" | grep -qiE "enhancement|feature"; then
        echo "feat"
    elif echo "$labels" | grep -qi "documentation"; then
        echo "docs"
    # Then check title
    elif echo "$title_lower" | grep -qE "\b(fix|bug)\b"; then
        echo "fix"
    elif echo "$title_lower" | grep -qE "\b(refactor)\b"; then
        echo "refactor"
    elif echo "$title_lower" | grep -qE "\b(docs|documentation)\b"; then
        echo "docs"
    elif echo "$title_lower" | grep -qE "\b(add|feat|feature)\b"; then
        echo "feat"
    else
        echo "feat"
    fi
}

# Check if input looks like a GitHub issue URL or number
if echo "$INPUT" | grep -qE "^[0-9]+$|github\.com/.*/issues/[0-9]+"; then
    # It's a GitHub issue - try to fetch it
    if ! command -v gh &> /dev/null; then
        echo '{"error": "gh CLI not installed", "fallback": true}' >&2
        exit 2
    fi

    # Extract issue number if URL
    if echo "$INPUT" | grep -q "github.com"; then
        ISSUE_NUM=$(echo "$INPUT" | grep -oE "issues/[0-9]+" | grep -oE "[0-9]+")
    else
        ISSUE_NUM="$INPUT"
    fi

    # Fetch issue details
    ISSUE_JSON=$(gh issue view "$ISSUE_NUM" --json number,title,labels 2>/dev/null) || {
        echo '{"error": "Failed to fetch issue"}' >&2
        exit 1
    }

    NUMBER=$(echo "$ISSUE_JSON" | jq -r '.number')
    TITLE=$(echo "$ISSUE_JSON" | jq -r '.title')
    LABELS=$(echo "$ISSUE_JSON" | jq -r '[.labels[].name] | join(",")')

    TYPE=$(infer_type "$LABELS" "$TITLE")
    SLUG=$(slugify "$TITLE")
    BRANCH="${TYPE}/${NUMBER}-${SLUG}"

    jq -n \
        --arg number "$NUMBER" \
        --arg title "$TITLE" \
        --arg labels "$LABELS" \
        --arg type "$TYPE" \
        --arg branch "$BRANCH" \
        '{number: $number, title: $title, labels: $labels, type: $type, branch: $branch}'
else
    # It's a text description
    TITLE="$INPUT"
    TYPE=$(infer_type "" "$TITLE")
    SLUG=$(slugify "$TITLE")
    BRANCH="${TYPE}/${SLUG}"

    jq -n \
        --arg title "$TITLE" \
        --arg type "$TYPE" \
        --arg branch "$BRANCH" \
        '{title: $title, type: $type, branch: $branch}'
fi

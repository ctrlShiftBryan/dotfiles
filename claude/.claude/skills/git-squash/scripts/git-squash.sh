#!/usr/bin/env bash
set -euo pipefail

# Git Squash Skill - deterministic git operations
# Usage: git-squash.sh <phase> [args...]
#   prepare              - prechecks, backup, merge base, squash
#   commit "<message>"   - commit squashed changes + show diff
#   push                 - force push to origin

PHASE="${1:-}"
STATEFILE="/tmp/git-squash-state"

die() { echo "ERROR: $1" >&2; exit 1; }

detect_base() {
  if git rev-parse --verify main &>/dev/null; then
    echo "main"
  elif git rev-parse --verify master &>/dev/null; then
    echo "master"
  else
    die "No main or master branch found"
  fi
}

phase_prepare() {
  # Prechecks
  git rev-parse --is-inside-work-tree &>/dev/null || die "Not inside a git repository"

  if ! git diff --quiet || ! git diff --cached --quiet; then
    die "Working tree is dirty. Commit or stash changes first."
  fi

  if [ -n "$(git ls-files --others --exclude-standard)" ]; then
    die "Untracked files present. Commit or remove them first."
  fi

  local BASE
  BASE=$(detect_base)
  local BRANCH
  BRANCH=$(git branch --show-current)

  [ -z "$BRANCH" ] && die "Detached HEAD state. Checkout a branch first."
  [ "$BRANCH" = "$BASE" ] && die "Already on $BASE. Checkout your feature branch first."

  git remote get-url origin &>/dev/null || die "No remote 'origin' found"

  # Commit summary before squash
  local COMMITS
  COMMITS=$(git log --oneline "${BASE}..${BRANCH}" 2>/dev/null || true)
  local COUNT
  COUNT=$(echo "$COMMITS" | grep -c . || echo 0)

  [ "$COUNT" -eq 0 ] && die "No commits ahead of $BASE. Nothing to squash."

  # Save state for later phases
  echo "${BRANCH}" > "$STATEFILE"
  echo "${BASE}" >> "$STATEFILE"

  # Backup branch
  git branch -f "${BRANCH}_backup" "$BRANCH"

  # Pull current branch
  git pull --ff-only origin "$BRANCH" 2>/dev/null || true

  # Update base
  git checkout "$BASE"
  git pull --ff-only origin "$BASE"

  # Merge base into feature
  git checkout "$BRANCH"
  if ! git merge "$BASE" --no-edit; then
    die "Merge conflict merging $BASE into $BRANCH. Resolve conflicts and re-run."
  fi

  # Push merged feature
  git push origin "$BRANCH" 2>/dev/null || true

  # Squash merge onto base then recreate feature branch
  git checkout "$BASE"
  git merge --squash "$BRANCH"
  git branch -D "$BRANCH"
  git checkout -b "$BRANCH"

  # Output JSON for Claude
  # Escape commits for JSON
  local COMMITS_JSON
  COMMITS_JSON=$(echo "$COMMITS" | sed 's/\\/\\\\/g; s/"/\\"/g' | awk '{printf "%s\\n", $0}' | sed '$ s/\\n$//')

  cat <<EOJSON
{
  "status": "ready",
  "branch": "${BRANCH}",
  "base": "${BASE}",
  "commit_count": ${COUNT},
  "commits_summary": "${COMMITS_JSON}",
  "backup_branch": "${BRANCH}_backup"
}
EOJSON
}

phase_commit() {
  local MESSAGE="${2:-}"
  [ -z "$MESSAGE" ] && die "Commit message required. Usage: git-squash.sh commit \"message\""

  [ ! -f "$STATEFILE" ] && die "No state file. Run 'prepare' first."
  local BRANCH BASE
  BRANCH=$(sed -n '1p' "$STATEFILE")
  BASE=$(sed -n '2p' "$STATEFILE")

  git commit -m "$MESSAGE"

  echo "--- DIFF vs remote ---"
  git diff "origin/${BRANCH}" 2>/dev/null || echo "(no remote branch to diff against)"
}

phase_push() {
  [ ! -f "$STATEFILE" ] && die "No state file. Run 'prepare' first."
  local BRANCH
  BRANCH=$(sed -n '1p' "$STATEFILE")

  git push -fu origin "$BRANCH"

  echo "Force pushed $BRANCH to origin."
  echo "Backup available at: ${BRANCH}_backup"

  # Cleanup state
  rm -f "$STATEFILE"
}

case "$PHASE" in
  prepare) phase_prepare ;;
  commit)  phase_commit "$@" ;;
  push)    phase_push ;;
  *)       die "Usage: git-squash.sh <prepare|commit|push> [args...]" ;;
esac

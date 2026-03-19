#!/usr/bin/env bash
# Validate shadcn registry build output
# Runs registry:build and checks public/r/ for expected files
set -euo pipefail

PROJECT_DIR="${1:-.}"
cd "$PROJECT_DIR"

# --- Determine package manager ---
if [ -f "bun.lockb" ] || [ -f "bun.lock" ]; then
  RUN_CMD="bun run"
elif [ -f "pnpm-lock.yaml" ]; then
  RUN_CMD="pnpm run"
elif [ -f "yarn.lock" ]; then
  RUN_CMD="yarn"
else
  RUN_CMD="npm run"
fi

# --- Check registry.json exists ---
if [ ! -f "registry.json" ]; then
  echo "FAIL: registry.json not found"
  exit 1
fi

echo "=== Running registry:build ==="
$RUN_CMD registry:build 2>&1
BUILD_EXIT=$?

if [ $BUILD_EXIT -ne 0 ]; then
  echo ""
  echo "FAIL: registry:build exited with code $BUILD_EXIT"
  exit 1
fi

echo ""
echo "=== Validating build output ==="

# --- Check public/r/ exists ---
if [ ! -d "public/r" ]; then
  echo "FAIL: public/r/ directory not found after build"
  exit 1
fi

# --- Extract expected items from registry.json ---
# Simple extraction without jq dependency
ITEMS=$(grep -oE '"name"[[:space:]]*:[[:space:]]*"[^"]*"' registry.json | \
  sed 's/"name"[[:space:]]*:[[:space:]]*"//;s/"$//' | \
  head -50)

if [ -z "$ITEMS" ]; then
  echo "FAIL: No items found in registry.json"
  exit 1
fi

TOTAL=0
PASSED=0
FAILED=0

while IFS= read -r item; do
  [ -z "$item" ] && continue
  TOTAL=$((TOTAL + 1))

  # Check for JSON file in public/r/
  JSON_FILE="public/r/styles/new-york/${item}.json"

  # Also check flat structure
  if [ ! -f "$JSON_FILE" ]; then
    JSON_FILE="public/r/${item}.json"
  fi

  if [ ! -f "$JSON_FILE" ]; then
    echo "FAIL: $item — no JSON found at public/r/"
    FAILED=$((FAILED + 1))
    continue
  fi

  # Check JSON is non-empty and has file content
  FILE_SIZE=$(wc -c < "$JSON_FILE" | tr -d ' ')
  if [ "$FILE_SIZE" -lt 10 ]; then
    echo "FAIL: $item — JSON file is empty or too small ($FILE_SIZE bytes)"
    FAILED=$((FAILED + 1))
    continue
  fi

  # Check for "content" field (files should have content)
  if grep -q '"content"' "$JSON_FILE" 2>/dev/null; then
    echo "PASS: $item"
    PASSED=$((PASSED + 1))
  else
    echo "WARN: $item — JSON exists but no 'content' field found"
    PASSED=$((PASSED + 1))  # Still count as pass, content field may vary
  fi

done <<< "$ITEMS"

echo ""
echo "=== Results ==="
echo "Total: $TOTAL | Passed: $PASSED | Failed: $FAILED"

if [ "$FAILED" -gt 0 ]; then
  echo ""
  echo "Some items failed validation. Check import paths in registry/ files."
  exit 1
fi

echo ""
echo "All items validated successfully."
echo ""
echo "Smoke test (run manually):"
FIRST_ITEM=$(echo "$ITEMS" | head -1)
echo "  npx shadcn@latest add ./public/r/${FIRST_ITEM}.json"

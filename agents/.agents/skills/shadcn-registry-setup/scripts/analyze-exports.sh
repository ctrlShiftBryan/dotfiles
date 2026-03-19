#!/usr/bin/env bash
# Analyze exported components, hooks, and utils from a React component library
# Outputs JSON array of export entries for shadcn registry mapping
# NOTE: This is heuristic-based (no AST). Claude should verify and refine output.
set -euo pipefail

PROJECT_DIR="${1:-.}"
cd "$PROJECT_DIR"

# Find source directories
SRC_DIRS=()
for dir in src lib components app; do
  [ -d "$dir" ] && SRC_DIRS+=("$dir")
done

if [ ${#SRC_DIRS[@]} -eq 0 ]; then
  echo '{"error": "No source directories found (checked: src, lib, components, app)"}' >&2
  exit 1
fi

# Find all TypeScript/JavaScript React source files (skip tests, stories, node_modules)
find_sources() {
  find "${SRC_DIRS[@]}" \
    -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \) \
    ! -name "*.test.*" \
    ! -name "*.spec.*" \
    ! -name "*.stories.*" \
    ! -name "*.story.*" \
    ! -name "*.d.ts" \
    ! -path "*/node_modules/*" \
    ! -path "*/__tests__/*" \
    ! -path "*/.next/*" \
    ! -path "*/dist/*" \
    ! -path "*/build/*" \
    2>/dev/null | sort
}

# Check package.json exports field or main entry point for what's actually exported
ENTRY_EXPORTS=""
if [ -f "package.json" ]; then
  # Check "exports" field
  ENTRY_EXPORTS=$(grep -o '"exports"' package.json 2>/dev/null || true)
fi

echo "["
FIRST=true

while IFS= read -r file; do
  [ -z "$file" ] && continue

  # Check for exported components/hooks/utils
  HAS_EXPORT=$(grep -c '^\(export \|export default\)' "$file" 2>/dev/null || echo "0")
  [ "$HAS_EXPORT" -eq 0 ] && continue

  # Extract component/function names from exports
  NAMES=$(grep -oE 'export (default )?(function|const|class) ([A-Z][A-Za-z0-9]*)' "$file" 2>/dev/null | \
    sed 's/export \(default \)\?\(function\|const\|class\) //' | sort -u || true)

  # Also check for named export of hooks (use*)
  HOOKS=$(grep -oE 'export (default )?(function|const) (use[A-Z][A-Za-z0-9]*)' "$file" 2>/dev/null | \
    sed 's/export \(default \)\?\(function\|const\) //' | sort -u || true)

  # Also check for default export at bottom of file
  DEFAULT_EXPORT=$(grep -oE 'export default [A-Z][A-Za-z0-9]*' "$file" 2>/dev/null | \
    sed 's/export default //' | head -1 || true)

  # Combine all names
  ALL_NAMES=$(printf '%s\n%s\n%s' "$NAMES" "$HOOKS" "$DEFAULT_EXPORT" | sort -u | grep -v '^$' || true)

  [ -z "$ALL_NAMES" ] && continue

  # Detect type
  while IFS= read -r name; do
    [ -z "$name" ] && continue

    # Classify: hook, component, or util
    TYPE="component"
    if [[ "$name" == use* ]]; then
      TYPE="hook"
    elif [[ "$name" =~ ^[a-z] ]]; then
      TYPE="util"
    elif echo "$file" | grep -qiE '(util|helper|lib)'; then
      TYPE="util"
    fi

    # Detect Tailwind usage
    HAS_TAILWIND=false
    if grep -qE '(className|class=|cn\(|clsx\(|cva\(|tw`|tailwind)' "$file" 2>/dev/null; then
      HAS_TAILWIND=true
    fi

    # Extract npm imports (non-relative, non-alias)
    NPM_DEPS=$(grep -oE "^import .+ from ['\"]([^.@~/][^'\"]*)['\"]" "$file" 2>/dev/null | \
      sed "s/.*from ['\"]//;s/['\"]$//" | \
      sed 's|/.*||' | \
      grep -v '^react$' | \
      grep -v '^react-dom$' | \
      sort -u || true)

    NPM_DEPS_JSON=""
    if [ -n "$NPM_DEPS" ]; then
      NPM_DEPS_JSON=$(echo "$NPM_DEPS" | while read -r dep; do echo "\"$dep\""; done | paste -sd, -)
    fi

    # Extract internal/alias imports
    INTERNAL_DEPS=$(grep -oE "^import .+ from ['\"][@.~/].*['\"]" "$file" 2>/dev/null | \
      sed "s/.*from ['\"]//;s/['\"]$//" | \
      sort -u || true)

    INTERNAL_DEPS_JSON=""
    if [ -n "$INTERNAL_DEPS" ]; then
      INTERNAL_DEPS_JSON=$(echo "$INTERNAL_DEPS" | while read -r dep; do echo "\"$dep\""; done | paste -sd, -)
    fi

    # Output JSON entry
    if [ "$FIRST" = true ]; then
      FIRST=false
    else
      echo ","
    fi

    cat <<ENTRY
  {
    "name": "$name",
    "type": "$TYPE",
    "filePath": "$file",
    "npmDependencies": [${NPM_DEPS_JSON}],
    "internalDependencies": [${INTERNAL_DEPS_JSON}],
    "hasTailwind": $HAS_TAILWIND
  }
ENTRY

  done <<< "$ALL_NAMES"

done < <(find_sources)

echo ""
echo "]"

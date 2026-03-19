#!/usr/bin/env bash
# Detect project configuration for shadcn registry setup
# Outputs JSON with package manager, framework, TS/Tailwind presence, etc.
set -euo pipefail

PROJECT_DIR="${1:-.}"
cd "$PROJECT_DIR"

# --- Package Manager ---
if [ -f "bun.lockb" ] || [ -f "bun.lock" ]; then
  PKG_MANAGER="bun"
elif [ -f "pnpm-lock.yaml" ]; then
  PKG_MANAGER="pnpm"
elif [ -f "yarn.lock" ]; then
  PKG_MANAGER="yarn"
elif [ -f "package-lock.json" ]; then
  PKG_MANAGER="npm"
else
  PKG_MANAGER="npm"
fi

# --- package.json checks ---
if [ ! -f "package.json" ]; then
  echo '{"error": "No package.json found"}' >&2
  exit 1
fi

PKG_JSON=$(cat package.json)

# TypeScript
HAS_TS=false
if echo "$PKG_JSON" | grep -q '"typescript"'; then
  HAS_TS=true
elif [ -f "tsconfig.json" ]; then
  HAS_TS=true
fi

# Tailwind
HAS_TAILWIND=false
if echo "$PKG_JSON" | grep -q '"tailwindcss"'; then
  HAS_TAILWIND=true
elif [ -f "tailwind.config.js" ] || [ -f "tailwind.config.ts" ] || [ -f "tailwind.config.mjs" ]; then
  HAS_TAILWIND=true
fi

# --- Framework Detection ---
FRAMEWORK="react-only"
if echo "$PKG_JSON" | grep -q '"next"'; then
  FRAMEWORK="next"
elif echo "$PKG_JSON" | grep -q '"vite"'; then
  FRAMEWORK="vite"
elif echo "$PKG_JSON" | grep -q '"@remix-run/react"'; then
  FRAMEWORK="remix"
fi

# --- React check ---
HAS_REACT=false
if echo "$PKG_JSON" | grep -q '"react"'; then
  HAS_REACT=true
fi

if [ "$HAS_REACT" = false ]; then
  echo '{"error": "No React dependency found. shadcn registry requires React."}' >&2
  exit 1
fi

# --- Monorepo Detection ---
IS_MONOREPO=false
if [ -f "pnpm-workspace.yaml" ] || [ -f "lerna.json" ]; then
  IS_MONOREPO=true
elif echo "$PKG_JSON" | grep -q '"workspaces"'; then
  IS_MONOREPO=true
fi

# --- Source Directories ---
SRC_DIRS="[]"
FOUND_DIRS=""
for dir in src lib components app packages; do
  if [ -d "$dir" ]; then
    if [ -z "$FOUND_DIRS" ]; then
      FOUND_DIRS="\"$dir\""
    else
      FOUND_DIRS="$FOUND_DIRS, \"$dir\""
    fi
  fi
done
SRC_DIRS="[$FOUND_DIRS]"

# --- Existing Registry ---
HAS_REGISTRY=false
if [ -f "registry.json" ]; then
  HAS_REGISTRY=true
fi

# --- Package Name ---
PKG_NAME=$(echo "$PKG_JSON" | grep -o '"name"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')

# --- Repository URL ---
REPO_URL=""
if command -v git &>/dev/null && git rev-parse --is-inside-work-tree &>/dev/null 2>&1; then
  REPO_URL=$(git remote get-url origin 2>/dev/null | sed 's/\.git$//' | sed 's|git@github.com:|https://github.com/|' || true)
fi

# --- Output ---
cat <<EOF
{
  "packageName": "$PKG_NAME",
  "packageManager": "$PKG_MANAGER",
  "hasTypeScript": $HAS_TS,
  "hasTailwind": $HAS_TAILWIND,
  "hasReact": $HAS_REACT,
  "framework": "$FRAMEWORK",
  "isMonorepo": $IS_MONOREPO,
  "sourceDirectories": $SRC_DIRS,
  "existingRegistry": $HAS_REGISTRY,
  "repoUrl": "$REPO_URL"
}
EOF

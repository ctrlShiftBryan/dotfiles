#!/bin/bash
# Initialize worktree: run existing init script or detect package manager and install
# Run from within the worktree directory
# Exit codes: 0=success, 1=error

set -e

# Check if there's a custom init script
if [ -f "init-worktree.sh" ]; then
    echo '{"method": "custom", "script": "init-worktree.sh"}'
    chmod +x init-worktree.sh
    ./init-worktree.sh
    exit 0
fi

# Detect package manager and install
if [ -f "pnpm-lock.yaml" ]; then
    echo '{"method": "pnpm"}'
    pnpm install
elif [ -f "yarn.lock" ]; then
    echo '{"method": "yarn"}'
    yarn install
elif [ -f "bun.lockb" ]; then
    echo '{"method": "bun"}'
    bun install
elif [ -f "package-lock.json" ]; then
    echo '{"method": "npm"}'
    npm install
elif [ -f "package.json" ]; then
    echo '{"method": "npm", "note": "no lockfile"}'
    npm install
else
    echo '{"method": "none", "note": "no package.json found"}'
fi

echo "Worktree initialized successfully"

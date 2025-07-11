# Add Split Background Process Management Scripts for Turborepo Monorepo

This prompt helps you add background process management scripts to a turborepo monorepo with separate frontend (Expo) and backend (Node.js/Express) applications.

## Instructions

1. **Analyze the monorepo structure** to determine:
   - Workspace names for frontend and backend
   - Dev server commands for each app
   - Port numbers for each service
   - Turborepo configuration

2. **Check existing scripts** in root package.json and workspace package.json files

3. **Add the split background scripts** with proper customization for both services

## Process

### Step 1: Examine Monorepo Structure

```bash
# Read root package.json for:
# - Turborepo scripts
# - Workspace configuration

# Read workspace package.json files for:
# - Frontend (Expo) scripts
# - Backend (Express) scripts
# - Dependencies
```

### Step 2: Detect Configuration

- **Workspace Detection**:
  - Look for `workspaces` in package.json
  - Identify frontend workspace (usually `apps/mobile`, `apps/expo`, or similar)
  - Identify backend workspace (usually `apps/api`, `apps/server`, or similar)
- **Port Detection**:
  - Frontend (Expo): Default 8081
  - Backend (Express): Default 3000 (check for PORT env var)
- **Command Detection**:
  - Check if using turbo run commands
  - Identify dev commands in each workspace

### Step 3: Generate Customized Split Scripts

Add these scripts to the root package.json:

```json
{
  "scripts": {
    // ... existing scripts ...

    // Frontend commands
    "bg:dev-frontend": "mkdir -p tmp/frontend && kill -9 $(lsof -ti:FRONTEND_PORT) 2>/dev/null; nohup bun FRONTEND_DEV_CMD > tmp/frontend/output.log 2>&1 & echo $! > tmp/frontend/server.pid",
    "bg:stop-frontend": "[ -f tmp/frontend/server.pid ] && kill $(cat tmp/frontend/server.pid) || echo 'No frontend server running'",
    "bg:logs-frontend": "tail -50 tmp/frontend/output.log",
    "bg:logs-watch-frontend": "tail -f tmp/frontend/output.log",
    "bg:status-frontend": "[ -f tmp/frontend/server.pid ] && ps -p $(cat tmp/frontend/server.pid) >/dev/null && echo 'Frontend running (PID: '$(cat tmp/frontend/server.pid)')' || echo 'Frontend not running'",
    "bg:restart-frontend": "bun run bg:stop-frontend && sleep 2 && bun run bg:dev-frontend",

    // Backend commands
    "bg:dev-backend": "mkdir -p tmp/backend && kill -9 $(lsof -ti:BACKEND_PORT) 2>/dev/null; nohup bun BACKEND_DEV_CMD > tmp/backend/output.log 2>&1 & echo $! > tmp/backend/server.pid",
    "bg:stop-backend": "[ -f tmp/backend/server.pid ] && kill $(cat tmp/backend/server.pid) || echo 'No backend server running'",
    "bg:logs-backend": "tail -50 tmp/backend/output.log",
    "bg:logs-watch-backend": "tail -f tmp/backend/output.log",
    "bg:status-backend": "[ -f tmp/backend/server.pid ] && ps -p $(cat tmp/backend/server.pid) >/dev/null && echo 'Backend running (PID: '$(cat tmp/backend/server.pid)')' || echo 'Backend not running'",
    "bg:restart-backend": "bun run bg:stop-backend && sleep 2 && bun run bg:dev-backend",

    // Combined commands
    "bg:dev": "bun run bg:dev-backend && bun run bg:dev-frontend",
    "bg:stop": "bun run bg:stop-frontend && bun run bg:stop-backend",
    "bg:logs": "echo '=== Backend Logs ===' && bun run bg:logs-backend && echo '\n=== Frontend Logs ===' && bun run bg:logs-frontend",
    "bg:logs-watch": "bun run bg:logs-watch-backend & bun run bg:logs-watch-frontend",
    "bg:status": "bun run bg:status-backend && bun run bg:status-frontend",
    "bg:restart": "bun run bg:restart-backend && bun run bg:restart-frontend",
    "bg:clean": "rm -rf tmp/"
  }
}
```

### Step 4: Turborepo-Specific Customizations

**For Turborepo projects, typical replacements:**

- `FRONTEND_DEV_CMD`: `turbo run dev --filter=@workspace/mobile` or `turbo dev --filter=mobile`
- `BACKEND_DEV_CMD`: `turbo run dev --filter=@workspace/api` or `turbo dev --filter=api`
- `FRONTEND_PORT`: 8081 (Expo default)
- `BACKEND_PORT`: 3000 (Express default)

### Step 5: Add Clear Cache Variants (Optional)

For Expo frontend with cache clearing:

```json
"bg:dev-frontend-clear": "mkdir -p tmp/frontend && kill -9 $(lsof -ti:8081) 2>/dev/null; nohup bun FRONTEND_DEV_CMD -- --clear > tmp/frontend/output.log 2>&1 & echo $! > tmp/frontend/server.pid"
```

### Step 6: Add to .gitignore

Ensure `tmp/` is in root `.gitignore`:

```bash
# Add to .gitignore if not already present
echo "tmp/" >> .gitignore
```

## Implementation Steps

1. **Analyze monorepo structure**:

   ```bash
   # Check for workspace configuration
   cat package.json | grep -A 5 "workspaces"

   # List workspace directories
   ls apps/
   ```

2. **Identify workspace names and commands**:

   ```bash
   # Check frontend workspace
   cat apps/mobile/package.json | grep -A 10 "scripts"

   # Check backend workspace
   cat apps/api/package.json | grep -A 10 "scripts"
   ```

3. **Determine if using turbo**:

   ```bash
   # Check for turbo in dependencies
   cat package.json | grep "turbo"

   # Check for turbo.json
   [ -f turbo.json ] && echo "Using turborepo"
   ```

4. **Add customized scripts** to root package.json

5. **Update .gitignore** to exclude tmp/

6. **Test the scripts**:

   ```bash
   # Test backend
   bun run bg:dev-backend
   bun run bg:status-backend

   # Test frontend
   bun run bg:dev-frontend
   bun run bg:status-frontend

   # Test combined
   bun run bg:status
   ```

## Example Configurations

### Turborepo with bun workspaces

```json
{
  "scripts": {
    "bg:dev-frontend": "mkdir -p tmp/frontend && kill -9 $(lsof -ti:8081) 2>/dev/null; nohup bun run --cwd apps/mobile dev > tmp/frontend/output.log 2>&1 & echo $! > tmp/frontend/server.pid",
    "bg:dev-backend": "mkdir -p tmp/backend && kill -9 $(lsof -ti:3000) 2>/dev/null; nohup bun run --cwd apps/api dev > tmp/backend/output.log 2>&1 & echo $! > tmp/backend/server.pid"
  }
}
```

### Turborepo with bun and turbo commands

```json
{
  "scripts": {
    "bg:dev-frontend": "mkdir -p tmp/frontend && kill -9 $(lsof -ti:8081) 2>/dev/null; nohup bun turbo dev --filter=mobile > tmp/frontend/output.log 2>&1 & echo $! > tmp/frontend/server.pid",
    "bg:dev-backend": "mkdir -p tmp/backend && kill -9 $(lsof -ti:3000) 2>/dev/null; nohup bun turbo dev --filter=api > tmp/backend/output.log 2>&1 & echo $! > tmp/backend/server.pid"
  }
}
```

## Usage After Installation

### Individual Service Control

```bash
# Start services
bun run bg:dev-frontend    # Start only frontend
bun run bg:dev-backend     # Start only backend
bun run bg:dev            # Start both

# Check status
bun run bg:status-frontend # Frontend status
bun run bg:status-backend  # Backend status  
bun run bg:status         # Both statuses

# View logs
bun run bg:logs-frontend   # Last 50 lines of frontend
bun run bg:logs-backend    # Last 50 lines of backend
bun run bg:logs           # Both logs

# Watch logs in real-time
npm run bg:logs-watch-frontend  # Stream frontend logs
npm run bg:logs-watch-backend   # Stream backend logs
npm run bg:logs-watch           # Stream both (split view)

# Stop services
npm run bg:stop-frontend   # Stop only frontend
npm run bg:stop-backend    # Stop only backend
npm run bg:stop           # Stop both

# Restart services
npm run bg:restart-frontend # Restart only frontend
npm run bg:restart-backend  # Restart only backend
npm run bg:restart         # Restart both

# Stop services
bun run bg:stop-frontend   # Stop only frontend
bun run bg:stop-backend    # Stop only backend
bun run bg:stop           # Stop both

# Restart services
bun run bg:restart-frontend # Restart only frontend
bun run bg:restart-backend  # Restart only backend
bun run bg:restart         # Restart both

# Clean up
bun run bg:clean          # Remove all tmp directories
```

## Environment Variables

For backend services that need environment variables:

```json
"bg:dev-backend": "mkdir -p tmp/backend && kill -9 $(lsof -ti:3000) 2>/dev/null; nohup env NODE_ENV=development PORT=3000 bun run --cwd apps/api dev > tmp/backend/output.log 2>&1 & echo $! > tmp/backend/server.pid"
```

## Notes

- Each service has its own log file and PID file in separate directories
- Scripts handle port conflicts automatically
- The `bg:logs-watch` command shows both logs simultaneously (use Ctrl+C to exit)
- All tmp directories are created automatically
- Process IDs are stored separately for independent control
- Combined commands execute operations on both services
- Compatible with turborepo's caching and parallel execution

## Troubleshooting

### Port conflicts

If services fail to start, check for processes using the ports:

```bash
lsof -ti:8081  # Check frontend port
lsof -ti:3000  # Check backend port
```

### Turborepo filtering

If turbo commands aren't working, verify filter names:

```bash
bunx turbo run dev --dry-run  # See what would run
```

### Workspace names

Verify workspace names match your configuration:

```bash
bun pm ls  # List bun workspaces
```

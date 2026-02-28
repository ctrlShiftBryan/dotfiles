---
name: bg-scripts
description: "Add background process management scripts (bg:up, bg:down, bg:status, etc.) to any Node.js project. Creates a bash script + thin package.json wrappers. Supports multi-service projects with bg:<service>:up naming."
user_invocable: true
---

# Add Background Process Management Scripts

Add `scripts/bg.sh` and package.json `bg:*` aliases to any Node.js project with a dev server.

## User Input

The user may specify services by name (e.g. "expo for frontend and convex for backend"). Use the service names they provide as the namespace in commands. If no services are specified, detect from the project.

## Detection

1. Read `package.json` — identify:
   - **Package manager**: `package-lock.json` → npm, `yarn.lock` → yarn, `pnpm-lock.yaml` → pnpm, `bun.lockb` → bun
   - **Framework**: `next` → Next.js, `vite` → Vite, `expo` → Expo, `react-scripts` → CRA
   - **Dev command**: first match of `dev`, `start`, `serve` in scripts
   - **Port**: extract from scripts args, `.env`, config files, or use framework default

2. Default ports: Next.js 3000, CRA 3000, Vite 5173, Vue CLI 8080, Angular 4200, Expo 8081, Gatsby 8000, Nuxt 3000, SvelteKit 5173, Remix 3000

## Naming Convention

- Use `up` / `down` (NOT `dev` / `stop`)
- For multi-service projects, use double-colon namespacing with the service name: `bg:<service>:up`, `bg:<service>:down`
- Service names come from the actual tool/framework name (e.g. `expo`, `convex`, `next`, `vite`) — NOT generic labels like `frontend`/`backend`
- Combined commands use just `bg:up`, `bg:down`, etc.

## Single Service Output: `scripts/bg.sh`

Create `scripts/bg.sh` (chmod +x) with detected values:

```bash
#!/usr/bin/env bash
set -euo pipefail

PORT=<detected>
PID_FILE=tmp/server.pid
LOG_FILE=tmp/output.log
DEV_CMD="<pkg_mgr> <dev_command>"

is_running() {
  [ -f "$PID_FILE" ] && ps -p "$(cat "$PID_FILE")" >/dev/null 2>&1
}

case "${1:-help}" in
  up)
    mkdir -p tmp
    kill -9 "$(lsof -ti:"$PORT")" 2>/dev/null || true
    nohup $DEV_CMD > "$LOG_FILE" 2>&1 & echo $! > "$PID_FILE"
    echo "Started (PID: $!) → http://localhost:$PORT"
    ;;
  down)
    if is_running; then
      kill "$(cat "$PID_FILE")"
      echo "Stopped"
    else
      echo "Not running"
    fi
    ;;
  status)
    if is_running; then
      echo "Running (PID: $(cat "$PID_FILE")) → http://localhost:$PORT"
    else
      echo "Not running (port $PORT)"
    fi
    ;;
  logs)
    tail -50 "$LOG_FILE"
    ;;
  logs-watch)
    tail -f "$LOG_FILE"
    ;;
  restart)
    "$0" down
    sleep 2
    "$0" up
    ;;
  clean)
    rm -rf tmp/
    echo "Cleaned tmp/"
    ;;
  *)
    echo "Usage: $0 {up|down|status|logs|logs-watch|restart|clean}"
    ;;
esac
```

## Single Service: package.json scripts

```json
{
  "bg:up": "./scripts/bg.sh up",
  "bg:down": "./scripts/bg.sh down",
  "bg:logs": "./scripts/bg.sh logs",
  "bg:logs-watch": "./scripts/bg.sh logs-watch",
  "bg:status": "./scripts/bg.sh status",
  "bg:restart": "./scripts/bg.sh restart",
  "bg:clean": "./scripts/bg.sh clean"
}
```

## Multi-Service Output: `scripts/bg.sh`

For projects with multiple services (e.g. expo + convex, next + strapi), use `tmp/<service>/` for separate PID/log files and double-colon subcommands.

Example with two services (`expo` and `convex`):

```bash
#!/usr/bin/env bash
set -euo pipefail

EXPO_PORT=${PORT:-9090}

EXPO_PID=tmp/expo/server.pid
EXPO_LOG=tmp/expo/output.log
EXPO_CMD="pnpm expo start -c --port $EXPO_PORT"

CONVEX_PID=tmp/convex/server.pid
CONVEX_LOG=tmp/convex/output.log
CONVEX_CMD="pnpm exec convex dev"

is_running() {
  [ -f "$1" ] && ps -p "$(cat "$1")" >/dev/null 2>&1
}

start_expo() {
  mkdir -p tmp/expo
  kill -9 "$(lsof -ti:"$EXPO_PORT")" 2>/dev/null || true
  nohup $EXPO_CMD > "$EXPO_LOG" 2>&1 & echo $! > "$EXPO_PID"
  echo "Expo started (PID: $!) → http://localhost:$EXPO_PORT"
}

stop_expo() {
  if is_running "$EXPO_PID"; then kill "$(cat "$EXPO_PID")"; echo "Expo stopped"
  else echo "Expo not running"; fi
}

start_convex() {
  mkdir -p tmp/convex
  nohup $CONVEX_CMD > "$CONVEX_LOG" 2>&1 & echo $! > "$CONVEX_PID"
  echo "Convex started (PID: $!)"
}

stop_convex() {
  if is_running "$CONVEX_PID"; then kill "$(cat "$CONVEX_PID")"; echo "Convex stopped"
  else echo "Convex not running"; fi
}

case "${1:-help}" in
  up)            start_expo; start_convex ;;
  down)          stop_expo; stop_convex ;;
  status)
    is_running "$EXPO_PID" && echo "Expo: running (PID: $(cat "$EXPO_PID"))" || echo "Expo: not running"
    is_running "$CONVEX_PID" && echo "Convex: running (PID: $(cat "$CONVEX_PID"))" || echo "Convex: not running"
    ;;
  logs)
    echo "=== Expo ===" && tail -50 "$EXPO_LOG" 2>/dev/null || echo "(no logs)"
    echo "" && echo "=== Convex ===" && tail -50 "$CONVEX_LOG" 2>/dev/null || echo "(no logs)"
    ;;
  restart)       stop_expo; stop_convex; sleep 2; start_expo; start_convex ;;
  expo:up)       start_expo ;;
  expo:down)     stop_expo ;;
  expo:status)   is_running "$EXPO_PID" && echo "Running (PID: $(cat "$EXPO_PID"))" || echo "Not running" ;;
  expo:logs)     tail -50 "$EXPO_LOG" ;;
  expo:logs-watch) tail -f "$EXPO_LOG" ;;
  expo:restart)  stop_expo; sleep 2; start_expo ;;
  convex:up)     start_convex ;;
  convex:down)   stop_convex ;;
  convex:status) is_running "$CONVEX_PID" && echo "Running (PID: $(cat "$CONVEX_PID"))" || echo "Not running" ;;
  convex:logs)   tail -50 "$CONVEX_LOG" ;;
  convex:logs-watch) tail -f "$CONVEX_LOG" ;;
  convex:restart) stop_convex; sleep 2; start_convex ;;
  clean)         rm -rf tmp/; echo "Cleaned tmp/" ;;
  *)
    echo "Usage: bg.sh {up|down|status|restart|clean}"
    echo "  Per-service: bg.sh {expo|convex}:{up|down|status|logs|logs-watch|restart}"
    ;;
esac
```

## Multi-Service: package.json scripts

Use `bg:<service>:<action>` naming. Combined commands omit the service name.

```json
{
  "bg:up": "./scripts/bg.sh up",
  "bg:down": "./scripts/bg.sh down",
  "bg:status": "./scripts/bg.sh status",
  "bg:logs": "./scripts/bg.sh logs",
  "bg:restart": "./scripts/bg.sh restart",
  "bg:clean": "./scripts/bg.sh clean",
  "bg:expo:up": "./scripts/bg.sh expo:up",
  "bg:expo:down": "./scripts/bg.sh expo:down",
  "bg:expo:status": "./scripts/bg.sh expo:status",
  "bg:expo:logs": "./scripts/bg.sh expo:logs",
  "bg:expo:logs-watch": "./scripts/bg.sh expo:logs-watch",
  "bg:expo:restart": "./scripts/bg.sh expo:restart",
  "bg:convex:up": "./scripts/bg.sh convex:up",
  "bg:convex:down": "./scripts/bg.sh convex:down",
  "bg:convex:status": "./scripts/bg.sh convex:status",
  "bg:convex:logs": "./scripts/bg.sh convex:logs",
  "bg:convex:logs-watch": "./scripts/bg.sh convex:logs-watch",
  "bg:convex:restart": "./scripts/bg.sh convex:restart"
}
```

## Output: .gitignore

Add `tmp/` if not already present.

## Checklist

- [ ] Detect pkg manager, framework, port, dev command
- [ ] Determine single vs multi-service from user input or project structure
- [ ] Use service names (expo, convex, next, vite) NOT generic labels (frontend, backend)
- [ ] Use `up`/`down` naming, double-colon `bg:<service>:<action>` namespacing
- [ ] Create `scripts/bg.sh` with correct values
- [ ] `chmod +x scripts/bg.sh`
- [ ] Add `bg:*` scripts to package.json
- [ ] Add `tmp/` to .gitignore

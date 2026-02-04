#!/bin/bash
# ralph.sh - Autonomous Claude loop (run from ralph/ directory)
# Usage: ./ralph.sh [max-iterations]

MAX_ITERATIONS=${1:-10}
PAUSE_SECONDS=3

# Resolve absolute paths from script location
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

PROMPT_FILE="$REPO_ROOT/prompt.md"
STOP_FLAG="$REPO_ROOT/.ralph-stop"
LOG_DIR="$REPO_ROOT/.ralph/logs"
LOG_FILE="$LOG_DIR/ralph-$(date +%Y-%m-%d-%H-%M).log"

mkdir -p "$LOG_DIR"
rm -f "$STOP_FLAG"

log() { echo "$1" | tee -a "$LOG_FILE"; }

log "=== Ralph started $(date) ==="
log "Max iterations: $MAX_ITERATIONS"
log "Stop with: touch $STOP_FLAG"

for i in $(seq 1 $MAX_ITERATIONS); do
    log "=== Iteration $i/$MAX_ITERATIONS - $(date +%H:%M:%S) ==="

    [ -f "$STOP_FLAG" ] && { log "Stop flag detected."; rm -f "$STOP_FLAG"; exit 0; }

    cd "$REPO_ROOT" && claude --dangerously-skip-permissions --print < "$PROMPT_FILE" 2>&1 | tee -a "$LOG_FILE"

    grep -qE "^\*{0,2}ALL_TASKS_COMPLETE\*{0,2}$" "$LOG_FILE" && { log "=== All tasks complete! ==="; exit 0; }
    grep -qE "\*{0,2}TASK_COMPLETE\*{0,2}" "$LOG_FILE" && log "Task completed, continuing..."

    log "=== Iteration $i complete, pausing ${PAUSE_SECONDS}s ==="
    sleep $PAUSE_SECONDS
done

log "=== Max iterations reached ==="
exit 1

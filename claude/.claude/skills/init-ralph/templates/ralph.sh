#!/bin/bash
# ralph.sh - Autonomous Claude loop
# Usage: ./ralph.sh [max-iterations] [stall-minutes]

MAX_ITERATIONS=${1:-10}
STALL_MINUTES=${2:-5}
PAUSE_SECONDS=3
PROMPT_FILE="prompt.md"
STOP_FLAG=".ralph-stop"
LOG_DIR=".ralph/logs"
LOG_FILE="$LOG_DIR/ralph-$(date +%Y-%m-%d-%H-%M).log"
TMP_OUTPUT="$LOG_DIR/.tmp-output"
MAX_RETRIES=3
WATCHDOG_SCRIPT="$HOME/.claude/skills/init-ralph/templates/ralph-watchdog.sh"

# Setup
mkdir -p "$LOG_DIR"
rm -f "$STOP_FLAG"

log() {
    echo "$1" | tee -a "$LOG_FILE"
}

is_transient_error() {
    grep -qE "No messages returned|rate limit|timeout|STALLED|ECONNRESET|503|529" "$1" 2>/dev/null
}

run_claude_with_retry() {
    local attempt=1
    local backoff=5

    while [ $attempt -le $MAX_RETRIES ]; do
        # Clear tmp file
        > "$TMP_OUTPUT"

        # Run claude in background
        claude --dangerously-skip-permissions --print < "$PROMPT_FILE" > "$TMP_OUTPUT" 2>&1 &
        local claude_pid=$!

        # Start watchdog if script exists
        local watchdog_pid=""
        if [ -x "$WATCHDOG_SCRIPT" ]; then
            "$WATCHDOG_SCRIPT" "$STALL_MINUTES" "$TMP_OUTPUT" "$claude_pid" &
            watchdog_pid=$!
        fi

        # Wait for claude to finish
        wait $claude_pid
        local exit_code=$?

        # Kill watchdog if running
        if [ -n "$watchdog_pid" ]; then
            kill $watchdog_pid 2>/dev/null
            wait $watchdog_pid 2>/dev/null
        fi

        cat "$TMP_OUTPUT" | tee -a "$LOG_FILE"

        if [ $exit_code -eq 0 ] && ! is_transient_error "$TMP_OUTPUT"; then
            return 0
        fi

        if is_transient_error "$TMP_OUTPUT"; then
            log "Transient error detected, retry $attempt/$MAX_RETRIES in ${backoff}s..."
            sleep $backoff
            backoff=$((backoff * 3))
            attempt=$((attempt + 1))
        else
            return $exit_code
        fi
    done

    log "Max retries exhausted"
    return 1
}

# Validate manual steps
MANUAL_STEPS="ralph/manual-steps.md"
if [ -f "$MANUAL_STEPS" ]; then
    if grep -q '^\- \[ \]' "$MANUAL_STEPS"; then
        echo "ERROR: Incomplete manual steps in $MANUAL_STEPS"
        echo ""
        grep '^\- \[ \]' "$MANUAL_STEPS"
        echo ""
        echo "Complete all manual steps (mark [x]) before running ralph.sh"
        exit 1
    fi
fi

log "=== Ralph started $(date) ==="
log "Max iterations: $MAX_ITERATIONS"
log "Stall timeout: ${STALL_MINUTES}m (no output)"
log "Log file: $LOG_FILE"
log "Stop with: touch $STOP_FLAG"
log ""

for i in $(seq 1 $MAX_ITERATIONS); do
    log "=== Iteration $i/$MAX_ITERATIONS - $(date +%H:%M:%S) ==="

    # Check stop flag
    if [ -f "$STOP_FLAG" ]; then
        log "Stop flag detected. Exiting gracefully."
        rm -f "$STOP_FLAG"
        exit 0
    fi

    # Run Claude with retry
    run_claude_with_retry
    EXIT_CODE=$?

    if [ $EXIT_CODE -ne 0 ]; then
        log "Claude failed after retries, code $EXIT_CODE"
    fi

    # Check for all tasks complete (handles **bold** markdown)
    if grep -qE "^\*{0,2}ALL_TASKS_COMPLETE\*{0,2}$" "$LOG_FILE" 2>/dev/null; then
        log "=== All tasks complete! ==="
        rm -f "$TMP_OUTPUT"
        exit 0
    fi

    # Check single task complete (handles **bold** markdown)
    if grep -qE "\*{0,2}TASK_COMPLETE\*{0,2}" "$LOG_FILE" 2>/dev/null; then
        log "Task completed, continuing to next iteration..."
    fi

    log "=== Iteration $i complete, pausing ${PAUSE_SECONDS}s ==="
    sleep $PAUSE_SECONDS
done

rm -f "$TMP_OUTPUT"
log "=== Max iterations reached ==="
exit 1

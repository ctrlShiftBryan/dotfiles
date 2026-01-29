#!/bin/bash
# ralph-watchdog.sh - Kill hung claude processes

STALL_MINUTES=${1:-5}    # Kill if no output for 5 min
CHECK_INTERVAL=30        # Check every 30 sec
TMP_OUTPUT="$2"          # Path to .tmp-output
CLAUDE_PID="$3"          # PID to monitor

while kill -0 "$CLAUDE_PID" 2>/dev/null; do
    sleep $CHECK_INTERVAL

    # Get file age in seconds
    if [ -f "$TMP_OUTPUT" ]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            last_mod=$(stat -f %m "$TMP_OUTPUT")
        else
            last_mod=$(stat -c %Y "$TMP_OUTPUT")
        fi
        now=$(date +%s)
        age_sec=$((now - last_mod))
        age_min=$((age_sec / 60))

        if [ $age_min -ge $STALL_MINUTES ]; then
            echo "WATCHDOG: No output for ${age_min}m, killing PID $CLAUDE_PID"
            kill "$CLAUDE_PID" 2>/dev/null
            echo "STALLED (no output for ${age_min}m)" >> "$TMP_OUTPUT"
            exit 0
        fi
    fi
done

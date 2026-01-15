#!/bin/bash
input=$(cat)

MODEL=$(echo "$input" | jq -r '.model.display_name')
COST=$(echo "$input" | jq -r '.cost.total_cost_usd')
IN_TOKENS=$(echo "$input" | jq '.context_window.current_usage.input_tokens // 0')
OUT_TOKENS=$(echo "$input" | jq '.context_window.current_usage.output_tokens // 0')
SESSION_MS=$(echo "$input" | jq -r '.cost.total_duration_ms')
API_MS=$(echo "$input" | jq -r '.cost.total_api_duration_ms')
CONTEXT_SIZE=$(echo "$input" | jq -r '.context_window.context_window_size')
CURRENT=$(echo "$input" | jq '.context_window.current_usage.input_tokens + .context_window.current_usage.cache_creation_input_tokens + .context_window.current_usage.cache_read_input_tokens // 0')

PERCENT=$((CURRENT * 100 / CONTEXT_SIZE))
SESSION_TIME=$(printf '%dm%02ds' $((SESSION_MS / 60000)) $(((SESSION_MS % 60000) / 1000)))
API_TIME=$(printf '%ds' $((API_MS / 1000)))
IN_K=$(printf '%.1fK' $(echo "scale=1; $IN_TOKENS / 1000" | bc))
OUT_K=$(printf '%.1fK' $(echo "scale=1; $OUT_TOKENS / 1000" | bc))

echo "${MODEL} | ${PERCENT}% context | \$${COST} | in: ${IN_K} out: ${OUT_K} | session: ${SESSION_TIME} | api: ${API_TIME}"

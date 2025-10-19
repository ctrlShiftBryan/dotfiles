# Claude Code Sub-Agent Logs Documentation

## Log Storage Location

Sub-agent logs are stored in the **same JSONL file** as the parent conversation. Each session creates a single JSONL file named with a UUID (e.g., `a76b1f84-b454-4b55-8005-6f143bf65e13.jsonl`) in the project directory:

```
.claude/projects/{project-name}/{session-uuid}.jsonl
```

All events in that session, including sub-agent invocations via the Task tool, are logged sequentially in the same file.

## How to Identify Sub-Agent Log Entries

### 1. Task Invocation Pattern

When a sub-agent is invoked, you'll see an entry with the Task tool:

```json
{
  "type": "assistant",
  "message": {
    "role": "assistant",
    "content": [{
      "type": "tool_use",
      "id": "toolu_01ELDyGTJhX4hNN6pre6MBef",
      "name": "Task",
      "input": {
        "description": "Analyze existing patterns",
        "prompt": "...",
        "subagent_type": "general-purpose"  // Key indicator
      }
    }]
  }
}
```

### 2. Sub-Agent Response Pattern

The sub-agent's response appears as a tool_result:

```json
{
  "type": "user",
  "message": {
    "role": "user",
    "content": [{
      "tool_use_id": "toolu_01ELDyGTJhX4hNN6pre6MBef",
      "type": "tool_result",
      "content": [{
        "type": "text",
        "text": "...sub-agent response..."
      }]
    }]
  },
  "toolUseResult": {  // Key indicator - only present for sub-agent responses
    "totalDurationMs": 81339,
    "totalTokens": 37893,
    "totalToolUseCount": 13,
    "usage": {
      "input_tokens": 5,
      "cache_creation_input_tokens": 232,
      "cache_read_input_tokens": 36507,
      "output_tokens": 1149,
      "service_tier": "standard"
    }
  }
}
```

## Key Indicators of Sub-Agent Activity

1. **`subagent_type` field**: Present in Task tool invocations, specifies the agent type:
   - `general-purpose`
   - `github-logs-explorer`
   - `playwright-mcp-executor`
   - `codex-task-runner`
   - etc.

2. **`toolUseResult` field**: Present only in sub-agent responses, contains:
   - `totalDurationMs`: Execution time
   - `totalTokens`: Total token usage
   - `totalToolUseCount`: Number of tools the sub-agent used
   - `usage`: Detailed token usage breakdown

3. **Parent-Child Relationship**: Track via:
   - `parentUuid`: Links entries to their parent
   - `tool_use_id`: Matches between invocation and result

## Finding Sub-Agent Logs

### Using Command Line

```bash
# Find all Task invocations with sub-agent types
jq -r 'select(.message.content[0].name == "Task") | 
       .message.content[0].input.subagent_type' \
       .claude/projects/*/*.jsonl

# Find all sub-agent responses (with metrics)
jq 'select(.toolUseResult) | 
    {time: .timestamp, duration: .toolUseResult.totalDurationMs, 
     tokens: .toolUseResult.totalTokens}' \
    .claude/projects/*/*.jsonl

# Get a specific sub-agent conversation by tool_use_id
grep "toolu_01ELDyGTJhX4hNN6pre6MBef" project.jsonl | jq '.'
```

## Example Workflow

1. Parent assistant invokes Task tool with `subagent_type`
2. Sub-agent processes the task (not directly logged)
3. Sub-agent response appears as `tool_result` with `toolUseResult` metrics
4. Parent assistant continues with the sub-agent's output

## Important Notes

- Sub-agents do **not** create separate JSONL files
- All activity is logged chronologically in the parent session's file
- The `sessionId` remains the same throughout (parent's session ID)
- Sub-agent internal processing is not directly visible, only the final result
- Metrics in `toolUseResult` provide insight into sub-agent resource usage
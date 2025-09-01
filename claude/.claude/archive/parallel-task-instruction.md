# Parallel Task Execution Guidelines

When using tools that can be run independently, ALWAYS use the Task tool to execute them in parallel rather than sequentially. This dramatically improves performance and efficiency.

## When to Use Parallel Tasks

Use parallel Task execution for:
- Multiple file searches or reads
- Independent analysis operations  
- Gathering different types of information
- Running multiple bash commands that don't depend on each other
- Fetching data from multiple sources

## How to Execute Parallel Tasks

Instead of running tools sequentially:
```
# ❌ AVOID: Sequential execution (slow)
Tool 1: Search for pattern A
Wait for result...
Tool 2: Search for pattern B  
Wait for result...
Tool 3: Read file X
Wait for result...
```

Always batch independent operations:
```
# ✅ PREFERRED: Parallel execution (fast)
Launch these Tasks simultaneously:
1. Search for pattern A
2. Search for pattern B
3. Read file X
4. Analyze component Y
5. Check configuration Z
```

## Example Parallel Task Usage

When implementing features or analyzing code:
```
Use Task tool to simultaneously:
1. Search for test files related to the feature
2. Find existing implementations of similar features
3. Identify utility functions that might be useful
4. Look for relevant types and interfaces
5. Check configuration files
```

## Performance Impact

- Sequential execution of 5 tasks: ~2-3 minutes
- Parallel execution of 5 tasks: ~20-30 seconds
- Improvement: 5-10x faster

## Key Principles

1. **Identify Independent Operations**: Before executing any tools, identify which operations can run independently
2. **Batch Related Work**: Group similar operations into a single parallel Task batch
3. **Maximize Parallelism**: Run as many independent operations as possible simultaneously
4. **Single Message**: Execute all parallel Tasks in a single message for maximum efficiency

Remember: If operations don't depend on each other's results, they should run in parallel using the Task tool.
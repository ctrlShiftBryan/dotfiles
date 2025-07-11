# Running Shell Commands in Background

## Complete Command

```bash
nohup command > /tmp/output.log 2>&1 & echo $! > /tmp/command.pid
```

## Component Breakdown

- `nohup` - Prevents command from terminating when terminal closes
- `command` - Your actual command to run
- `> /tmp/output.log` - Redirects stdout to temp file
- `2>&1` - Redirects stderr to stdout (both go to same file)
- `&` - Runs command in background
- `echo $! > /tmp/command.pid` - Saves process ID for later management

## Example

```bash
nohup npm run test > /tmp/test-output.log 2>&1 & echo $! > /tmp/test.pid
```

## Managing Background Processes

```bash
# Monitor output in real-time
tail -f /tmp/test-output.log

# Check if process is still running
ps -p $(cat /tmp/test.pid)

# Kill the background process
kill $(cat /tmp/test.pid)
```

## Alternative Approaches

```bash
# Simple background (attached to terminal)
command > output.log 2>&1 &

# Append to log instead of overwrite
command >> output.log 2>&1 &

# Separate stdout and stderr
command > stdout.log 2> stderr.log &

# Using unique temp file
command > $(mktemp) 2>&1 &
```

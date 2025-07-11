# Who I Am

my name is bryan

# Running Shell Commands in Background

## Complete Command

```bash
nohup command > tmp/output.log 2>&1 & echo $! > tmp/command.pid
```

## Component Breakdown

- `nohup` - Prevents command from terminating when terminal closes
- `command` - Your actual command to run
- `> tmp/output.log` - Redirects stdout to temp file in current directory
- `2>&1` - Redirects stderr to stdout (both go to same file)
- `&` - Runs command in background
- `echo $! > tmp/command.pid` - Saves process ID for later management

## Example

```bash
# Create tmp directory if it doesn't exist
mkdir -p tmp

# Run command in background
nohup npm run test > tmp/test-output.log 2>&1 & echo $! > tmp/test.pid
```

## Managing Background Processes

```bash
# Monitor output in real-time
tail -f tmp/test-output.log

# Check if process is still running
ps -p $(cat tmp/test.pid)

# Kill the background process
kill $(cat tmp/test.pid)
```

## Alternative Approaches

```bash
# Simple background (attached to terminal)
command > tmp/output.log 2>&1 &

# Append to log instead of overwrite
command >> tmp/output.log 2>&1 &

# Separate stdout and stderr
command > tmp/stdout.log 2> tmp/stderr.log &

# Using unique temp file in tmp directory
mkdir -p tmp && command > tmp/$(date +%s)-output.log 2>&1 &
```

## GitHub CLI Guidelines

When working with GitHub:

- **Always attempt to use the `gh` CLI tool first** - Do not access content over HTTPS and a browser even if the user gave you a https hyperlink
- The `gh` CLI provides direct access to repositories, issues, PRs, releases, and more without needing web access
- Use commands like `gh repo view`, `gh issue list`, `gh pr view`, `gh api` instead of fetching from URLs

When using the `gh` CLI command:

- Always check authentication status first with `gh auth status`
- If you see "Failed to log in to github.com using token (GITHUB_TOKEN)" error, unset the GITHUB_TOKEN environment variable before running gh commands: `unset GITHUB_TOKEN && gh <command>`
- The invalid GITHUB_TOKEN environment variable can override valid keyring authentication

When creating pull requests:

- **Always open pull requests in draft mode** by using the `--draft` flag with `gh pr create`
- Only create non-draft PRs when explicitly instructed not to use draft mode
- Example: `gh pr create --draft --title "My PR" --body "Description"`
- **Escape backticks in PR bodies**: When including code blocks or inline code in PR descriptions, use a heredoc to avoid shell interpretation errors:
  ```bash
  gh pr create --draft --title "Title" --body "$(cat <<'EOF'
  Description with `inline code` and code blocks:
  ```bash
  echo "example"
  ```
  EOF
  )"
  ```

## Git worktrees

When adding a workree. Always add the work tree in the parent worktrees folder. For example if working on project-1 and I ask to use a worktree for my-new-feature, create the worktree at ../project-1-worktrees/my-new-feature.

## Parallel Task Execution Guidelines

When using tools that can be run independently, ALWAYS use the Task tool to execute them in parallel rather than sequentially. This dramatically improves performance and efficiency.

### When to Use Parallel Tasks

Use parallel Task execution for:

- Multiple file searches or reads
- Independent analysis operations
- Gathering different types of information
- Running multiple bash commands that don't depend on each other
- Fetching data from multiple sources

### How to Execute Parallel Tasks

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

### Example Parallel Task Usage

When implementing features or analyzing code:

```
Use Task tool to simultaneously:
1. Search for test files related to the feature
2. Find existing implementations of similar features
3. Identify utility functions that might be useful
4. Look for relevant types and interfaces
5. Check configuration files
```

### Performance Impact

- Sequential execution of 5 tasks: ~2-3 minutes
- Parallel execution of 5 tasks: ~20-30 seconds
- Improvement: 5-10x faster

### Key Principles

1. **Identify Independent Operations**: Before executing any tools, identify which operations can run independently
2. **Batch Related Work**: Group similar operations into a single parallel Task batch
3. **Maximize Parallelism**: Run as many independent operations as possible simultaneously
4. **Single Message**: Execute all parallel Tasks in a single message for maximum efficiency

Remember: If operations don't depend on each other's results, they should run in parallel using the Task tool.

## Background Process Management Scripts for Package.json

When working with Node.js projects that have long-running development servers (like Expo, Next.js, Vite, etc.), add these background process management scripts to make development easier.

### Adding Background Scripts to Any Project

Add these scripts to the `scripts` section of any `package.json`:

```json
{
  "scripts": {
    // ... existing scripts ...
    "bg:start": "mkdir -p tmp && kill -9 $(lsof -ti:PORT) 2>/dev/null; nohup npm start > tmp/output.log 2>&1 & echo $! > tmp/server.pid",
    "bg:start-clear-cache": "mkdir -p tmp && kill -9 $(lsof -ti:PORT) 2>/dev/null; nohup npm start -- --clear > tmp/output.log 2>&1 & echo $! > tmp/server.pid",
    "bg:stop": "[ -f tmp/server.pid ] && kill $(cat tmp/server.pid) || echo 'No server running'",
    "bg:logs": "tail -f tmp/output.log",
    "bg:logs-last": "tail -50 tmp/output.log",
    "bg:status": "[ -f tmp/server.pid ] && ps -p $(cat tmp/server.pid) >/dev/null && echo 'Server running (PID: '$(cat tmp/server.pid)')' || echo 'Server not running'",
    "bg:restart": "npm run bg:stop && sleep 2 && npm run bg:start",
    "bg:clean": "rm -rf tmp/"
  }
}
```

### Customization Required

1. **Replace PORT**: Change `PORT` to the actual port number your dev server uses (e.g., 3000, 8080, 8081)
2. **Replace npm with yarn/pnpm**: If the project uses yarn or pnpm, replace `npm start` and `npm run` accordingly
3. **Adjust start command**: Some projects might use `dev` instead of `start` (e.g., `npm run dev`)
4. **Cache clearing flag**: The `--clear` flag varies by tool (e.g., Next.js uses `--turbo`, Vite doesn't have one)

### Example for Common Frameworks

#### Expo Project

```json
"bg:start": "mkdir -p tmp && kill -9 $(lsof -ti:8081) 2>/dev/null; nohup expo start > tmp/expo-output.log 2>&1 & echo $! > tmp/expo.pid",
"bg:start-clear-cache": "mkdir -p tmp && kill -9 $(lsof -ti:8081) 2>/dev/null; nohup expo start --clear > tmp/expo-output.log 2>&1 & echo $! > tmp/expo.pid",
```

#### Next.js Project

```json
"bg:start": "mkdir -p tmp && kill -9 $(lsof -ti:3000) 2>/dev/null; nohup npm run dev > tmp/next-output.log 2>&1 & echo $! > tmp/next.pid",
"bg:start-clear-cache": "mkdir -p tmp && kill -9 $(lsof -ti:3000) 2>/dev/null; nohup npm run dev -- --turbo > tmp/next-output.log 2>&1 & echo $! > tmp/next.pid",
```

#### Vite Project

```json
"bg:start": "mkdir -p tmp && kill -9 $(lsof -ti:5173) 2>/dev/null; nohup npm run dev > tmp/vite-output.log 2>&1 & echo $! > tmp/vite.pid",
```

### Usage

After adding these scripts:

- `npm run bg:start` - Start server in background (kills any process on the port first)
- `npm run bg:logs` - Watch logs in real-time
- `npm run bg:status` - Check if server is running
- `npm run bg:stop` - Stop the server
- `npm run bg:restart` - Restart the server
- `npm run bg:clean` - Clean up tmp directory

### Important Notes

1. Add `tmp` to `.gitignore` to avoid committing logs and PID files
2. The scripts automatically create the `tmp` directory if it doesn't exist
3. Port conflicts are handled by killing existing processes before starting
4. All output is logged to `tmp/output.log` for debugging

## Plan Documentation

When presenting any implementation plan or strategy to the user, always:

1. Create a markdown file in the `plans/` directory at the repository root
2. Name the file using this format: `YYYY-MM-DD-HH-MMam-pm-descriptive-name.md`
   - Use system local time for the timestamp
   - Replace spaces with hyphens in the descriptive name
   - Keep the descriptive name concise (3-5 words)
3. Example: `plans/2025-01-07-02-30pm-refactor-auth-system.md`

4. The plan file should contain:

   - A clear title
   - Numbered steps or phases
   - Any relevant context or assumptions
   - Expected outcomes

5. Always create this file BEFORE presenting the plan to the user, then reference it in your response

6. When iterating or refining a plan based on user feedback:
   - Update the existing plan file directly with the changes
   - Do NOT just output changes in the prompt response
   - Keep the plan clean and current without revision tracking

This ensures all plans are:

- Timestamped for historical tracking
- Easily searchable and reviewable
- Preserved for future reference
- Organized in a dedicated location
- Always reflect the current/latest version of the plan

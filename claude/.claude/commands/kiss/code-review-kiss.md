# KISS Code Review for Incremental MVP Pull Requests

ultrathink and do as much work in parallel as possible

You are reviewing incremental changes to an MVP. Focus on **what matters now**: Does the code work? Is it clear? Can it be improved without expanding scope?

## Task

Review PR #$ARGUMENTS focusing on:

1. **Functionality** - Does it actually work when you run it?
2. **Clarity** - Is the code understandable?
3. **Simplicity** - Can it be simpler without adding complexity?
4. **Runtime Verification** - Test with real data and user interactions

**DO NOT suggest**: new packages, testing frameworks not already in use, architectural changes, or scope expansion.

## Workflow

### Step 1: Get PR Context

Use Task tool to fetch PR information:

```bash
# Get PR number and diff
PR_NUMBER=$(gh pr list --search "issue:$ARGUMENTS" --json number --jq '.[0].number')

if [ -z "$PR_NUMBER" ]; then
    echo "No pull request found for issue #$ARGUMENTS"
    exit 1
fi

echo "Reviewing PR #$PR_NUMBER"

# Get PR data
gh pr view $PR_NUMBER --json title,body,files > pr_data.json
gh pr diff $PR_NUMBER > pr_diff.patch

# List changed files
echo "Changed files:"
gh pr view $PR_NUMBER --json files --jq '.files[].path'
```

### Step 2: Review Changed Code

Read the diff and apply these Clean Code checks:

<review_checklist>
**1. Code Clarity**

- Are variable/function names self-explanatory?
- Is the code's intent obvious without comments?
- Are magic numbers replaced with named constants?
- Is there duplicate code that could be extracted?

**2. Function Quality**

- Does each function do ONE thing?
- Are there 2 or fewer parameters per function?
- Are functions at a single level of abstraction?
- Are side effects avoided?

**3. Error Handling**

- Are errors handled where they occur?
- Are Error objects used (not strings)?
- Are async errors properly caught?

**4. TypeScript (if applicable)**

- Is `any` type avoided?
- Are types specific and meaningful?
- Are interfaces/types properly defined?
  </review_checklist>

### Step 3: Manually Verify Functionality

**IMPORTANT**: Actually run the code to verify it works. Use parallel Tasks for different verification types:

#### First, Check Environment Configuration:

```bash
# Check for .env files and extract ports
if [ -f .env ]; then
    BACKEND_PORT=$(grep "^BACKEND_PORT=" .env | cut -d'=' -f2)
    FRONTEND_PORT=$(grep "^FRONTEND_PORT=" .env | cut -d'=' -f2)
fi

# Check apps/.env files for monorepo structure
if [ -f apps/api/.env ]; then
    BACKEND_PORT=$(grep "^BACKEND_PORT=" apps/api/.env | cut -d'=' -f2)
fi
if [ -f apps/expo/.env ]; then
    FRONTEND_PORT=$(grep "^FRONTEND_PORT=" apps/expo/.env | cut -d'=' -f2)
fi

# Default ports if not found
BACKEND_PORT=${BACKEND_PORT:-3000}
FRONTEND_PORT=${FRONTEND_PORT:-8081}

echo "Backend Port: $BACKEND_PORT"
echo "Frontend Port: $FRONTEND_PORT"
```

#### For API Changes:

```bash
# Start the API dev server in background
pnpm dev:api &
API_PID=$!

# Wait for server to start
sleep 5

# Test API endpoints with curl
curl -X GET http://localhost:$BACKEND_PORT/api/endpoint
curl -X POST http://localhost:$BACKEND_PORT/api/endpoint \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Check response status and data
# Kill server when done
kill $API_PID
```

#### For React Native/Expo Apps:

```bash
# Start Expo dev server
pnpm dev:expo &
EXPO_PID=$!

# Wait for Expo to start
sleep 10

# Use Playwright to verify UI loads
cat > test-ui.js << EOF
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Test main route loads
  await page.goto('http://localhost:${FRONTEND_PORT}');
  await page.waitForLoadState('networkidle');

  // Check for errors
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  // Test changed routes if applicable
  // await page.goto('http://localhost:${FRONTEND_PORT}/new-route');

  console.log('Errors found:', errors.length ? errors : 'None');
  await browser.close();
})();
EOF

node test-ui.js

# Kill Expo when done
kill $EXPO_PID
```

#### For Frontend Changes:

```bash
# Start the appropriate dev server
if [ -f package.json ] && grep -q "dev:expo" package.json; then
    pnpm dev:expo &
    DEV_PID=$!
    DEV_PORT=$FRONTEND_PORT
else
    pnpm dev:api &
    DEV_PID=$!
    DEV_PORT=$BACKEND_PORT
fi

sleep 8

# Use MCP Playwright tools to verify UI
# 1. Navigate to the app
mcp__playwright__browser_navigate --url "http://localhost:$DEV_PORT"

# 2. Take a snapshot to verify UI renders
mcp__playwright__browser_snapshot

# 3. Check for console errors
mcp__playwright__browser_console_messages

# 4. Test specific interactions if needed
mcp__playwright__browser_click --element "Submit button" --ref "button[type='submit']"

# Kill dev server when done
kill $DEV_PID
```

### Step 4: Analyze Code Quality

After verifying functionality, review the code:

```bash
# Review the diff focusing on changed lines only
cat pr_diff.patch

# For each file, check:
# 1. Does the implementation match what was tested?
# 2. Are there edge cases not covered?
# 3. Can the working code be simpler?
```

### Step 5: Write Focused Feedback

Create a single, clear review comment based on manual testing:

````bash
REVIEW_BODY=$(cat <<'EOF'
## Code Review for PR #${PR_NUMBER}

### 🧪 Manual Testing Results
- **API Tests**: [Passed/Failed - include curl results]
- **UI Tests**: [Loaded successfully / Found errors]
- **Console Errors**: [None / List any found]

### ✅ What Works
- [List 1-2 things done well]
- [Include what you verified works]

### 🔧 Issues Found
[Only list actual problems found during testing]

**Issue 1**: [Clear description]
- **File**: `path/file.ts:line`
- **Problem**: [What failed during testing]
- **Fix**: [Simple solution]
```suggestion
// Show corrected code
````

### 💡 Optional Improvements

[1-2 suggestions that maintain current scope]

**Summary**: [One sentence - Approve/Request changes based on testing]
EOF
)

````

### Step 6: Submit as GitHub Pull Request Review

**CRITICAL**: Submit as a proper PR review, not a comment. This creates a review that must be addressed/dismissed before merging.

```bash
# Determine review type based on testing results
if [[ "$REVIEW_BODY" == *"Failed"* ]] || [[ "$REVIEW_BODY" == *"Issues Found"* ]]; then
    REVIEW_TYPE="REQUEST_CHANGES"
    REVIEW_DECISION="request-changes"
elif [[ "$REVIEW_BODY" == *"Optional Improvements"* ]] && [[ "$REVIEW_BODY" != *"Issues Found"* ]]; then
    REVIEW_TYPE="COMMENT" 
    REVIEW_DECISION="comment"
else
    REVIEW_TYPE="APPROVE"
    REVIEW_DECISION="approve"
fi

# Submit as formal PR review (not just a comment!)
# This creates a review that blocks merging if changes are requested
gh pr review $PR_NUMBER \
    --body "$REVIEW_BODY" \
    --$REVIEW_DECISION

echo "✅ Formal PR review submitted for PR #$PR_NUMBER"
echo "📋 Review type: $REVIEW_TYPE (--$REVIEW_DECISION)"
echo "🧪 Manual testing completed"

# Verify review was submitted
echo ""
echo "Confirming review status:"
gh pr view $PR_NUMBER --json reviews --jq '.reviews[-1] | "Latest review: \(.state) by \(.author.login)"'
```

#### GitHub Review Types Explained:

- **`--approve`**: Approves the PR, allows merging
- **`--request-changes`**: Blocks PR from merging until changes are made and review is dismissed
- **`--comment`**: Leaves review feedback without approval/rejection (for optional suggestions)

**Important**: Only use `--request-changes` when there are actual failures or bugs found during testing. This blocks the PR from being merged until the review is addressed.

## Review Principles

### DO Review For:

1. **Broken functionality** - Code that doesn't work when tested
2. **Runtime errors** - Errors found during manual testing
3. **Clear bugs** - Logic errors discovered through testing
4. **Readability issues** - Confusing variable names, complex functions
5. **Unused code** - Dead code, commented code
6. **Simple improvements** - Easy wins that don't change architecture

### DON'T Suggest:

1. **New dependencies** - No new packages/libraries
2. **Testing setup** - If tests don't exist, don't suggest adding framework
3. **Architecture changes** - Work within current structure
4. **Perfection** - MVP means "good enough to ship"
5. **Future-proofing** - Focus on current requirements only

## Example Reviews

### Good MVP Review:

````
🧪 Manual Testing Results
- **Environment**: Backend on port 3000, Frontend on port 8081 (from .env)
- **API Tests**: Passed - GET /api/users returns 200
- **UI Tests**: Failed - Console error on user profile page
- **Console Errors**: TypeError: Cannot read property 'email' of null
- **Commands Run**: `pnpm dev:expo` and `pnpm dev:api`

✅ What Works
- User list loads correctly
- API authentication working
- Environment variables properly configured (FRONTEND_PORT=8081, BACKEND_PORT=3000)

🔧 Issues Found

**Issue 1**: Null reference causing UI crash
- **File**: `src/components/UserProfile.tsx:45`
- **Problem**: App crashes when user object is null (found during testing)
- **Fix**: Add optional chaining
```suggestion
const email = user?.email || '';
````

**Summary**: Request changes - fix null reference error before merging

```

### Over-Engineered Review (Avoid):
```

❌ "Consider adding Jest for unit testing"
❌ "You should implement a factory pattern here"
❌ "Add winston for better logging"
❌ "This needs 90% test coverage"

```

## Quick Execution Tips

1. **Always manually test** - Run the code to verify it actually works
2. **Use parallel Tasks** - Run server tests and UI tests simultaneously
3. **Use bg:start scripts** - Leverage background process scripts from CLAUDE.md
4. **Focus on runtime issues** - What breaks when you actually use it?
5. **Document test results** - Include what you tested and the outcomes
6. **Kill test processes** - Clean up servers/apps after testing
7. **Submit proper PR reviews** - Use `gh pr review` with appropriate flags, not just comments

## Manual Testing Checklist

- [ ] Check .env files for correct ports
- [ ] Run `pnpm dev:api` for API changes
- [ ] Run `pnpm dev:expo` for UI changes
- [ ] Server starts without errors
- [ ] API endpoints return expected data (test with curl)
- [ ] UI loads without console errors (check with Playwright)
- [ ] User interactions work as expected
- [ ] No runtime exceptions during normal use
- [ ] All background processes killed after testing
- [ ] Submit formal PR review with `--approve`, `--request-changes`, or `--comment`

## Common Port Configurations

- **Backend API**: Port 3000 (defined as `BACKEND_PORT` in `.env`)
- **Frontend/Expo**: Port 8081 (defined as `FRONTEND_PORT` in `.env`)
- **Environment variables**: `FRONTEND_PORT=8081`, `BACKEND_PORT=3000`

Remember: The goal is to ship working features incrementally. If it runs without errors and solves the problem, it's good enough for MVP.
```

ultrathink and do as much work in parallel as possible

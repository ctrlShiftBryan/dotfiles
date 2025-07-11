# GitHub Issue Workflow - Continue

Resume work on the worktree/branch: $ARGUMENTS

You are currently in the root directory on the main branch. This command expects a worktree/branch name as an argument (e.g., `issue-10-fix-bug`).

## Recovery Steps

### 1. Validate and locate worktree

- Ensure a worktree name was provided (if not, error: "Please specify a worktree/branch name")
- Check if the worktree directory exists (if not, list available worktrees with `git worktree list`)
- Switch to the worktree directory: `cd ./$ARGUMENTS`
- Verify you're on the correct branch
- Extract the issue number from the branch name (e.g., `issue-10-fix-bug` → issue #10)

### 2. Assess current state

- Check git status to see uncommitted changes
- Review the issue on GitHub using the extracted issue number (e.g., `gh issue view 10`)
- Check the issue comments to understand:
  - When work started (from the timestamp comment)
  - Any blockers mentioned
  - Current progress notes
- Check if a pull request exists for this branch
- Run tests to see current pass/fail status

### 3. Determine position in workflow

Based on your assessment, identify where you left off:

- **If no PR exists**: Return to Step 2 (Set up development) - create the PR
- **If PR exists but tests are failing**: Return to Step 3 (Implementation)
- **If tests pass but docs aren't updated**: Continue Step 3 (update CLAUDE.md/README.md)
- **If everything looks complete**: Jump to Step 4 (Complete the work)
- **If issue has 'blocked' label**: Read the blocker comment and attempt to resolve

### 4. Resume work

Continue from the identified step in the original workflow:

#### Implementation (if needed)

- Review `CLAUDE.md` for any repo-specific instructions and follow them
- Fix any failing tests or implement missing features
- Make conventional commits and push as you work
- Update both `CLAUDE.md` and `README.md` to reflect any changes made by your implementation
- **All work should be done in the worktree directory**

#### Complete the work (if implementation is done)

- Commit and push all final changes to the feature branch
- Once all tests pass and documentation is updated:
  - Add a comment to the issue asking for verification that includes:
    - A brief summary of how the issue was fixed
    - Screenshots from the playwright mcp server showing the feature working
  - Add the 'complete' label to the issue
- Do NOT close the issue, delete the branch, or remove the worktree

#### Handle blockers (if needed)

**If you cannot proceed** (unclear requirements, cannot write tests, implementation failures, etc.):

- Add a comment to the issue explaining the specific blocker
- Change the issue label to "blocked"
- Stop work on this issue

## Notes

- Always work in the worktree directory, not the main repository
- Check commit history to understand what's already been done
- If unsure about the state, it's better to re-run tests and checks than assume
- The issue should remain open for verification even when complete

## Usage

This command should be invoked with the worktree/branch name as an argument:

```
/github-continue issue-10-fix-bug
```

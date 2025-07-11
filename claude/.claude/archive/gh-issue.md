# GitHub Issue Workflow

Find the oldest unassigned issue with the highest priority label in the GitHub repo using the gh CLI tool. Process only one issue following these steps.

## Steps

### 1. Claim the issue

- Assign it to `ctrlshiftbryan`
- Add a comment stating the current time you started working on it

### 2. Set up development

- Create a new feature branch for this issue
- Create a git worktree in a child folder matching the branch name (e.g., if branch is `issue-10-fix-bug`, create worktree at `./issue-10-fix-bug`)
- Switch to the worktree directory
- Make an initial commit (e.g., update README with issue reference or create placeholder files)
- Push the branch
- Create a pull request for the branch

### 3. Implementation

- Review `CLAUDE.md` for any repo-specific instructions and follow them
- Write tests first following the repo's existing testing patterns
- Implement the feature until all tests pass
- Make conventional commits and push as you work
- Update both `CLAUDE.md` and `README.md` to reflect any changes made by your implementation
- **All work should be done in the worktree directory**

### 4. Complete the work

- Commit and push all final changes to the feature branch
- Once all tests pass and documentation is updated:
  - Add a comment to the issue asking for verification that includes:
    - A brief summary of how the issue was fixed
    - Screenshots from the playwright mcp server showing the feature working
  - Add the 'complete' label to the issue
- Do NOT close the issue, delete the branch, or remove the worktree

### 5. Handle blockers

**If you cannot proceed** (unclear requirements, cannot write tests, implementation failures, etc.):

- Add a comment to the issue explaining the specific blocker
- Change the issue label to "blocked"
- Stop work on this issue

## Notes

- Each issue represents a feature request that defines the work to be done
- Priority is determined by issue labels, with the oldest issue among the highest priority ones selected first
- Git worktrees keep the main repository clean and allow easy switching between issues
- The issue remains open for verification after completion - do not close it yourself

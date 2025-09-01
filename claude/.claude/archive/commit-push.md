Please review the current git diff and create commits that follow these guidelines:

## Branch Protection Check

CRITICAL: First check the current branch. If on main or master branch, ABORT immediately:

```bash
# Check current branch
current_branch=$(git branch --show-current)
if [[ "$current_branch" == "main" || "$current_branch" == "master" ]]; then
  echo "❌ ERROR: You are on the $current_branch branch!"
  echo "⚠️  Direct commits to main/master are not allowed."
  echo "📌 Please create a feature branch first:"
  echo "   git checkout -b feature/your-feature-name"
  exit 1
fi
```

## Task Tool Usage Guidelines

IMPORTANT: Use the Task tool for ALL research and exploratory work. Execute multiple Tasks in parallel for maximum efficiency.

Before analyzing the diff, launch these Tasks in parallel to gather context:

```
Use Task tool to simultaneously:
1. Search for test files related to changed code
2. Find documentation that mentions modified components  
3. Look for recent similar commits to understand patterns
4. Check for configuration files that reference changed code
5. Search for TODO/FIXME comments in changed files
```

This parallel research helps ensure:
- Related tests are updated
- Documentation stays in sync
- Commit messages follow project conventions
- No debug code is accidentally committed
- All dependent files are included

## Analyzing Changes

Analyze the changes and group them into logical, atomic commits based on their purpose and scope. Each commit should represent a single, coherent change to the codebase. When reviewing the diff, identify distinct areas of modification such as feature additions, bug fixes, refactoring, documentation updates, configuration changes, or dependency updates.

Use conventional commit format where appropriate, following this structure:

- feat: for new features
- fix: for bug fixes
- docs: for documentation changes
- style: for formatting changes that don't affect code meaning
- refactor: for code restructuring without changing functionality
- test: for adding or modifying tests
- chore: for maintenance tasks, dependency updates, or configuration changes
- perf: for performance improvements

For each commit message, include a clear, concise subject line (under 72 characters) and, when necessary, a body that explains the why behind the change, not just the what. If a change addresses a specific issue or relates to a particular component, include that context.

## Pre-Commit Validation

Before creating each commit, use Task tool in parallel to verify:
- No console.log or debug statements in the changes
- No hardcoded secrets or API keys
- All related test files are included if code was changed
- Documentation is updated if public APIs changed

Before creating commits, first analyze and describe the different logical groupings you've identified in the diff. Then proceed to create separate commits for each group, pushing each commit immediately after creating it. This ensures that work is continuously synchronized with the remote repository and reduces the risk of conflicts.

Avoid combining unrelated changes into a single commit, even if they're small. It's better to have multiple focused commits than one large commit with mixed purposes.

If changes are interdependent, order the commits logically so that each commit leaves the codebase in a working state. When in doubt about grouping, err on the side of smaller, more focused commits rather than larger ones.

Please begin by examining the git diff and identifying the logical groups of changes before proceeding with the commits. After creating each commit, push it to the remote repository before moving on to the next commit.

## Pull Request Summary Comment

After all commits have been created and pushed, check if the current branch is associated with a pull request:

```bash
# Check if branch has an associated PR
pr_number=$(gh pr view --json number -q .number 2>/dev/null)

if [[ -n "$pr_number" ]]; then
  echo "📝 Branch is associated with PR #$pr_number"
  
  # Get commits since PR base branch
  base_branch=$(gh pr view --json baseRefName -q .baseRefName)
  commits=$(git log --oneline "$base_branch"..HEAD)
  
  # Create summary comment
  summary="## 📊 Commit Summary

This update includes the following commits:

\`\`\`
$commits
\`\`\`

### Changes Overview:
"
  
  # Analyze commit types
  feat_count=$(echo "$commits" | grep -c "^[[:alnum:]]* feat:" || true)
  fix_count=$(echo "$commits" | grep -c "^[[:alnum:]]* fix:" || true)
  docs_count=$(echo "$commits" | grep -c "^[[:alnum:]]* docs:" || true)
  test_count=$(echo "$commits" | grep -c "^[[:alnum:]]* test:" || true)
  refactor_count=$(echo "$commits" | grep -c "^[[:alnum:]]* refactor:" || true)
  chore_count=$(echo "$commits" | grep -c "^[[:alnum:]]* chore:" || true)
  
  [[ $feat_count -gt 0 ]] && summary="$summary
- ✨ **Features**: $feat_count new feature(s)"
  [[ $fix_count -gt 0 ]] && summary="$summary
- 🐛 **Fixes**: $fix_count bug fix(es)"
  [[ $docs_count -gt 0 ]] && summary="$summary
- 📚 **Documentation**: $docs_count update(s)"
  [[ $test_count -gt 0 ]] && summary="$summary
- 🧪 **Tests**: $test_count test update(s)"
  [[ $refactor_count -gt 0 ]] && summary="$summary
- ♻️ **Refactoring**: $refactor_count code improvement(s)"
  [[ $chore_count -gt 0 ]] && summary="$summary
- 🔧 **Maintenance**: $chore_count maintenance task(s)"
  
  # Post comment to PR
  gh pr comment "$pr_number" --body "$summary"
  echo "✅ Posted commit summary to PR #$pr_number"
fi
```

# GitHub Pull Request Code Review

You are an expert software engineer specializing in code review and quality assurance. Your task is to perform a comprehensive code review of a pull request, focusing on code quality, architecture, security, and best practices.

## Task

Perform a thorough code review of the pull request associated with issue #$ARGUMENTS and post detailed feedback as PR review comments.

## Task Tool Usage Guidelines

IMPORTANT: Use the Task tool for ALL analysis work. Execute multiple Tasks in parallel for 5-10x faster review preparation.

## Workflow

### Step 1: Gather All Review Context in Parallel

**Note: Execute the bash commands below inside Task tools for parallel processing**

Launch ALL of these Tasks simultaneously in a single message:

1. **Fetch PR Details and Diff Task**
   ```bash
   # Get the PR associated with the issue
   PR_NUMBER=$(gh pr list --search "issue:$ARGUMENTS" --json number --jq '.[0].number')
   
   if [ -z "$PR_NUMBER" ]; then
       echo "❌ No pull request found for issue #$ARGUMENTS"
       exit 1
   fi
   
   echo "📋 Reviewing PR #$PR_NUMBER for issue #$ARGUMENTS"
   
   # Fetch PR details
   PR_DATA=$(gh pr view $PR_NUMBER --json title,body,commits,files,additions,deletions,changedFiles)
   PR_TITLE=$(echo "$PR_DATA" | jq -r '.title')
   PR_BODY=$(echo "$PR_DATA" | jq -r '.body')
   CHANGED_FILES=$(echo "$PR_DATA" | jq -r '.changedFiles')
   
   echo "📊 PR Stats: $CHANGED_FILES files changed"
   
   # Get the diff for review
   gh pr diff $PR_NUMBER > pr_diff_${PR_NUMBER}.patch
   ```

2. **Retrieve Implementation Context Task**
   ```bash
   # Fetch the implementation plan from the issue comments
   ISSUE_DATA=$(gh issue view $ARGUMENTS --json comments)
   PLAN_COMMENT=$(echo "$ISSUE_DATA" | jq -r '.comments[] | select(.body | contains("Implementation Plan")) | .body')
   
   # Also check for plan file in the repository
   if [ -f "IMPLEMENTATION_PLAN_${ARGUMENTS}.md" ]; then
       PLAN_FILE_CONTENT=$(cat "IMPLEMENTATION_PLAN_${ARGUMENTS}.md")
   fi
   
   # Get original requirements
   ISSUE_BODY=$(gh issue view $ARGUMENTS --json body --jq '.body')
   ```

3. **Analyze Code Patterns Task**
   ```bash
   # Search for similar patterns in the codebase
   FILES_IN_PR=$(gh pr view $PR_NUMBER --json files --jq '.files[].path')
   
   for FILE in $FILES_IN_PR; do
       # Extract key terms from the file
       BASENAME=$(basename "$FILE")
       DIRNAME=$(dirname "$FILE")
       
       # Search for similar files
       find . -name "*${BASENAME%.*}*" -type f | grep -E '\.(ts|tsx|js|jsx)$'
       
       # Search for similar patterns
       grep -r "similar_pattern" --include="*.ts" --include="*.tsx" "$DIRNAME" | head -10
   done
   ```

4. **Security and Performance Scan Task**
   ```bash
   # Common security antipatterns
   grep -r "eval\|innerHTML\|dangerouslySetInnerHTML" --include="*.ts" --include="*.tsx" .
   grep -r "password.*=.*['\"]" --include="*.ts" --include="*.tsx" .
   
   # Performance bottlenecks
   grep -r "forEach.*forEach\|map.*map" --include="*.ts" --include="*.tsx" .
   grep -r "JSON\.parse.*JSON\.stringify" --include="*.ts" --include="*.tsx" .
   
   # Check for exposed secrets
   grep -r "api_key\|secret\|token\|password" --include="*.ts" --include="*.tsx" . | grep -v "process.env"
   ```

5. **Testing Analysis Task**
   ```bash
   # Find test files for changed code
   FILES_IN_PR=$(gh pr view $PR_NUMBER --json files --jq '.files[].path')
   
   for FILE in $FILES_IN_PR; do
       # Find corresponding test files
       BASENAME=$(basename "$FILE" | sed 's/\.[^.]*$//')
       find . -name "${BASENAME}.test.*" -o -name "${BASENAME}.spec.*"
       
       # Check if tests exist
       TEST_DIR=$(dirname "$FILE")/__tests__
       ls -la "$TEST_DIR" 2>/dev/null
   done
   
   # Check overall test patterns
   find . -name "*.test.*" -o -name "*.spec.*" | head -10
   ```

This parallel approach gathers all context in ~30 seconds instead of 3-5 minutes sequentially.

### Step 2: Systematic Code Review Framework

Based on the parallel Task results, perform a comprehensive review:

<code_review_checklist>
**Review the code changes across multiple dimensions:**

1. **Architecture & Design**
   - Does the implementation follow the planned architecture?
   - Are components properly separated with clear responsibilities?
   - Is the code structure maintainable and extensible?
   - Are design patterns used appropriately?
   - Does it follow SOLID principles?

2. **Code Quality & Style**
   - Is the code readable and self-documenting?
   - Are naming conventions consistent and meaningful?
   - Is there appropriate commenting for complex logic?
   - Are functions/methods focused and not too long?
   - Is there code duplication that could be refactored?

3. **TypeScript/Type Safety** (if applicable)
   - Are TypeScript types properly defined and used?
   - Are there any `any` types that should be more specific?
   - Are interfaces and type definitions comprehensive?
   - Is type inference used appropriately?
   - Are generic types used where beneficial?

4. **React Best Practices** (if applicable)
   - Are hooks used correctly (dependency arrays, cleanup)?
   - Is component composition optimal?
   - Are performance optimizations needed (memo, useMemo, useCallback)?
   - Is state management appropriate (local vs global)?
   - Are side effects properly handled?

5. **Testing Coverage**
   - Are all new functions/components tested?
   - Do tests cover edge cases and error scenarios?
   - Are tests meaningful and not just for coverage?
   - Is the test structure clear and maintainable?
   - Are mocks used appropriately?

6. **Security Considerations**
   - Is user input properly validated and sanitized?
   - Are there any potential XSS vulnerabilities?
   - Is authentication/authorization handled correctly?
   - Are sensitive data properly protected?
   - Are dependencies secure and up-to-date?

7. **Performance Impact**
   - Are there any obvious performance bottlenecks?
   - Is data fetching optimized (no N+1 queries)?
   - Are large lists virtualized if needed?
   - Is bundle size impact reasonable?
   - Are images and assets optimized?

8. **Error Handling**
   - Are errors caught and handled gracefully?
   - Is error feedback user-friendly?
   - Are error boundaries used (React)?
   - Is logging appropriate for debugging?
   - Are edge cases considered?

9. **Documentation**
   - Is the code self-documenting?
   - Are complex algorithms explained?
   - Are API changes documented?
   - Is README updated if needed?
   - Are JSDoc/TSDoc comments added where helpful?

10. **Accessibility**
    - Are semantic HTML elements used?
    - Is keyboard navigation supported?
    - Are ARIA attributes used correctly?
    - Is color contrast sufficient?
    - Are images properly labeled?
</code_review_checklist>

### Step 3: Analyze Each Changed File

**Execute the following file analysis in a Task tool:**

```bash
# Get list of changed files
FILES=$(gh pr view $PR_NUMBER --json files --jq '.files[].path')

# For each file, analyze the changes
for FILE in $FILES; do
    echo "Reviewing: $FILE"
    
    # Get the file diff
    gh pr diff $PR_NUMBER -- "$FILE"
    
    # Analyze based on file type
    case "$FILE" in
        *.tsx|*.ts)
            # TypeScript/React specific checks
            echo "Checking TypeScript/React patterns..."
            # Check for any types
            grep -n "any" "$FILE" || true
            # Check for proper imports
            grep -n "^import" "$FILE" | head -10
            # Check component structure
            grep -n "export.*function\|export.*const" "$FILE"
            ;;
        *.test.*|*.spec.*)
            # Test file specific checks
            echo "Reviewing test coverage and quality..."
            # Check for describe blocks
            grep -n "describe\|it\|test" "$FILE"
            # Check for proper mocking
            grep -n "mock\|jest\|vitest" "$FILE" || true
            ;;
        *.css|*.scss)
            # Style file checks
            echo "Checking styles and responsiveness..."
            # Check for hardcoded values
            grep -n "[0-9]px" "$FILE" | head -10
            # Check for media queries
            grep -n "@media" "$FILE" || true
            ;;
    esac
done
```

### Step 4: Generate Review Comments

Create structured feedback organized by severity:

```bash
# Prepare review comments
REVIEW_BODY=$(cat <<'REVIEW'
## 🔍 Code Review for PR #${PR_NUMBER}

I've completed a comprehensive review of this pull request. Here's my detailed feedback organized by priority:

### ✅ Positive Observations

[List things done well - important for morale and learning]
- Clean separation of concerns in [component/module]
- Good test coverage for [feature]
- Excellent error handling in [area]
- Well-documented complex logic in [file]

### 🚨 Critical Issues (Must Fix)

[Issues that could cause bugs, security problems, or major performance issues]

**1. [Issue Title]**
- **File**: `path/to/file.ts:line`
- **Issue**: [Detailed description]
- **Impact**: [Why this is critical]
- **Suggestion**: [How to fix it]
```typescript
// Example of suggested fix
```

### ⚠️ Important Improvements (Should Fix)

[Issues that affect code quality, maintainability, or minor performance]

**1. [Issue Title]**
- **File**: `path/to/file.ts:line`
- **Issue**: [Description]
- **Suggestion**: [Improvement recommendation]

### 💡 Suggestions (Consider)

[Nice-to-have improvements, style suggestions, or optimization opportunities]

**1. [Suggestion Title]**
- **File**: `path/to/file.ts`
- **Current**: [Current approach]
- **Alternative**: [Suggested approach]
- **Benefit**: [Why this would be better]

### 📊 Code Quality Metrics

- **Test Coverage**: [Estimate based on test files]
- **Type Safety**: [TypeScript usage assessment]
- **Documentation**: [Code clarity assessment]
- **Performance**: [Any concerns or confirmations]
- **Security**: [Security check results]

### 🧪 Testing Recommendations

Additional tests to consider:
- [ ] Edge case: [Description]
- [ ] Error scenario: [Description]
- [ ] Performance test: [Description]

### 📚 Documentation Updates

Suggested documentation improvements:
- [ ] Update README with [specific section]
- [ ] Add JSDoc for [complex function]
- [ ] Document new API endpoints

### ✨ Overall Assessment

[Summary paragraph about the overall quality of the PR, highlighting both strengths and areas for improvement]

**Recommendation**: [Approve with changes / Request changes / Needs discussion]

---

🤖 *Code review performed by automated assistant - focusing on best practices, security, and maintainability*
REVIEW
)
```

### Step 5: Add Inline Comments

Add specific inline comments on the PR diff:

```bash
# For critical issues, add inline comments
# Example structure for each inline comment
gh pr review $PR_NUMBER --comment --body "Issue: [specific problem]
Suggestion: [how to fix]
Example:
\`\`\`typescript
// corrected code
\`\`\`"

# Add comments for specific lines
# This would be done for each identified issue with file and line context
```

### Step 6: Submit Review

Submit the comprehensive review:

```bash
# Determine review type based on severity of issues
if [ "$CRITICAL_ISSUES" -gt 0 ]; then
    REVIEW_TYPE="REQUEST_CHANGES"
    REVIEW_SUMMARY="Found $CRITICAL_ISSUES critical issues that need to be addressed"
elif [ "$IMPORTANT_ISSUES" -gt 0 ]; then
    REVIEW_TYPE="COMMENT"
    REVIEW_SUMMARY="Found $IMPORTANT_ISSUES important improvements to consider"
else
    REVIEW_TYPE="APPROVE"
    REVIEW_SUMMARY="Code looks good with minor suggestions"
fi

# Submit the review
gh pr review $PR_NUMBER \
    --body "$REVIEW_BODY" \
    --$REVIEW_TYPE

echo "✅ Submitted code review for PR #$PR_NUMBER"
echo "📊 Review type: $REVIEW_TYPE"
echo "💬 Review summary: $REVIEW_SUMMARY"
```

### Step 7: Create Review Summary File

Save the review for future reference:

```bash
# Create a review summary file
REVIEW_FILE="CODE_REVIEW_PR_${PR_NUMBER}.md"

cat > "$REVIEW_FILE" << EOF
# Code Review Summary - PR #${PR_NUMBER}

**Date**: $(date)
**PR Title**: ${PR_TITLE}
**Related Issue**: #${ARGUMENTS}
**Review Type**: ${REVIEW_TYPE}

## Summary
${REVIEW_SUMMARY}

## Critical Issues Found
[List of critical issues if any]

## Improvements Suggested
[List of important improvements]

## Files Reviewed
${FILES}

## Next Steps
- [ ] Developer addresses critical issues
- [ ] Re-review after changes
- [ ] Merge when all issues resolved
EOF

echo "📄 Created review summary: $REVIEW_FILE"
```

## Review Comment Best Practices

**When providing feedback:**

1. **Be Specific**: Reference exact lines and provide concrete examples
2. **Be Constructive**: Suggest solutions, not just problems
3. **Be Balanced**: Acknowledge good practices as well as issues
4. **Be Clear**: Explain why something is an issue and its impact
5. **Be Prioritized**: Clearly distinguish must-fix from nice-to-have

**Comment Format Examples:**

**Critical Issue:**
```
🚨 **Security Issue**: SQL Injection Vulnerability
File: `src/api/users.ts:45`

The user input is directly concatenated into the SQL query without sanitization:
\`\`\`typescript
const query = `SELECT * FROM users WHERE name = '${userName}'`;
\`\`\`

This allows SQL injection attacks. Use parameterized queries instead:
\`\`\`typescript
const query = 'SELECT * FROM users WHERE name = ?';
const result = await db.query(query, [userName]);
\`\`\`
```

**Performance Suggestion:**
```
⚡ **Performance**: Unnecessary Re-renders
File: `src/components/UserList.tsx:23`

The inline object creation causes unnecessary re-renders:
\`\`\`typescript
<ChildComponent style={{ margin: 10 }} />
\`\`\`

Consider memoizing the style object:
\`\`\`typescript
const childStyle = useMemo(() => ({ margin: 10 }), []);
// ...
<ChildComponent style={childStyle} />
\`\`\`
```

## Automated Checks to Include

Run these checks as part of the review:

1. **Linting**: Check for ESLint/TSLint violations
2. **Type Check**: Run TypeScript compiler in strict mode
3. **Test Coverage**: Verify test coverage hasn't decreased
4. **Bundle Size**: Check impact on bundle size
5. **Dependencies**: Scan for vulnerable dependencies
6. **Code Complexity**: Check cyclomatic complexity

## Success Criteria

- All changed files are reviewed thoroughly
- Feedback is organized by severity and actionable
- Positive aspects are highlighted alongside issues
- Suggestions include concrete examples
- Review helps improve code quality and developer skills
- Security and performance impacts are assessed
- Review is completed in a timely manner

Execute this code review workflow now for the PR associated with issue #$ARGUMENTS.
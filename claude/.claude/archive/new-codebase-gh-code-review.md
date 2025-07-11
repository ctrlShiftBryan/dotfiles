# New Codebase: First Code Review

You are an expert software engineer providing the first code review for a new project. Your task is to review the initial implementation, focusing on architecture decisions, code quality standards, and establishing best practices for the project.

## Task

Perform a comprehensive review of the initial implementation PR for the new project created from issue #$ARGUMENTS.

## Initial Setup Review Context

For new projects, the first PR typically includes:
- Project initialization and structure
- Core architecture implementation
- Development tooling configuration
- Initial feature implementation
- Testing setup

## Workflow

### Step 1: Gather Project Context

```bash
# Get the PR associated with the issue
PR_NUMBER=$(gh pr list --search "issue:$ARGUMENTS" --json number --jq '.[0].number')

if [ -z "$PR_NUMBER" ]; then
    echo "❌ No pull request found for issue #$ARGUMENTS"
    exit 1
fi

echo "📋 Reviewing initial implementation PR #$PR_NUMBER for issue #$ARGUMENTS"

# Fetch PR details
PR_DATA=$(gh pr view $PR_NUMBER --json title,body,commits,files,additions,deletions,changedFiles)
PR_TITLE=$(echo "$PR_DATA" | jq -r '.title')
CHANGED_FILES=$(echo "$PR_DATA" | jq -r '.changedFiles')

echo "📊 PR Stats: $CHANGED_FILES files in initial implementation"
```

### Step 2: Architecture and Setup Review

Launch these Tasks in parallel to review the foundation:

```
Use Task tool to simultaneously:
1. Review project structure and organization
2. Analyze technology choices and dependencies
3. Evaluate development tool configurations
4. Check security setup and environment handling
5. Assess testing framework and initial coverage
```

### Step 3: New Project Review Checklist

<new_project_review>
**Review the initial implementation across these dimensions:**

## 1. Project Foundation

### Directory Structure
- [ ] Clear and logical organization
- [ ] Separation of concerns
- [ ] Scalable structure for growth
- [ ] Consistent naming conventions

```bash
# Review structure
tree -I 'node_modules|dist|build' -L 3
```

### Configuration Files
- [ ] TypeScript config is strict and appropriate
- [ ] ESLint rules match project needs
- [ ] Prettier config for consistent formatting
- [ ] Git hooks configured properly
- [ ] CI/CD pipeline established

### Documentation
- [ ] README with clear setup instructions
- [ ] Architecture decisions documented
- [ ] Environment setup guide
- [ ] Contributing guidelines

## 2. Development Environment

### Package.json Review
```javascript
// Check for:
- Appropriate scripts for development workflow
- Correct dependency classifications (dev vs prod)
- Version constraints properly set
- No unnecessary dependencies
- Security audit passing
```

### TypeScript Configuration
```typescript
// Verify:
- Strict mode enabled
- Path aliases configured
- Appropriate lib and target
- Source maps for debugging
```

### Testing Setup
```javascript
// Ensure:
- Test framework properly configured
- Coverage thresholds set
- Test utilities created
- Mock strategies defined
```

## 3. Code Quality Standards

### Initial Components/Modules
- [ ] Follow consistent patterns
- [ ] Proper TypeScript typing
- [ ] Good separation of concerns
- [ ] Reusable and composable

### Error Handling Strategy
- [ ] Consistent error handling approach
- [ ] Proper error boundaries (React)
- [ ] Logging strategy defined
- [ ] User-friendly error messages

### State Management
- [ ] Appropriate for project size
- [ ] Clear data flow
- [ ] Type-safe implementations
- [ ] Performance considerations

## 4. Security Foundations

### Environment Variables
```bash
# Check:
- .env.example provided
- Sensitive data excluded from repo
- Proper .gitignore configuration
- Environment validation
```

### Dependencies
```bash
# Audit for:
- Known vulnerabilities
- Unnecessary packages
- Proper licensing
- Update strategy
```

### Authentication Setup (if applicable)
- [ ] Secure session management
- [ ] Proper token handling
- [ ] CORS configuration
- [ ] Rate limiting considered

## 5. Performance Baseline

### Build Configuration
- [ ] Appropriate bundling strategy
- [ ] Code splitting implemented
- [ ] Asset optimization
- [ ] Development vs production configs

### Initial Metrics
```bash
# Measure:
- Bundle size
- Build time
- Test execution time
- Lighthouse scores (if web app)
```

## 6. Testing Strategy

### Unit Tests
- [ ] Testing utilities created
- [ ] Mock strategies defined
- [ ] Coverage goals set
- [ ] Example tests demonstrate patterns

### Integration Tests
- [ ] Test database strategy
- [ ] API testing approach
- [ ] E2E test foundation

### CI/CD Pipeline
- [ ] Automated testing on PR
- [ ] Build verification
- [ ] Linting and formatting checks
- [ ] Security scanning

## 7. Framework-Specific Considerations

### For React Projects
- [ ] Component structure patterns
- [ ] Hook usage guidelines
- [ ] Performance optimization setup
- [ ] Accessibility foundations

### For API Projects
- [ ] Route organization
- [ ] Middleware strategy
- [ ] Database connection handling
- [ ] API documentation approach

### For Full-Stack Projects
- [ ] Frontend-backend communication
- [ ] Type sharing strategy
- [ ] Build coordination
- [ ] Deployment considerations

</new_project_review>

### Step 4: Generate Comprehensive Review

Create structured feedback for the initial implementation:

```bash
REVIEW_BODY=$(cat <<'REVIEW'
# 🏗️ Initial Implementation Review for PR #${PR_NUMBER}

## 📋 Overview
This review covers the initial implementation and project setup for issue #${ISSUE_NUMBER}. As this is the foundation for the project, I'm focusing on architecture decisions, code patterns, and establishing quality standards.

## ✅ Strengths of the Implementation

### Architecture & Setup
- [Positive observations about project structure]
- [Good technology choices]
- [Well-configured development environment]

### Code Quality
- [Clean code patterns observed]
- [Good TypeScript usage]
- [Effective component/module design]

### Testing & Documentation
- [Test coverage approach]
- [Documentation completeness]
- [Clear setup instructions]

## 🚨 Critical Issues (Must Fix Before Merge)

### 1. [Critical Issue Title]
**File**: `path/to/file.ts:line`
**Issue**: [Detailed description]
**Impact**: This could cause [specific problems]
**Fix Required**:
```typescript
// Current problematic code
const data = JSON.parse(userInput); // Unsafe!

// Suggested fix
import { z } from 'zod';
const schema = z.object({ /* ... */ });
const data = schema.parse(userInput);
```

## ⚠️ Important Improvements (Should Address)

### 1. Missing Error Boundaries
**Impact**: Unhandled errors will crash the entire application
**Suggestion**: Implement error boundaries for major sections
```typescript
// Add to src/components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component {
  // Implementation
}
```

### 2. Environment Variable Validation
**File**: Project root
**Issue**: No runtime validation of required environment variables
**Suggestion**: Add validation on startup
```typescript
// src/lib/env.ts
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  API_KEY: z.string().min(1),
});

export const env = envSchema.parse(process.env);
```

### 3. Test Coverage Gaps
**Current Coverage**: ~40%
**Target**: >80%
**Missing Tests**:
- [ ] API route handlers
- [ ] Error scenarios
- [ ] Edge cases for data validation

## 💡 Suggestions for Project Excellence

### 1. Implement Conventional Commits
```json
// package.json
"scripts": {
  "commit": "cz"
},
"devDependencies": {
  "commitizen": "^4.0.0",
  "cz-conventional-changelog": "^3.0.0"
}
```

### 2. Add Pre-commit Type Checking
```json
// .husky/pre-commit
npm run typecheck
```

### 3. Create Component Documentation
Consider adding Storybook for component documentation:
```bash
npx storybook@latest init
```

### 4. Performance Monitoring
Add basic performance monitoring:
```typescript
// src/lib/performance.ts
export const measurePerformance = (
  name: string,
  fn: () => void
) => {
  performance.mark(`${name}-start`);
  fn();
  performance.mark(`${name}-end`);
  performance.measure(name, `${name}-start`, `${name}-end`);
};
```

## 📊 Code Quality Metrics

### Current State
- **TypeScript Coverage**: 95% (excellent)
- **Test Coverage**: 40% (needs improvement)
- **Bundle Size**: 150KB (reasonable for initial setup)
- **Lighthouse Score**: 92/100 (good foundation)
- **Accessibility**: Needs ARIA labels in forms

### Recommendations
1. Increase test coverage to 80%+
2. Add accessibility tests
3. Implement bundle size monitoring
4. Set up performance budgets

## 🔒 Security Review

### ✅ Good Practices Observed
- Environment variables properly excluded
- Input validation on API routes
- CORS configuration appropriate

### ⚠️ Areas for Improvement
1. Add rate limiting to API routes
2. Implement CSRF protection
3. Add security headers (helmet.js)
4. Set up dependency vulnerability scanning

## 🧪 Testing Recommendations

### Additional Tests Needed
```typescript
// src/__tests__/api/auth.test.ts
describe('Authentication', () => {
  it('should handle invalid credentials', async () => {
    // Test implementation
  });
  
  it('should rate limit login attempts', async () => {
    // Test implementation
  });
});
```

### E2E Test Foundation
```typescript
// e2e/setup.spec.ts
test('initial application loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Your App/);
});
```

## 📚 Documentation Improvements

### Add These Documents
1. `ARCHITECTURE.md` - Explain key decisions
2. `CONTRIBUTING.md` - Development guidelines
3. `SECURITY.md` - Security policies
4. `API.md` - API documentation

### Code Documentation
Add JSDoc to key functions:
```typescript
/**
 * Validates and processes user input
 * @param input - Raw user input
 * @returns Validated data object
 * @throws {ValidationError} If input is invalid
 */
export function processUserInput(input: unknown): UserData {
  // Implementation
}
```

## ✅ Pre-Merge Checklist

- [ ] All critical issues addressed
- [ ] Tests passing with >70% coverage
- [ ] No TypeScript errors
- [ ] Documentation updated
- [ ] Security vulnerabilities resolved
- [ ] Performance baseline established

## 🎯 Next Steps After Merge

1. **Immediate**:
   - Set up monitoring and error tracking
   - Configure staging environment
   - Create project board for feature tracking

2. **Week 1**:
   - Implement core features from plan
   - Increase test coverage to 80%
   - Add E2E tests for critical paths

3. **Ongoing**:
   - Weekly dependency updates
   - Performance monitoring
   - Security scanning

## 🌟 Overall Assessment

This is a **solid foundation** for the project. The architecture is well-thought-out, and the initial patterns are clean. Address the critical issues and important improvements, and this will be an excellent starting point.

**Recommendation**: Fix critical issues, then ✅ **Approve** with the understanding that improvements will be addressed in follow-up PRs.

---

**Review Standards for Future PRs**:
1. Maintain >80% test coverage
2. No TypeScript `any` types
3. All components accessible
4. Performance impact documented
5. Security implications considered

Great work on the initial implementation! 🚀

---
*🤖 Code Review by AI Assistant | Focus: Foundation & Best Practices*
REVIEW
)

# Post the review
gh pr review $PR_NUMBER \
  --body "$REVIEW_BODY" \
  --request-changes

echo "✅ Posted initial implementation review"
```

### Step 5: Add Inline Comments

```bash
# Add specific inline comments on critical issues
gh pr review $PR_NUMBER --comment --body "🚨 Security Issue: Never parse user input directly without validation. Use a schema validation library like Zod."

gh pr review $PR_NUMBER --comment --body "💡 Suggestion: Consider extracting this into a custom hook for reusability across components."

gh pr review $PR_NUMBER --comment --body "📚 Documentation: Please add JSDoc comments explaining the purpose and parameters of this function."
```

### Step 6: Create Follow-up Issues

```bash
# Create issues for improvements that don't block the initial merge
gh issue create \
  --title "Increase test coverage to 80%" \
  --body "Follow-up from PR #${PR_NUMBER} review. Current coverage is 40%. Need to add tests for:
  - API routes
  - Error scenarios  
  - Edge cases
  - Component interactions" \
  --label "testing,enhancement"

gh issue create \
  --title "Add accessibility testing" \
  --body "Set up automated accessibility testing using axe-core or similar.
  - Add to CI pipeline
  - Create baseline scores
  - Document WCAG compliance" \
  --label "accessibility,enhancement"

echo "✅ Created follow-up issues for ongoing improvements"
```

## Review Focus Areas for New Projects

### 1. Foundation Quality
- Is the architecture scalable?
- Are patterns consistent and maintainable?
- Is the tooling properly configured?

### 2. Future-Proofing
- Can the project grow without major refactoring?
- Are abstractions at the right level?
- Is the testing strategy comprehensive?

### 3. Team Enablement
- Is the code self-documenting?
- Are patterns clear for other developers?
- Is the development workflow smooth?

### 4. Production Readiness
- Are security basics covered?
- Is error handling robust?
- Is performance acceptable?

## Success Criteria for Initial Review

- [ ] Project structure supports planned features
- [ ] Development environment works smoothly
- [ ] Core patterns are established and documented
- [ ] Security fundamentals are in place
- [ ] Testing foundation is solid
- [ ] CI/CD pipeline is functional
- [ ] Documentation enables onboarding

Remember: The first PR sets the tone for the entire project. Be thorough but constructive, focusing on establishing excellence from the start.
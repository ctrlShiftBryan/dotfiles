# GitHub Issue Implementation Plan Generator

You are an expert software architect and implementation planner. Your task is to create a detailed implementation plan for a GitHub issue, add helpful code comments, and create a pull request.

## Task

Create a comprehensive implementation plan for GitHub issue #$ARGUMENTS and prepare for implementation. You should ultrathink.

## Workflow

### Step 1: Retrieve Issue and Parse Answers

```bash
# Fetch issue with all comments
ISSUE_DATA=$(gh issue view $ARGUMENTS --json title,body,comments,number)
ISSUE_NUMBER=$(echo "$ISSUE_DATA" | jq -r '.number')
ISSUE_TITLE=$(echo "$ISSUE_DATA" | jq -r '.title')

# Extract the clarification comment (contains "Requirements Clarification" in body)
CLARIFICATION_COMMENT=$(echo "$ISSUE_DATA" | jq -r '.comments[] | select(.body | contains("Requirements Clarification")) | .body')
```

**Parse Answered Questions:**
Look for answers in this format within the clarification comment:

```
**Question text here**
> This is the answer provided by the user
```

Extract and organize all question-answer pairs for reference during planning.

### Step 2: Prepare for Implementation

```bash
# Store the issue number and title for reference
echo "📋 Working on issue #${ISSUE_NUMBER}: ${ISSUE_TITLE}"
```

### Step 3: Codebase Analysis Framework

<codebase_exploration>
**Systematically explore the codebase using Task tools:**

**Note: Execute the bash commands below inside Task tools for parallel processing**

Launch ALL of these Task tool invocations simultaneously in a single message:

1. **Project Structure & Architecture Task**

   ```bash
   # Get overall project structure
   find . -type f -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | head -20
   ls -la  # Check for config files, package.json, etc.
   cat package.json  # Understand dependencies and scripts
   ```

2. **React Components & TypeScript Patterns Task**

   ```bash
   # Search for similar functionality
   grep -r "keyword_from_issue" --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" .

   # Find configuration files
   find . -name "*.config.*" -o -name "package.json" -o -name "tsconfig.json" -o -name "tailwind.config.*"

   # Look for shadcn components
   ls -la src/components/ui/ 2>/dev/null || ls -la components/ui/ 2>/dev/null
   ```

3. **Data Layer & State Management Task**

   ```bash
   # Look for database schemas, Prisma, or data models
   find . -name "schema.prisma" -o -path "*/prisma/*" -o -path "*/models/*" -o -path "*/types/*"
   grep -r "useState\|useQuery\|prisma\|database" --include="*.tsx" --include="*.ts" . | head -10

   # Check for state management patterns
   grep -r "zustand\|redux\|context\|atom" --include="*.tsx" --include="*.ts" . | head -5
   ```

4. **API Routes & Server Patterns Task**

   ```bash
   # Find API routes (Next.js, Express, etc.)
   find . -path "*/api/*" -name "*.ts" -o -path "*/routes/*" -name "*.ts"
   grep -r "export.*GET\|export.*POST\|router\|endpoint" --include="*.ts" --include="*.tsx" . | head -10

   # Look for server actions or tRPC
   grep -r "server.*action\|trpc\|rpc" --include="*.ts" --include="*.tsx" . | head -5
   ```

5. **Testing Patterns Task**

   ```bash
   # Understand testing setup
   find . -name "*.test.*" -o -name "*.spec.*" -o -path "*/__tests__/*"
   grep -r "jest\|vitest\|@testing-library" package.json
   ls -la | grep -E "(jest|vitest|playwright)\.config"
   ```

6. **Build/Deploy Configuration Task**

   ```bash
   # Check build and deployment setup
   ls -la | grep -E "(next\.config|vite\.config|webpack\.config|Dockerfile|docker-compose)"
   cat package.json | jq '.scripts'  # Check available scripts
   ```

7. **shadcn/ui Integration Task**
   ```bash
   # Check shadcn setup and components
   cat components.json 2>/dev/null || echo "No components.json found"
   ls -la src/components/ui/ 2>/dev/null || ls -la components/ui/ 2>/dev/null
   grep -r "shadcn\|@/components/ui" --include="*.tsx" --include="*.ts" . | head -5
   ```

**Parallel Execution Benefits:**

- All 7 Tasks run simultaneously instead of sequentially
- Results available in 1-2 minutes instead of 10-15 minutes
- More thorough analysis with cross-referenced findings
- Better understanding of codebase patterns and conventions
  </codebase_exploration>

### Step 4: Implementation Planning Framework

<planning_methodology>
**Create a detailed plan covering:**

1. **Requirements Summary**

   - Restate the problem and solution approach
   - Reference specific answers from clarification questions

2. **Technical Architecture**

   - How this fits into existing codebase
   - New components/modules needed
   - Integration points with existing systems

3. **Implementation Phases**

   - Break down into logical phases/milestones
   - Identify dependencies between tasks
   - Estimate complexity and effort

4. **Detailed Task Breakdown**

   - Specific files to create/modify
   - Database changes needed
   - API endpoints to add/update
   - Frontend components required

5. **Testing Strategy**

   - Unit tests needed
   - Integration test scenarios
   - Performance/load testing considerations

6. **Risk Mitigation**

   - Potential challenges identified
   - Fallback approaches
   - Performance considerations

7. **Success Criteria & Validation**
   - How to verify each phase is complete
   - Acceptance testing approach
   - Rollback plan if needed
     </planning_methodology>

### Step 5: Add Implementation Comments to Codebase

**Add helpful comments to guide implementation:**

```bash
# Add TODO comments to relevant files based on the analysis
# This helps developers understand where changes need to be made

# Example: Add comments to files that need modification
add_implementation_comments() {
    local file_path="$1"
    local comment_text="$2"

    # Add TypeScript/React appropriate comments
    if [[ "$file_path" == *.tsx ]] || [[ "$file_path" == *.ts ]]; then
        echo "// TODO: Issue #${ISSUE_NUMBER} - ${comment_text}" >> "$file_path"
    fi
}

# Add comments to key areas identified during codebase analysis
# - Components that need modification
# - New component locations
# - API routes to create/modify
# - Type definition files
# - Test files to create
```

**Implementation Comments Strategy:**

1. **New Files**: Add header comments with purpose and implementation notes
2. **Existing Files**: Add TODO comments at modification points
3. **Integration Points**: Comment where new code connects to existing code
4. **Testing Notes**: Add comments about testing requirements

### Step 6: Create Implementation Plan Document

ultra think and create the detailed plan as both a markdown file and GitHub comment:

````bash
# Create the plan content
PLAN_CONTENT=$(cat <<'PLAN'
# 📋 Implementation Plan for Issue #${ISSUE_NUMBER}

## 🎯 Requirements Summary
[Summarize the problem and solution based on answered clarifications]

**Key Requirements from Clarification:**
[Bullet points of critical answers that drive the technical approach]

## 🏗️ Technical Architecture

### Integration with Existing Codebase
[How this feature fits into current architecture]

### New Components Required
- **Component 1**: [Purpose and location in codebase]
- **Component 2**: [Purpose and integration points]

### Modified Components
- **File/Module**: [What changes and why]

## 🚀 Implementation Phases

### Phase 1: Foundation & Setup
**Timeline**: [X days]
**Dependencies**: None

**Tasks:**
- [ ] Create/modify database schema
- [ ] Set up new module structure
- [ ] Add configuration parameters

**Deliverables:**
- Database migrations
- Basic module scaffolding
- Updated configuration

**Validation:**
- [ ] Database schema applied successfully
- [ ] Tests pass with new structure

### Phase 2: Core Implementation
**Timeline**: [X days]
**Dependencies**: Phase 1 complete

**Tasks:**
- [ ] Implement core business logic
- [ ] Add API endpoints
- [ ] Create service layer methods

**Deliverables:**
- Core functionality working
- API endpoints responding
- Basic error handling

**Validation:**
- [ ] Unit tests pass for core logic
- [ ] API endpoints return expected responses
- [ ] Error cases handled gracefully

### Phase 3: Integration & Polish
**Timeline**: [X days]
**Dependencies**: Phase 2 complete

**Tasks:**
- [ ] Frontend integration
- [ ] Performance optimization
- [ ] Documentation updates

**Deliverables:**
- Complete end-to-end functionality
- Performance benchmarks met
- Documentation updated

**Validation:**
- [ ] Integration tests pass
- [ ] Performance requirements met
- [ ] User acceptance criteria satisfied

## 🔧 Detailed Technical Tasks

### Database Changes
```typescript
// Example Prisma schema update
model NewFeature {
  id        String   @id @default(cuid())
  userId    String
  data      Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])
}
````

### Files to Create/Modify

1. **`src/components/feature/new-component.tsx`** - New React component

   - Purpose: [Specific UI functionality]
   - Props: [TypeScript interface definition]
   - Hooks used: [useState, useEffect, custom hooks]

2. **`src/lib/types/feature.ts`** - TypeScript type definitions

   - Purpose: [Type safety for new feature]
   - Exports: [Interface definitions, enums]

3. **`src/app/api/feature/route.ts`** - API route (Next.js App Router)

   - Purpose: [Server-side logic]
   - Methods: [GET, POST, PUT, DELETE]

4. **`src/hooks/use-feature.ts`** - Custom React hook
   - Purpose: [State management and data fetching]
   - Returns: [Data, loading states, mutations]

### shadcn/ui Components

- **New Components**: [List any new shadcn components to add]
- **Modified Components**: [Existing components to extend]
- **Custom Variants**: [New variants for existing components]

### API Endpoints

- **GET /api/feature** - [Purpose and response type]
- **POST /api/feature** - [Purpose and request/response TypeScript types]

## 🧪 Testing Strategy

### Unit Tests

- **`__tests__/components/new-component.test.tsx`**: Test React component rendering and interactions
- **`__tests__/hooks/use-feature.test.ts`**: Test custom hook logic and state management
- **`__tests__/lib/utils.test.ts`**: Test utility functions and business logic

### Integration Tests

- End-to-end component workflows with React Testing Library
- API route testing with request/response validation
- Database integration testing with test database

### Component Testing

- **Rendering Tests**: Component renders with correct props
- **Interaction Tests**: User interactions trigger expected behaviors
- **State Tests**: Component state changes work correctly
- **Accessibility Tests**: Components meet a11y standards

### API Testing

- **Route Handler Tests**: API endpoints return correct responses
- **TypeScript Contract Tests**: Request/response types are validated
- **Error Handling Tests**: API error cases handled properly

### Performance Tests

- **Bundle Size**: Ensure new components don't significantly increase bundle
- **Render Performance**: Component rendering performance benchmarks
- **API Response Times**: Endpoint performance testing

## ⚠️ Risk Assessment & Mitigation

### Technical Risks

1. **Risk**: [Specific technical challenge]
   - **Likelihood**: Medium/High/Low
   - **Impact**: [Description]
   - **Mitigation**: [Specific approach]

### Performance Risks

[Any performance concerns and optimization strategies]

### Integration Risks

[Potential issues with existing systems and solutions]

## ✅ Success Criteria

### Phase Completion Criteria

- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] Performance benchmarks met
- [ ] Code review approved
- [ ] Documentation updated

### Acceptance Criteria (from original issue)

[Reference back to the original requirements and answered questions]

## 🔄 Next Steps

1. **Immediate**: Review and approve this plan
2. **Phase 1 Start**: [Specific first tasks]
3. **Check-ins**: [Suggested review points]

---

**Estimated Total Timeline**: [X weeks]
**Confidence Level**: [High/Medium] - based on codebase analysis and requirement clarity

Ready to proceed? React with 👍 to approve or comment with feedback/questions.

🤖 _Generated by Implementation Planning Assistant_
PLAN
)

# Save plan as markdown file

echo "$PLAN_CONTENT" > "IMPLEMENTATION_PLAN_${ISSUE_NUMBER}.md"

````

### Step 7: Commit and Push Changes

```bash
# Add all changes including the plan file and any commented files
git add .

# Commit with conventional commit format
git commit -m "feat: add implementation plan for issue #${ISSUE_NUMBER}

- Create detailed implementation plan with phases and tasks
- Add TODO comments to relevant files for guidance
- Include TypeScript/React specific implementation details
- Add testing strategy and risk assessment

See #${ISSUE_NUMBER}"

# Push the changes
git push
echo "✅ Pushed implementation plan"
````

### Step 8: Create Pull Request

```bash
# Create PR with detailed description (can be done from worktree)
PR_BODY=$(cat <<PR_DESC
## 📋 Implementation Plan for Issue #${ISSUE_NUMBER}

### 🎯 Overview
This PR contains the implementation plan and preparatory work for resolving issue #${ISSUE_NUMBER}.

### 📚 What's Included
- [ ] Detailed implementation plan document (\`IMPLEMENTATION_PLAN_${ISSUE_NUMBER}.md\`)
- [ ] TODO comments added to relevant files for implementation guidance
- [ ] Codebase analysis and architecture decisions
- [ ] Phase-based implementation approach with clear milestones

### 🏗️ Implementation Phases
1. **Phase 1**: Foundation & Setup
2. **Phase 2**: Core Implementation
3. **Phase 3**: Integration & Polish

### 🧪 Testing Strategy
- Unit tests for all new components and hooks
- Integration tests for end-to-end workflows
- Performance testing for critical paths
- TypeScript contract validation

### 🔗 Related Issue
See #${ISSUE_NUMBER}

### 📝 Notes for Reviewers
- This PR contains the planning phase only
- Implementation will follow in subsequent commits to the current branch
- Review the implementation plan document for detailed approach
- TODO comments in code indicate modification points


### ✅ Ready for Implementation
Once this plan is approved, implementation can begin following the documented phases.

---
*🤖 Generated by Implementation Planning Assistant*
PR_DESC
)

# Create the PR
gh pr create \
  --title "feat: Implementation plan for #${ISSUE_NUMBER} - ${ISSUE_TITLE}" \
  --body "$PR_BODY"

echo "✅ Created pull request for implementation plan"
```

### Step 9: Post Plan as GitHub Issue Comment

```bash
# Post the same plan content as a comment on the issue
gh issue comment $ARGUMENTS --body "$PLAN_CONTENT"

echo "✅ Posted implementation plan to issue #$ARGUMENTS"
echo "✅ Created implementation plan file: IMPLEMENTATION_PLAN_${ISSUE_NUMBER}.md"
echo "✅ Added TODO comments to codebase for implementation guidance"
echo "🔗 Pull Request: $(gh pr view --json url -q .url)"
```

## Commit Conventions

**Conventional Commit Format:**

```
<type>: <description>

<body>

<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Example Commit:**

```
feat: add implementation plan for issue #42

- Create detailed implementation plan with phases and tasks
- Add TODO comments to relevant files for guidance
- Include TypeScript/React specific implementation details
- Add testing strategy and risk assessment

Closes #42
```

## Code Comment Guidelines

**File Header Comments (New Files):**

```typescript
/**
 * Issue #42: User Authentication Component
 *
 * TODO: Implement user authentication form with:
 * - Email/password validation
 * - OAuth integration
 * - Error handling and loading states
 * - Accessibility compliance
 *
 * Related files:
 * - src/hooks/use-auth.ts
 * - src/lib/auth.ts
 */
```

**Inline TODO Comments (Existing Files):**

```typescript
// TODO: Issue #42 - Add authentication check here
// Need to verify user is logged in before allowing access
// See implementation plan: Phase 2, Task 3

// TODO: Issue #42 - Update this interface to include auth state
interface UserContextType {
  // Add auth-related properties here
}
```

**Ensure your plan includes:**

1. **Specific File References** - Name actual files based on TypeScript/React project structure
2. **TypeScript Interfaces** - Define types for all new data structures and component props
3. **React Component Patterns** - Follow established component architecture (hooks, composition, etc.)
4. **shadcn/ui Integration** - Leverage existing design system and create consistent UI components
5. **Realistic Estimates** - Based on similar React/TypeScript work in the codebase
6. **Clear Dependencies** - Phase ordering that considers component hierarchies and data flow
7. **Testable Milestones** - Each phase has concrete validation criteria with React Testing Library
8. **Performance Awareness** - Consider bundle size, rendering performance, and React best practices
9. **Type Safety** - Ensure full TypeScript coverage and proper type definitions

## Codebase Analysis Best Practices

**When exploring the TypeScript/React codebase:**

- Look for existing component patterns and follow established conventions
- Identify the state management approach (Context, Zustand, Redux, etc.)
- Check shadcn/ui components already available vs. new ones needed
- Find TypeScript type definitions and extend existing interfaces where possible
- Understand the API patterns (Next.js App Router, tRPC, REST, etc.)
- Check testing setup (Jest, Vitest, React Testing Library, Playwright)
- Review build processes and ensure new code fits deployment pipeline
- Examine existing hooks and utility functions for reusable patterns

## Execution Instructions

1. **Parse clarification answers** from the previous comment
2. **Prepare for implementation** and store issue details
3. **Explore codebase systematically** using the analysis framework
4. **Add implementation comments** to guide developers
5. **Create detailed technical plan** following the methodology
6. **Save plan as markdown file** in the repository
7. **Commit and push changes**
8. **Create pull request** with comprehensive description
9. **Post plan as GitHub comment** for visibility

Execute this complete workflow now for issue #$ARGUMENTS.

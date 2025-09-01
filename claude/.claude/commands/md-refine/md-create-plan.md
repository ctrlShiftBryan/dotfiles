# Markdown Q&A Implementation Plan Generator

You are an expert software architect and implementation planner. Your task is to create a detailed implementation plan based on a requirements document containing refined questions and answers.

## Task

Create a comprehensive implementation plan from the markdown file at path: $ARGUMENTS. You should ultrathink.

## Workflow

### Step 1: Parse Requirements Document

```bash
# Read the markdown file containing Q&A
Q_AND_A_FILE="$ARGUMENTS"
if [ ! -f "$Q_AND_A_FILE" ]; then
    echo "❌ Error: File not found at $Q_AND_A_FILE"
    exit 1
fi

# Extract content
REQUIREMENTS_CONTENT=$(cat "$Q_AND_A_FILE")
PROJECT_NAME=$(basename "$Q_AND_A_FILE" .md)

echo "📋 Creating implementation plan from: $Q_AND_A_FILE"
```

**Parse Question-Answer Format:**
Look for patterns in the markdown file such as:
- Headers with questions
- Bullet points or blockquotes with answers
- Q: / A: format
- **Question** / Answer format

Extract and organize all question-answer pairs for reference during planning.

### Step 2: Prepare for Implementation

```bash
# Create a timestamp for the plan
TIMESTAMP=$(date +"%Y-%m-%d-%I-%M%p" | tr '[:upper:]' '[:lower:]')
PLAN_FILENAME="plans/${TIMESTAMP}-${PROJECT_NAME}-implementation.md"

# Ensure plans directory exists
mkdir -p plans

echo "📝 Will create plan at: $PLAN_FILENAME"
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
   # Search for similar functionality based on requirements
   # Extract keywords from the Q&A document for searching
   grep -r "keyword_from_requirements" --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" .

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

   - Extract and synthesize key requirements from Q&A
   - Identify primary objectives and constraints
   - Map questions to technical decisions

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
        echo "// TODO: ${PROJECT_NAME} - ${comment_text}" >> "$file_path"
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

ultra think and create the detailed plan as a markdown file:

````bash
# Create the plan content
PLAN_CONTENT=$(cat <<'PLAN'
# 📋 Implementation Plan: ${PROJECT_NAME}

Generated from: ${Q_AND_A_FILE}
Date: $(date +"%Y-%m-%d %I:%M %p")

## 🎯 Requirements Summary

### Key Requirements from Q&A Document
[Extract and synthesize the main requirements from the questions and answers]

### Primary Objectives
[Bullet points of main goals based on the Q&A]

### Constraints & Considerations
[Any limitations or special considerations mentioned in the answers]

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

### Acceptance Criteria (from Q&A document)

[Reference specific acceptance criteria derived from the answers in the Q&A document]

## 🔄 Next Steps

1. **Immediate**: Review and approve this plan
2. **Phase 1 Start**: [Specific first tasks]
3. **Check-ins**: [Suggested review points]

## 📚 Referenced Q&A

### Key Questions & Decisions
[Include the most important Q&A pairs that drove technical decisions]

---

**Estimated Total Timeline**: [X weeks]
**Confidence Level**: [High/Medium] - based on codebase analysis and requirement clarity

🤖 _Generated by Markdown Q&A Implementation Planning Assistant_
PLAN
)

# Save plan to file
echo "$PLAN_CONTENT" > "$PLAN_FILENAME"

````

### Step 7: Commit and Push Changes

```bash
# Add all changes including the plan file and any commented files
git add .

# Commit with conventional commit format
git commit -m "feat: add implementation plan from ${PROJECT_NAME} Q&A

- Create detailed implementation plan with phases and tasks
- Add TODO comments to relevant files for guidance
- Include TypeScript/React specific implementation details
- Add testing strategy and risk assessment

Plan: ${PLAN_FILENAME}"

# Push the changes
git push
echo "✅ Pushed implementation plan and code comments"
````

### Step 8: Output Summary

```bash
# Provide summary of what was created
echo "
✅ Implementation Plan Created Successfully!

📋 Plan Location: ${PLAN_FILENAME}
📝 Source Q&A: ${Q_AND_A_FILE}
💬 TODO Comments: Added to relevant files

Next Steps:
1. Review the implementation plan
2. Begin Phase 1 implementation
3. Follow the task checklist in the plan

To view the plan:
cat ${PLAN_FILENAME}
"
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

## Code Comment Guidelines

**File Header Comments (New Files):**

```typescript
/**
 * ${PROJECT_NAME}: Component Description
 *
 * TODO: Implement based on requirements:
 * - Requirement 1 from Q&A
 * - Requirement 2 from Q&A
 * - Integration points
 *
 * Related files:
 * - src/hooks/use-feature.ts
 * - src/lib/utils.ts
 */
```

**Inline TODO Comments (Existing Files):**

```typescript
// TODO: ${PROJECT_NAME} - Add implementation here
// Based on Q&A requirement: [specific requirement]
// See implementation plan: Phase X, Task Y

// TODO: ${PROJECT_NAME} - Update interface for new feature
interface ExistingType {
  // Add new properties here
}
```

**Ensure your plan includes:**

1. **Direct Q&A References** - Link technical decisions back to specific Q&A pairs
2. **Extracted Requirements** - Synthesize answers into clear technical requirements
3. **TypeScript Interfaces** - Define types based on data structures mentioned in Q&A
4. **React Component Patterns** - Follow patterns discovered in codebase analysis
5. **Realistic Estimates** - Based on complexity implied by the Q&A
6. **Clear Dependencies** - Order phases based on technical dependencies
7. **Testable Milestones** - Derive test cases from acceptance criteria in answers
8. **Performance Awareness** - Address any performance concerns mentioned in Q&A
9. **Type Safety** - Ensure full TypeScript coverage for all new code

## Q&A Document Parsing Tips

**Common Q&A Formats to Look For:**

1. **Header-based Questions**
   ```markdown
   ## What should the user interface look like?
   The interface should have...
   ```

2. **Q: A: Format**
   ```markdown
   Q: How should errors be handled?
   A: Errors should be logged and displayed to users...
   ```

3. **Bullet Point Format**
   ```markdown
   - **Question**: What data needs to be stored?
     - Answer: User profiles, preferences, and history...
   ```

4. **Numbered Questions**
   ```markdown
   1. What authentication method should be used?
      OAuth 2.0 with support for Google and GitHub...
   ```

## Execution Instructions

1. **Read the markdown Q&A file** from the provided path
2. **Parse questions and answers** to understand requirements
3. **Explore codebase systematically** using the analysis framework
4. **Add implementation comments** to guide developers
5. **Create detailed technical plan** based on Q&A requirements
6. **Save plan in plans directory** with timestamp
7. **Commit and push changes**
8. **Output summary** with next steps

Execute this complete workflow now for the Q&A document at: $ARGUMENTS.
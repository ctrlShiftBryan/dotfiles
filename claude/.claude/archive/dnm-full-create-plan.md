# GitHub Issue Implementation Plan Generator for Dynasty Nerds Monorepo

You are an expert full-stack software architect specializing in:
- **Database Layer**: PostgreSQL with Prisma ORM, database migrations, materialized views, and schema design
- **API Layer**: Remix framework with Express servers, BullMQ job queues, Socket.IO real-time features, Redis caching
- **Frontend Layer**: Expo React Native, NativeWind (Tailwind for RN), TanStack Query, Expo Router navigation
- **Testing**: Vitest with smart test runner (.test.ts vs .db.test.ts), React Native Testing Library, MSW for API mocking
- **Architecture**: Clean Architecture patterns, pnpm monorepo with Turborepo, Repository/Service patterns
- **Fantasy Football Domain**: Player management, league integration, trade analysis, rankings systems

Your task is to create a detailed implementation plan for a GitHub issue in the dynasty-nerds-monorepo fantasy football platform, focusing on the three-layer architecture and leveraging existing patterns from the comprehensive codebase analysis.

## Task

<thinking>
Analyze GitHub issue #$ARGUMENTS for the dynasty-nerds fantasy football platform. Consider:
1. Which layers are affected (database, API, frontend)?
2. What existing patterns can be leveraged (Repository, Service, Clean Architecture)?
3. What domain concepts are involved (Player, League, Trade, Rankings, etc.)?
4. Which testing strategies apply (.test.ts for unit, .db.test.ts for database)?
5. How does this integrate with existing auth, caching, and real-time features?
6. What performance and security patterns should be followed?
</thinking>

Create a comprehensive implementation plan for GitHub issue #$ARGUMENTS, considering the three-layer architecture:
1. **Database Layer** (`packages/database`) - Prisma schema, migrations, seed data
2. **API Layer** (`apps/gm-api`) - Remix routes, services, queues, real-time features
3. **Frontend Layer** (`apps/gm2`) - Expo React Native components, navigation, state management

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

### Step 3: Dynasty Nerds Codebase Analysis Framework

<codebase_exploration>
**Systematically explore the dynasty-nerds-monorepo using parallel Task tools:**

**IMPORTANT: Execute ALL analysis tasks simultaneously for maximum efficiency**

Launch these dynasty-nerds-specific Task tool invocations in parallel:

1. **Monorepo Structure & Workspace Analysis Task**

   ```bash
   # Analyze monorepo structure
   cat package.json | jq '.workspaces'
   ls -la packages/
   ls -la apps/
   
   # Check workspace dependencies
   find . -name "package.json" -path "*/packages/*" -o -path "*/apps/*" | head -10
   cat turbo.json 2>/dev/null || echo "No turbo.json found"
   ```

2. **Database Layer Analysis Task (Prisma & PostgreSQL)**

   ```bash
   # Analyze Prisma schema and models
   cat packages/database/prisma/schema.prisma | head -50
   ls -la packages/database/prisma/migrations/
   
   # Check for related models and types
   grep -r "model.*{" packages/database/prisma/schema.prisma
   grep -r "keyword_from_issue" packages/database/
   
   # Database context patterns
   find apps/gm-api/app/context -name "*.db-context.ts" | head -10
   ```

3. **API Layer Analysis Task (Remix Routes & Services)**

   ```bash
   # Analyze Remix API routes
   ls -la apps/gm-api/app/routes/api.gm.*.tsx | head -20
   grep -r "export.*action\|export.*loader" apps/gm-api/app/routes/ --include="*.tsx" | head -10
   
   # Service layer patterns
   ls -la apps/gm-api/app/services/
   find apps/gm-api -name "*Service.ts" -o -name "*Api.ts" | head -10
   
   # Queue and real-time features
   grep -r "BullMQ\|Queue\|socket" apps/gm-api/ --include="*.ts" | head -5
   ```

4. **Frontend Layer Analysis Task (Expo & React Native)**

   ```bash
   # Analyze Expo app structure
   ls -la apps/gm2/app/
   cat apps/gm2/app.config.js | head -20
   
   # Component patterns and navigation
   find apps/gm2/components -name "*.tsx" | head -20
   ls -la apps/gm2/app/(gm)/ 2>/dev/null
   
   # NativeWind and styling
   cat apps/gm2/tailwind.config.js | head -20
   grep -r "className=" apps/gm2/components/ --include="*.tsx" | head -5
   ```

5. **Testing Infrastructure Task**

   ```bash
   # Database testing patterns
   find apps/gm-api -name "*.db.test.ts" | head -10
   cat apps/gm-api/vitest.db.config.ts 2>/dev/null | head -20
   
   # Unit and integration tests
   find . -name "*.test.ts" -o -name "*.test.tsx" | grep -E "(database|gm-api|gm2)" | head -10
   
   # Test database setup
   grep -r "DATABASE_URL.*test" .env* 2>/dev/null || echo "Check test DB config"
   ```

6. **Shared Types & Core Packages Task**

   ```bash
   # Analyze shared type packages
   ls -la packages/nerd-types/
   ls -la packages/nerd-core-rn/ 2>/dev/null
   
   # Type definitions and interfaces
   find packages/nerd-types -name "*.ts" | head -10
   grep -r "export.*interface\|export.*type" packages/nerd-types/ --include="*.ts" | head -10
   
   # Package dependencies
   cat packages/database/package.json | jq '.dependencies'
   ```

7. **Dynasty Nerds Specific Patterns Task**
   ```bash
   # Dynasty/fantasy football domain models - 8 core domains
   # Player Management, League Management, Trade Analysis, User & Auth
   # Platform Integration, Rankings & Values, Mock Draft, Lineup Optimization
   grep -r "League\|Team\|Player\|Draft\|Trade\|PlayerValue\|MockDraft\|Rankings" packages/database/prisma/schema.prisma
   
   # Check materialized views for complex queries
   grep -r "vw_dynasty_ranks\|vw_adp\|vw_projections" packages/database/prisma/schema.prisma
   
   # Platform integrations (Sleeper, ESPN, MFL, FFPC, Fleaflicker)
   ls -la apps/gm-api/app/parsers/
   find apps/gm-api/app/parsers -name "*.ts" | head -10
   
   # Authentication patterns - JWT with RSA keys, WordPress SSO integration
   grep -r "auth\|session\|user\|jwt" apps/gm-api/app/routes/ --include="*.tsx" | head -10
   find apps/gm-api/app -name "*auth*.ts" -o -name "*jwt*.ts" | head -5
   
   # Error handling patterns with invariant
   grep -r "invariant\|invariantResponse" apps/gm-api/app/ --include="*.ts" | head -5
   
   # Real-time features with Socket.IO
   grep -r "socket\|io\|emit" apps/gm-api/app/ --include="*.ts" | head -5
   
   # Mobile-specific features
   grep -r "RevenueCat\|AsyncStorage\|expo-" apps/gm2/package.json
   ls -la apps/gm2/app/(auth)/ 2>/dev/null
   ```

**Parallel Execution Benefits:**

- All 7 Tasks run simultaneously instead of sequentially
- Results available in 1-2 minutes instead of 10-15 minutes
- More thorough analysis with cross-referenced findings
- Better understanding of codebase patterns and conventions
  </codebase_exploration>

### Step 4: Three-Layer Implementation Planning Framework

<planning_methodology>
**Create a layer-specific implementation plan:**

1. **Requirements Analysis by Layer**

   - **Database Impact**: Schema changes, migrations, data integrity
   - **API Impact**: New routes, service methods, queue jobs
   - **Frontend Impact**: UI components, navigation, state management
   - Reference specific answers from clarification questions

2. **Technical Architecture**

   - **Database Architecture**:
     - Prisma schema modifications
     - Migration strategy and rollback plan
     - Impact on existing queries and relations
   
   - **API Architecture**:
     - Remix route structure (loaders, actions)
     - Service layer organization
     - Queue job design if applicable
     - Socket.io events if real-time needed
   
   - **Frontend Architecture**:
     - Expo Router navigation structure
     - Component hierarchy (atoms/molecules/organisms)
     - Data fetching with TanStack Query
     - NativeWind styling approach

3. **Implementation Phases**

   - Break down into logical phases/milestones
   - Identify dependencies between tasks
   - Estimate complexity and effort

4. **Layer-Specific Task Breakdown**

   **Database Layer Tasks**:
   - `packages/database/prisma/schema.prisma` - Model changes
   - Migration files: `pnpm db:migrate:dev --name feature_name`
   - Seed data updates in `packages/database/src/seed.ts`
   - Type generation: `pnpm generate`
   
   **API Layer Tasks**:
   - Routes: `apps/gm-api/app/routes/api.gm.feature-name.tsx`
   - Services: `apps/gm-api/app/services/featureService.ts`
   - Context: `apps/gm-api/app/context/Feature/feature.db-context.ts`
   - Queue jobs: `apps/gm-api/app/queues/feature.worker.ts`
   
   **Frontend Layer Tasks**:
   - Pages: `apps/gm2/app/(gm)/(nav-standard)/feature/index.tsx`
   - Components: `apps/gm2/components/molecules/Feature/`
   - Hooks: `apps/gm2/hooks/useFeature.tsx`
   - Queries: Using TanStack Query patterns

5. **Layer-Specific Testing Strategy**

   **Database Testing**:
   - Migration tests
   - Seed data validation
   - Query performance tests
   - `apps/gm-api/app/context/Feature/feature.db-context.db.test.ts`
   
   **API Testing**:
   - Route tests with MSW mocking
   - Service unit tests
   - Queue job tests
   - `apps/gm-api/app/routes/__tests__/api.gm.feature.test.ts`
   
   **Frontend Testing**:
   - Component tests with React Native Testing Library
   - Navigation flow tests
   - Mock API responses
   - `apps/gm2/components/molecules/Feature/__tests__/`

6. **Risk Mitigation**

   - Potential challenges identified
   - Fallback approaches
   - Performance considerations

7. **Success Criteria & Validation**
   - How to verify each phase is complete
   - Acceptance testing approach
   - Rollback plan if needed
     </planning_methodology>

### Step 5: Add Layer-Specific Implementation Comments

**Add helpful comments to guide implementation across layers:**

```bash
# Add layer-specific TODO comments
add_database_comments() {
    # Prisma schema
    echo "// TODO: Issue #${ISSUE_NUMBER} - Add new models/fields for ${FEATURE_NAME}" >> packages/database/prisma/schema.prisma
    
    # Seed file
    echo "// TODO: Issue #${ISSUE_NUMBER} - Add seed data for ${FEATURE_NAME}" >> packages/database/src/seed.ts
}

add_api_comments() {
    # New route file
    echo "// TODO: Issue #${ISSUE_NUMBER} - Implement loader and action for ${FEATURE_NAME}" > apps/gm-api/app/routes/api.gm.${FEATURE_SLUG}.tsx
    
    # Service layer
    echo "// TODO: Issue #${ISSUE_NUMBER} - Add service methods for ${FEATURE_NAME}" > apps/gm-api/app/services/${FEATURE_NAME}Service.ts
    
    # Context layer
    echo "// TODO: Issue #${ISSUE_NUMBER} - Add database context for ${FEATURE_NAME}" > apps/gm-api/app/context/${FEATURE_NAME}/${FEATURE_NAME}.db-context.ts
}

add_frontend_comments() {
    # Page component
    echo "// TODO: Issue #${ISSUE_NUMBER} - Implement ${FEATURE_NAME} page with Expo Router" > apps/gm2/app/(gm)/(nav-standard)/${FEATURE_SLUG}/index.tsx
    
    # Components
    echo "// TODO: Issue #${ISSUE_NUMBER} - Create reusable components for ${FEATURE_NAME}" > apps/gm2/components/molecules/${FEATURE_NAME}/index.tsx
    
    # Hooks
    echo "// TODO: Issue #${ISSUE_NUMBER} - Add TanStack Query hooks for ${FEATURE_NAME}" > apps/gm2/hooks/use${FEATURE_NAME}.tsx
}
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

## 📋 Implementation Task Breakdown

### Task Sequencing Strategy
Each task is designed to be:
- **Atomic**: Can be completed and merged independently
- **Testable**: Has clear acceptance criteria
- **Incremental**: Builds upon previous tasks
- **Deliverable**: Provides immediate value

### Task List

| Task # | Title | Dependencies | Est. Hours | Layer |
|--------|-------|--------------|------------|-------|
| 001 | Database Schema Design | None | 2-4 | Database |
| 002 | Prisma Migration & Types | Task 001 | 1-2 | Database |
| 003 | Repository Layer Implementation | Task 002 | 3-4 | API |
| 004 | Service Layer Business Logic | Task 003 | 4-6 | API |
| 005 | API Route Implementation | Task 004 | 3-4 | API |
| 006 | API Error Handling & Validation | Task 005 | 2-3 | API |
| 007 | Frontend Data Hook | Task 005 | 2-3 | Frontend |
| 008 | UI Component Implementation | Task 007 | 4-6 | Frontend |
| 009 | Frontend Error States | Task 008 | 2-3 | Frontend |
| 010 | Integration Tests | Tasks 006, 009 | 3-4 | All |
| 011 | Performance Optimization | Task 010 | 2-3 | All |
| 012 | Documentation | Task 011 | 1-2 | All |

### Task Dependency Graph
```
[001] Database Schema
  └─> [002] Prisma Migration
       └─> [003] Repository Layer
            └─> [004] Service Layer
                 └─> [005] API Routes
                      ├─> [006] API Error Handling
                      └─> [007] Frontend Hook
                           └─> [008] UI Components
                                └─> [009] Error States
                                     └─> [010] Integration Tests
                                          └─> [011] Performance
                                               └─> [012] Documentation
```

## 🔧 Task Implementation Details

**Note**: Detailed implementation for each task is in `tasks/ISSUE_${ISSUE_NUMBER}/task-XXX-*.md`

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

### Dynasty Nerds File Structure

**Database Layer Files**:

1. **`packages/database/prisma/schema.prisma`**
   - Add new models with proper relations and audit fields
   - Include comprehensive indexes for query performance
   - Add materialized views for complex aggregations
   - Follow existing patterns from 100+ models

2. **`packages/database/prisma/migrations/[timestamp]_feature_name.sql`**
   - Generated migration file via `pnpm db:migrate:dev --name feature_name`
   - Include rollback considerations
   - Test on staging database first

**API Layer Files**:

1. **`apps/gm-api/app/routes/api.gm.feature-name.tsx`**
   ```typescript
   // Remix route with loader and action
   export async function loader({ request }: LoaderFunctionArgs) {
     // Data fetching logic
   }
   
   export async function action({ request }: ActionFunctionArgs) {
     // Mutation logic
   }
   ```

2. **`apps/gm-api/app/services/featureService.ts`**
   - Business logic layer
   - Database transactions
   - External API integrations

3. **`apps/gm-api/app/context/Feature/feature.db-context.ts`**
   - Prisma queries
   - Data transformations
   - Caching strategies

**Frontend Layer Files**:

1. **`apps/gm2/app/(gm)/(nav-standard)/feature/index.tsx`**
   ```typescript
   // Expo Router page component
   export default function FeaturePage() {
     // Using TanStack Query
     const { data, isLoading } = useFeatureData();
     // NativeWind styling
     return <View className="flex-1 bg-background">...</View>
   }
   ```

2. **`apps/gm2/components/molecules/Feature/FeatureList.tsx`**
   - Reusable components
   - NativeWind styling
   - Gesture handlers

3. **`apps/gm2/hooks/useFeature.tsx`**
   - TanStack Query hooks
   - Optimistic updates
   - Cache invalidation

### Dynasty Nerds UI Components

**API Layer (Remix UI)**:
- Located in `apps/gm-api/app/components/ui/`
- Radix UI based components
- Server-side rendering compatible

**Frontend Layer (React Native)**:
- Custom components in `apps/gm2/components/`
- NativeWind for styling
- React Native Reanimated for animations
- Bottom sheets, modals, navigation patterns

### Dynasty Nerds API Patterns

**Remix Route Conventions**:
- **Loader**: `GET /api/gm/feature-name` - Data fetching with paywall logic
- **Action**: `POST /api/gm/feature-name` - Mutations with invariant validation
- **Resource Routes**: Return JSON responses with consistent error structure
- **Authentication**: JWT validation with `userFromContext` helper
- **Error Responses**: `json({ status: 'error', message: '', data: null })`

**Common Patterns**:
```typescript
// Input validation
invariant(email, 'Email is required');
const normalizedEmail = email.toLowerCase().trim();

// Error handling
try {
  // Operation
} catch (error) {
  NerdLog.error(`Error message: ${error}`);
  return json({ status: 'error', message: 'User-friendly message', data: null });
}
```

**Socket.io Events** (if real-time needed):
- Event naming: `feature:update`, `feature:create`
- Room management for league-specific events

## 🧪 Dynasty Nerds Testing Strategy

### Database Layer Tests

- **`packages/database/prisma/tests/feature.test.ts`**:
  - Migration validation
  - Query performance
  - Data integrity

```bash
# Run database tests
pnpm test:db
```

### API Layer Tests

- **`apps/gm-api/app/routes/__tests__/api.gm.feature.test.ts`**:
  - Route handler tests
  - Authentication/authorization
  - Error handling

- **`apps/gm-api/app/context/Feature/feature.db-context.db.test.ts`**:
  - Database queries with test data
  - Transaction rollbacks
  - Performance benchmarks

```bash
# Run API tests
cd apps/gm-api && pnpm test
```

### Frontend Layer Tests

- **Component Tests** (`apps/gm2/components/__tests__/`):
  - React Native Testing Library
  - Gesture testing
  - Navigation flows
  - Platform-specific behavior

- **Hook Tests** (`apps/gm2/hooks/__tests__/`):
  - TanStack Query mocking
  - Optimistic update testing
  - Error state handling

```bash
# Run frontend tests
cd apps/gm2 && pnpm test
```

### Integration Testing

**Cross-Layer Testing**:
1. Database → API integration
2. API → Frontend integration
3. End-to-end user flows

**Test Database Setup**:
```bash
# Use test database
pnpm test:db

# Reset test data
pnpm db:migrate:force
```

### Performance Tests

- **Bundle Size**: Ensure new components don't significantly increase bundle
- **Render Performance**: Use React.memo, useMemo, useCallback patterns
- **API Response Times**: Monitor with timing checks (warn if > 1000ms)
- **Database Optimization**: Use Prisma query analysis, add proper indexes
- **Caching Strategy**: Redis with @epic-web/cachified for hot data

**Performance Monitoring Pattern**:
```typescript
const startTime = Date.now();
// ... operation
const totalMs = Date.now() - startTime;
if (totalMs > 1000) {
  logger.warn(`Operation took ${totalMs}ms`);
}
```

## ⚠️ Dynasty Nerds Risk Assessment

### Database Risks

1. **Risk**: Migration failures in production
   - **Likelihood**: Medium
   - **Impact**: Data integrity issues
   - **Mitigation**: Test migrations on staging, include rollback scripts

2. **Risk**: Performance degradation with new queries
   - **Likelihood**: Medium
   - **Impact**: Slow API responses
   - **Mitigation**: Add proper indexes, use Prisma query analysis

### API Risks

1. **Risk**: Breaking changes to mobile app API
   - **Likelihood**: High
   - **Impact**: App crashes for users
   - **Mitigation**: Version APIs, maintain backwards compatibility

2. **Risk**: Queue job failures
   - **Likelihood**: Low
   - **Impact**: Background processes fail
   - **Mitigation**: Implement retry logic, monitoring

### Frontend Risks

1. **Risk**: Platform-specific bugs (iOS vs Android)
   - **Likelihood**: Medium
   - **Impact**: Poor user experience
   - **Mitigation**: Test on both platforms, use Expo EAS Build

2. **Risk**: App store rejection
   - **Likelihood**: Low
   - **Impact**: Delayed release
   - **Mitigation**: Follow platform guidelines, test IAP thoroughly

## ✅ Success Criteria

### Overall Success Criteria

- [ ] All tasks completed and merged
- [ ] All tests passing (unit, integration, e2e)
- [ ] Performance benchmarks met
- [ ] Code reviews approved for each task
- [ ] Documentation complete

### Task Completion Process

1. **Developer picks a task** from the sequence
2. **Opens task markdown** in `tasks/ISSUE_${ISSUE_NUMBER}/`
3. **Implements according to spec**
4. **Creates PR with task reference**
5. **Merges when approved**
6. **Next developer picks next task**

### Acceptance Criteria (from original issue)

[Reference back to the original requirements and answered questions]

## 🔄 Next Steps

1. **Immediate**: Review and approve this plan
2. **Phase 1 Start**: [Specific first tasks]
3. **Check-ins**: [Suggested review points]

---

**Estimated Timeline**:
- Total Tasks: 12
- Total Hours: ~35-50 hours
- Parallel Execution Possible: Yes (after task 005)
- Critical Path: Tasks 001-005 (must be sequential)

**Resource Allocation**:
- Can have 2-3 developers working in parallel after API routes are complete
- Frontend tasks (007-009) can proceed parallel to API error handling (006)
- Testing and optimization can begin as soon as basic flow works

**Confidence Level**: High - based on granular task breakdown and codebase patterns

Ready to proceed? React with 👍 to approve or comment with feedback/questions.

**Note**: This plan incorporates patterns from the comprehensive codebase analysis including:
- 8 core domain areas (Player, League, Trade, Rankings, etc.)
- Established conventions (invariant validation, error patterns, caching)
- Architecture patterns (Clean Architecture, Repository, Service)
- Performance & security best practices

🤖 _Generated by Implementation Planning Assistant with Codebase Intelligence_
PLAN
)

# Save plan as markdown file
echo "$PLAN_CONTENT" > "IMPLEMENTATION_PLAN_${ISSUE_NUMBER}.md"

# Create tasks directory
mkdir -p "tasks/ISSUE_${ISSUE_NUMBER}"

# Generate individual task files
generate_task_files() {
  # Task 001: UI Mockup with Static Data
  cat > "tasks/ISSUE_${ISSUE_NUMBER}/task-001-ui-mockup.md" <<'TASK'
# Task 001: UI Mockup with Static Data

**Issue**: #${ISSUE_NUMBER}  
**Dependencies**: None  
**Estimated Hours**: 3-4  
**Layer**: Frontend (UI Only)  

## 📋 Task Description
Create the UI components for [feature name] using static mock data. Focus on layout, styling, and user interactions without any API integration. This establishes the visual design and UX flow.

## 🎯 Acceptance Criteria
- [ ] Main page component created with Expo Router
- [ ] List/grid view displays mock data
- [ ] Detail view shows mock item
- [ ] Form components for create/edit (visual only)
- [ ] NativeWind styling matches design system
- [ ] Gesture handlers work (navigation, taps)
- [ ] Platform-specific adjustments (iOS/Android)
- [ ] Loading and error states shown with mock triggers

## 📁 Files to Create
- `apps/gm2/app/(gm)/(nav-standard)/[feature]/index.tsx` (main page)
- `apps/gm2/app/(gm)/(nav-standard)/[feature]/[id].tsx` (detail page)
- `apps/gm2/app/(gm)/(nav-standard)/[feature]/create.tsx` (create page)
- `apps/gm2/components/molecules/[Feature]/[Feature]List.tsx`
- `apps/gm2/components/molecules/[Feature]/[Feature]Card.tsx`
- `apps/gm2/components/molecules/[Feature]/[Feature]Form.tsx`
- `apps/gm2/mocks/[feature]Mocks.ts` (mock data)

## 🔧 Implementation Steps

1. **Create Mock Data**
   ```typescript
   // apps/gm2/mocks/[feature]Mocks.ts
   export const mock[Feature]s = [
     {
       id: '1',
       name: 'Mock Item 1',
       description: 'Description for testing UI',
       createdAt: new Date().toISOString(),
       // Add all fields needed for UI
     },
     // Add 5-10 mock items
   ];
   
   export const getMock[Feature]ById = (id: string) => 
     mock[Feature]s.find(item => item.id === id);
   ```

2. **Create Main Page with Mock Data**
   ```typescript
   // apps/gm2/app/(gm)/(nav-standard)/[feature]/index.tsx
   import { useState } from 'react';
   import { View, ScrollView } from 'react-native';
   import { Stack } from 'expo-router';
   import { mock[Feature]s } from '~/mocks/[feature]Mocks';
   import { [Feature]List } from '~/components/molecules/[Feature]/[Feature]List';
   import { LoadingSpinner } from '~/components/atoms/LoadingSpinner';
   import { ErrorMessage } from '~/components/atoms/ErrorMessage';
   
   export default function [Feature]Page() {
     const [isLoading, setIsLoading] = useState(false);
     const [showError, setShowError] = useState(false);
     
     // Simulate loading state for testing
     const simulateLoading = () => {
       setIsLoading(true);
       setTimeout(() => setIsLoading(false), 1500);
     };
     
     return (
       <>
         <Stack.Screen options={{ title: '[Feature]s' }} />
         <View className="flex-1 bg-background">
           {isLoading ? (
             <View className="flex-1 items-center justify-center">
               <LoadingSpinner />
             </View>
           ) : showError ? (
             <ErrorMessage message="Simulated error state" />
           ) : (
             <ScrollView className="flex-1">
               <[Feature]List items={mock[Feature]s} />
             </ScrollView>
           )}
         </View>
       </>
     );
   }
   ```

3. **Create List Component**
   ```typescript
   // Components with navigation and interactions
   // Focus on visual design and user experience
   ```

## ✅ Task Completion Checklist
- [ ] All UI components created
- [ ] Mock data covers all UI states
- [ ] Navigation between screens works
- [ ] Loading states can be triggered
- [ ] Error states can be triggered
- [ ] Forms show validation (visual only)
- [ ] Styling matches Dynasty Nerds design
- [ ] Works on both iOS and Android

## 🧪 Testing Notes
- Test on both iOS and Android simulators
- Verify all navigation paths work
- Check gesture handlers respond correctly
- Ensure mock data displays properly

## 📝 Developer Notes
- This task establishes the complete UI/UX
- No backend integration yet
- Mock data should represent realistic scenarios
- Focus on user experience and visual polish
TASK

  # Task 002: Frontend API Integration with Mocks
  cat > "tasks/ISSUE_${ISSUE_NUMBER}/task-002-frontend-api-mocks.md" <<'TASK'
# Task 002: Frontend API Integration with Mock Service

**Issue**: #${ISSUE_NUMBER}  
**Dependencies**: Task 001 (UI Mockup)  
**Estimated Hours**: 3-4  
**Layer**: Frontend (API Layer)  

## 📋 Task Description
Create the frontend API service layer and TanStack Query hooks using mock implementations. This establishes the data flow patterns without requiring backend implementation.

## 🎯 Acceptance Criteria
- [ ] API service class with mock implementations
- [ ] TanStack Query hooks for all operations
- [ ] Mock delays to simulate network calls
- [ ] Error simulation capabilities
- [ ] Optimistic updates working with mocks
- [ ] Local state management for mock data
- [ ] TypeScript interfaces defined

## 📁 Files to Create
- `apps/gm2/api/[feature]Api.ts` (API service)
- `apps/gm2/hooks/use[Feature].tsx` (Query hooks)
- `apps/gm2/types/[feature].types.ts` (TypeScript types)
- `apps/gm2/mocks/[feature]MockService.ts` (Mock implementation)

## 🔧 Implementation Steps

1. **Define TypeScript Types**
   ```typescript
   // apps/gm2/types/[feature].types.ts
   export interface [Feature] {
     id: string;
     name: string;
     description: string;
     // All fields needed by UI
     createdAt: string;
     updatedAt: string;
   }
   
   export interface Create[Feature]Input {
     name: string;
     description: string;
     // Required fields for creation
   }
   ```

2. **Create Mock Service**
   ```typescript
   // apps/gm2/mocks/[feature]MockService.ts
   import { mock[Feature]s } from './[feature]Mocks';
   
   let mockData = [...mock[Feature]s];
   
   export const [feature]MockService = {
     async list(params?: { limit?: number; offset?: number }) {
       // Simulate network delay
       await new Promise(resolve => setTimeout(resolve, 800));
       
       // Simulate random errors
       if (Math.random() < 0.1) {
         throw new Error('Network error');
       }
       
       const start = params?.offset || 0;
       const end = start + (params?.limit || 10);
       
       return {
         data: mockData.slice(start, end),
         total: mockData.length,
       };
     },
     
     async get(id: string) {
       await new Promise(resolve => setTimeout(resolve, 500));
       const item = mockData.find(i => i.id === id);
       if (!item) throw new Error('Not found');
       return item;
     },
     
     async create(input: Create[Feature]Input) {
       await new Promise(resolve => setTimeout(resolve, 1000));
       const newItem = {
         id: String(Date.now()),
         ...input,
         createdAt: new Date().toISOString(),
         updatedAt: new Date().toISOString(),
       };
       mockData.push(newItem);
       return newItem;
     },
     
     async update(id: string, input: Partial<Create[Feature]Input>) {
       await new Promise(resolve => setTimeout(resolve, 800));
       const index = mockData.findIndex(i => i.id === id);
       if (index === -1) throw new Error('Not found');
       
       mockData[index] = {
         ...mockData[index],
         ...input,
         updatedAt: new Date().toISOString(),
       };
       return mockData[index];
     },
     
     async delete(id: string) {
       await new Promise(resolve => setTimeout(resolve, 600));
       mockData = mockData.filter(i => i.id !== id);
       return { success: true };
     },
   };
   ```

3. **Create API Service**
   ```typescript
   // apps/gm2/api/[feature]Api.ts
   import { [feature]MockService } from '~/mocks/[feature]MockService';
   
   // For now, use mock service. Later tasks will replace with real API
   export const [feature]Api = [feature]MockService;
   ```

4. **Create TanStack Query Hooks**
   ```typescript
   // apps/gm2/hooks/use[Feature].tsx
   import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
   import { [feature]Api } from '~/api/[feature]Api';
   
   const QUERY_KEY = {
     all: ['[feature]'] as const,
     lists: () => [...QUERY_KEY.all, 'list'] as const,
     list: (params?: any) => [...QUERY_KEY.lists(), params] as const,
     details: () => [...QUERY_KEY.all, 'detail'] as const,
     detail: (id: string) => [...QUERY_KEY.details(), id] as const,
   };
   
   export function use[Feature]List(params?: { limit?: number; offset?: number }) {
     return useQuery({
       queryKey: QUERY_KEY.list(params),
       queryFn: () => [feature]Api.list(params),
       staleTime: 5 * 60 * 1000, // 5 minutes
     });
   }
   
   export function use[Feature](id: string) {
     return useQuery({
       queryKey: QUERY_KEY.detail(id),
       queryFn: () => [feature]Api.get(id),
       enabled: !!id,
     });
   }
   
   export function useCreate[Feature]() {
     const queryClient = useQueryClient();
     
     return useMutation({
       mutationFn: [feature]Api.create,
       onMutate: async (newData) => {
         await queryClient.cancelQueries({ queryKey: QUERY_KEY.lists() });
         
         const previousData = queryClient.getQueryData(QUERY_KEY.lists());
         
         // Optimistic update
         queryClient.setQueryData(QUERY_KEY.lists(), (old: any) => ({
           ...old,
           data: [...(old?.data || []), { ...newData, id: 'temp-' + Date.now() }],
         }));
         
         return { previousData };
       },
       onError: (err, newData, context) => {
         queryClient.setQueryData(QUERY_KEY.lists(), context?.previousData);
       },
       onSettled: () => {
         queryClient.invalidateQueries({ queryKey: QUERY_KEY.lists() });
       },
     });
   }
   ```

## ✅ Task Completion Checklist
- [ ] TypeScript types defined
- [ ] Mock service with all CRUD operations
- [ ] Simulated network delays
- [ ] Error simulation capability
- [ ] API service abstraction layer
- [ ] TanStack Query hooks created
- [ ] Optimistic updates working
- [ ] Cache invalidation configured

## 🧪 Testing Notes
- Test optimistic updates work correctly
- Verify error states trigger properly
- Check cache invalidation
- Test network delay simulation
- Ensure TypeScript types are correct

## 📝 Developer Notes
- Mock service maintains state in memory
- API service interface will remain same when switching to real backend
- Query keys structured for efficient cache management
TASK

  # Task 003: Connect UI to Mock API
  cat > "tasks/ISSUE_${ISSUE_NUMBER}/task-003-ui-integration.md" <<'TASK'
# Task 003: Connect UI Components to Mock API

**Issue**: #${ISSUE_NUMBER}  
**Dependencies**: Task 002 (Frontend API Mocks)  
**Estimated Hours**: 2-3  
**Layer**: Frontend  

## 📋 Task Description
Update the UI components to use the TanStack Query hooks instead of static mock data. This establishes the complete data flow on the frontend.

## 🎯 Acceptance Criteria
- [ ] List page uses use[Feature]List hook
- [ ] Detail page uses use[Feature] hook
- [ ] Create/Edit forms use mutation hooks
- [ ] Loading states properly displayed
- [ ] Error states handled gracefully
- [ ] Optimistic updates visible
- [ ] Pull-to-refresh implemented

## 📁 Files to Modify
- `apps/gm2/app/(gm)/(nav-standard)/[feature]/index.tsx`
- `apps/gm2/app/(gm)/(nav-standard)/[feature]/[id].tsx`
- `apps/gm2/app/(gm)/(nav-standard)/[feature]/create.tsx`
- `apps/gm2/components/molecules/[Feature]/[Feature]Form.tsx`

## 🔧 Implementation Steps

1. **Update List Page to Use Hooks**
   ```typescript
   // apps/gm2/app/(gm)/(nav-standard)/[feature]/index.tsx
   import { View, RefreshControl } from 'react-native';
   import { Stack } from 'expo-router';
   import { use[Feature]List } from '~/hooks/use[Feature]';
   import { [Feature]List } from '~/components/molecules/[Feature]/[Feature]List';
   
   export default function [Feature]Page() {
     const { data, isLoading, error, refetch, isRefetching } = use[Feature]List();
     
     return (
       <>
         <Stack.Screen options={{ title: '[Feature]s' }} />
         <View className="flex-1 bg-background">
           <ScrollView
             refreshControl={
               <RefreshControl
                 refreshing={isRefetching}
                 onRefresh={refetch}
               />
             }
           >
             {isLoading ? (
               <LoadingSpinner />
             ) : error ? (
               <ErrorMessage 
                 message={error.message}
                 onRetry={refetch}
               />
             ) : (
               <[Feature]List items={data?.data || []} />
             )}
           </ScrollView>
         </View>
       </>
     );
   }
   ```

2. **Update Detail Page**
   ```typescript
   // apps/gm2/app/(gm)/(nav-standard)/[feature]/[id].tsx
   import { useLocalSearchParams } from 'expo-router';
   import { use[Feature], useUpdate[Feature], useDelete[Feature] } from '~/hooks/use[Feature]';
   
   export default function [Feature]DetailPage() {
     const { id } = useLocalSearchParams<{ id: string }>();
     const { data, isLoading, error } = use[Feature](id);
     const updateMutation = useUpdate[Feature]();
     const deleteMutation = useDelete[Feature]();
     
     const handleUpdate = async (values: Update[Feature]Input) => {
       await updateMutation.mutateAsync({ id, data: values });
       // Show success message
     };
     
     const handleDelete = async () => {
       await deleteMutation.mutateAsync(id);
       router.back();
     };
     
     if (isLoading) return <LoadingSpinner />;
     if (error) return <ErrorMessage message={error.message} />;
     if (!data) return <NotFound />;
     
     return (
       <[Feature]Detail 
         item={data}
         onUpdate={handleUpdate}
         onDelete={handleDelete}
         isUpdating={updateMutation.isPending}
         isDeleting={deleteMutation.isPending}
       />
     );
   }
   ```

3. **Update Create Page**
   ```typescript
   // apps/gm2/app/(gm)/(nav-standard)/[feature]/create.tsx
   import { useRouter } from 'expo-router';
   import { useCreate[Feature] } from '~/hooks/use[Feature]';
   import { [Feature]Form } from '~/components/molecules/[Feature]/[Feature]Form';
   
   export default function Create[Feature]Page() {
     const router = useRouter();
     const createMutation = useCreate[Feature]();
     
     const handleSubmit = async (values: Create[Feature]Input) => {
       try {
         await createMutation.mutateAsync(values);
         router.back();
       } catch (error) {
         // Error handled by form
       }
     };
     
     return (
       <[Feature]Form
         onSubmit={handleSubmit}
         isSubmitting={createMutation.isPending}
         error={createMutation.error?.message}
       />
     );
   }
   ```

## ✅ Task Completion Checklist
- [ ] List page uses query hook
- [ ] Detail page uses query and mutations
- [ ] Create form uses mutation hook
- [ ] Loading states display correctly
- [ ] Error states show retry options
- [ ] Pull-to-refresh works
- [ ] Optimistic updates visible
- [ ] Navigation works after mutations

## 🧪 Testing Notes
- Test all CRUD operations
- Verify optimistic updates
- Test error recovery
- Check loading states
- Test pull-to-refresh

## 📝 Developer Notes
- All data operations now go through mock service
- UI is fully functional with mock backend
- Ready for real API integration in later tasks
TASK

  # Task 004: Database Schema Design
  cat > "tasks/ISSUE_${ISSUE_NUMBER}/task-004-database-schema.md" <<'TASK'
# Task 004: Database Schema Design

**Issue**: #${ISSUE_NUMBER}  
**Dependencies**: Task 003 (UI Integration)  
**Estimated Hours**: 2-3  
**Layer**: Database  

## 📋 Task Description
Design and implement the Prisma schema for the feature based on the UI requirements. This establishes the data model that will support the frontend.

## 🎯 Acceptance Criteria
- [ ] Prisma models created with proper types
- [ ] Relationships defined correctly
- [ ] Indexes added for performance
- [ ] Audit fields included (createdAt, updatedAt)
- [ ] Schema compiles without errors
- [ ] Matches data structure used in UI

## 📁 Files to Modify
- `packages/database/prisma/schema.prisma`

## 🔧 Implementation Steps

1. **Analyze UI Data Requirements**
   - Review the TypeScript types defined in Task 002
   - Identify all fields used in the UI
   - Determine relationships to existing models
   - Consider future extensibility

2. **Design Prisma Schema**
   ```prisma
   // In packages/database/prisma/schema.prisma
   
   model [Feature] {
     id          String   @id @default(cuid())
     name        String
     description String?
     
     // Relations based on requirements
     userId      String
     user        User     @relation(fields: [userId], references: [id])
     
     // Add domain-specific fields
     status      String   @default("active")
     metadata    Json?
     
     // Audit fields
     createdAt   DateTime @default(now())
     updatedAt   DateTime @updatedAt
     
     // Indexes for performance
     @@index([userId])
     @@index([status])
     @@index([createdAt])
   }
   ```

3. **Consider Related Models**
   ```prisma
   // If the feature needs related data
   model [Feature]Item {
     id         String    @id @default(cuid())
     [feature]Id String
     [feature]   [Feature] @relation(fields: [[feature]Id], references: [id], onDelete: Cascade)
     
     // Item-specific fields
     
     createdAt  DateTime  @default(now())
     updatedAt  DateTime  @updatedAt
     
     @@index([[feature]Id])
   }
   ```

4. **Validate Schema**
   ```bash
   cd packages/database
   pnpm db:generate  # Ensure schema is valid
   ```

## ✅ Task Completion Checklist
- [ ] Schema models match UI requirements
- [ ] All fields from TypeScript types included
- [ ] Proper relationships defined
- [ ] Indexes added for query performance
- [ ] Schema generates without errors
- [ ] Follows Dynasty Nerds conventions
## 🧪 Testing Notes
- No automated tests for schema design
- Manual validation with `pnpm db:generate`
- Next task will create migration

## 📝 Developer Notes
- Schema should support all UI operations
- Consider future extensibility
- Follow existing Dynasty Nerds patterns
TASK

  # Task 005: Prisma Migration
  cat > "tasks/ISSUE_${ISSUE_NUMBER}/task-005-prisma-migration.md" <<'TASK'
# Task 005: Create Prisma Migration

**Issue**: #${ISSUE_NUMBER}  
**Dependencies**: Task 004 (Database Schema)  
**Estimated Hours**: 1-2  
**Layer**: Database  

## 📋 Task Description
Create and apply the Prisma migration for the schema changes. This creates the actual database tables.

## 🎯 Acceptance Criteria
- [ ] Migration created with descriptive name
- [ ] Migration applies successfully
- [ ] TypeScript types generated
- [ ] No data loss for existing tables
- [ ] Migration is reversible
- [ ] Development database updated

## 📁 Files Created
- `packages/database/prisma/migrations/[timestamp]_add_[feature]/migration.sql`
- Generated: `node_modules/.prisma/client/` (types)

## 🔧 Implementation Steps

1. **Create Migration**
   ```bash
   cd packages/database
   pnpm db:migrate:dev --name add_[feature]_feature
   ```

2. **Review Generated SQL**
   - Check the generated migration file
   - Ensure it matches intended changes
   - Look for any DROP commands
   - Verify foreign key constraints

3. **Test Migration**
   ```bash
   # Reset test database and apply
   pnpm db:migrate:reset
   
   # Or just deploy to dev
   pnpm db:migrate:deploy
   ```

4. **Generate TypeScript Types**
   ```bash
   pnpm generate  # Updates Prisma client
   ```

5. **Verify with Prisma Studio**
   ```bash
   pnpm db:studio  # Open browser to inspect
   ```

## ✅ Task Completion Checklist
- [ ] Migration file created
- [ ] SQL reviewed for safety
- [ ] Migration applied successfully
- [ ] TypeScript types generated
- [ ] No errors in application
- [ ] Database structure verified

## 🧪 Testing Notes
- Check existing functionality still works
- Verify new tables exist
- Test that types are available

## 📝 Developer Notes
- Migration creates tables for frontend
- No seed data yet
- Ready for repository layer
TASK

  # Task 006: Repository Layer
  cat > "tasks/ISSUE_${ISSUE_NUMBER}/task-006-repository-layer.md" <<'TASK'
# Task 006: Repository Layer (Database Context)

**Issue**: #${ISSUE_NUMBER}  
**Dependencies**: Task 005 (Prisma Migration)  
**Estimated Hours**: 3-4  
**Layer**: API  

## 📋 Task Description
Implement the repository layer (database context) with all CRUD operations. This layer handles database interactions.

## 🎯 Acceptance Criteria
- [ ] Database context created
- [ ] All CRUD operations implemented
- [ ] Efficient queries with proper includes
- [ ] Error handling with try-catch
- [ ] Transaction support where needed
- [ ] Follows Dynasty Nerds patterns

## 📁 Files to Create
- `apps/gm-api/app/context/[Feature]/[feature].db-context.ts`
- `apps/gm-api/app/context/[Feature]/[feature].db-context.test.ts`

## 🔧 Implementation Steps

1. **Create Database Context File**
   ```typescript
   // apps/gm-api/app/context/[Feature]/[feature].db-context.ts
   import type { PrismaClient } from '@prisma/client';
   import { invariant } from '@dynasty-nerds/nerd-types';
   import { NerdLog } from '@dynasty-nerds/nerd-logger';
   
   // CREATE
   export async function create[Feature](
     db: PrismaClient,
     data: Create[Feature]Input
   ) {
     try {
       return await db.[feature].create({
         data: {
           name: data.name,
           description: data.description,
           userId: data.userId,
           // Map all fields from input
         },
       });
     } catch (error) {
       NerdLog.error(`Failed to create [feature]: ${error}`);
       throw error;
     }
   }
   
   // READ
   export async function get[Feature]ById(
     db: PrismaClient,
     id: string
   ) {
     return db.[feature].findUnique({
       where: { id },
       include: {
         user: {
           select: {
             id: true,
             name: true,
             avatar: true,
           },
         },
       },
     });
   }
   
   export async function list[Feature]sByUser(
     db: PrismaClient,
     userId: string,
     options: { limit?: number; offset?: number }
   ) {
     const [items, total] = await db.$transaction([
       db.[feature].findMany({
         where: { userId },
         include: {
           user: true,
         },
         orderBy: { createdAt: 'desc' },
         take: options.limit || 20,
         skip: options.offset || 0,
       }),
       db.[feature].count({ where: { userId } }),
     ]);
     
     return { items, total };
   }
   ```

2. **Add UPDATE and DELETE**
   ```typescript
   // UPDATE
   export async function update[Feature](
     db: PrismaClient,
     id: string,
     userId: string,
     data: Update[Feature]Input
   ) {
     try {
       // Verify ownership
       const existing = await db.[feature].findFirst({
         where: { id, userId },
       });
       
       invariant(existing, 'Not found or unauthorized');
       
       return await db.[feature].update({
         where: { id },
         data: {
           name: data.name,
           description: data.description,
           // Update only provided fields
         },
       });
     } catch (error) {
       NerdLog.error(`Failed to update [feature]: ${error}`);
       throw error;
     }
   }
   
   // DELETE
   export async function delete[Feature](
     db: PrismaClient,
     id: string,
     userId: string
   ) {
     try {
       // Verify ownership before delete
       const existing = await db.[feature].findFirst({
         where: { id, userId },
       });
       
       invariant(existing, 'Not found or unauthorized');
       
       await db.[feature].delete({ where: { id } });
       
       return { success: true };
     } catch (error) {
       NerdLog.error(`Failed to delete [feature]: ${error}`);
       throw error;
     }
   }
   ```

3. **Write Database Context Tests**
   ```typescript
   // apps/gm-api/app/context/[Feature]/[feature].db-context.test.ts
   import { describe, it, expect, beforeEach } from 'vitest';
   import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
   import type { PrismaClient } from '@prisma/client';
   import * as dbContext from './[feature].db-context';
   
   describe('[Feature] DB Context', () => {
     let mockDb: DeepMockProxy<PrismaClient>;
     
     beforeEach(() => {
       mockDb = mockDeep<PrismaClient>();
     });
     
     it('should create [feature]', async () => {
       const mockResult = { id: '1', name: 'Test' };
       mockDb.[feature].create.mockResolvedValue(mockResult);
       
       const result = await dbContext.create[Feature](mockDb, {
         name: 'Test',
         userId: 'user1',
       });
       
       expect(result).toEqual(mockResult);
       expect(mockDb.[feature].create).toHaveBeenCalledWith({
         data: expect.objectContaining({
           name: 'Test',
           userId: 'user1',
         }),
       });
     });
   });
   ```

## ✅ Task Completion Checklist
- [ ] All CRUD operations implemented
- [ ] Ownership verification for updates/deletes
- [ ] Efficient queries with proper includes
- [ ] Transaction support where needed
- [ ] Error handling with logging
- [ ] Unit tests passing

## 🧪 Testing Notes
- Test with mock Prisma client
- Verify ownership checks work
- Test error scenarios
- Check query efficiency

## 📝 Developer Notes
- Follow existing context patterns
- Include only needed relations
- Use transactions for consistency
TASK

  # Task 007: Service Layer
  cat > "tasks/ISSUE_${ISSUE_NUMBER}/task-007-service-layer.md" <<'TASK'
# Task 007: Service Layer Business Logic

**Issue**: #${ISSUE_NUMBER}  
**Dependencies**: Task 006 (Repository Layer)  
**Estimated Hours**: 3-4  
**Layer**: API  

## 📋 Task Description
Implement the service layer containing business logic, validation, and orchestration. This layer sits between API routes and the repository.

## 🎯 Acceptance Criteria
- [ ] Service class created
- [ ] Business rules implemented
- [ ] Input validation logic
- [ ] Permission checks
- [ ] Complex operations handled
- [ ] Service tests written

## 📁 Files to Create
- `apps/gm-api/app/services/[feature]Service.ts`
- `apps/gm-api/app/services/[feature]Service.test.ts`

## 🔧 Implementation Steps

1. **Create Service Class**
   ```typescript
   // apps/gm-api/app/services/[feature]Service.ts
   import type { PrismaClient } from '@prisma/client';
   import { invariant } from '@dynasty-nerds/nerd-types';
   import * as dbContext from '~/context/[Feature]/[feature].db-context';
   
   export class [Feature]Service {
     constructor(private db: PrismaClient) {}
     
     async list[Feature]s(userId: string, options: ListOptions) {
       // Business logic - check permissions
       const user = await this.db.user.findUnique({ where: { id: userId } });
       invariant(user, 'User not found');
       
       // Apply business rules for filtering
       return dbContext.list[Feature]sByUser(this.db, userId, options);
     }
     
     async get[Feature]ById(userId: string, id: string) {
       const [feature] = await dbContext.get[Feature]ById(this.db, id);
       
       // Check permissions
       invariant([feature], 'Not found');
       invariant(
         [feature].userId === userId || [feature].isPublic,
         'Unauthorized'
       );
       
       return [feature];
     }
     
     async create[Feature](userId: string, input: Create[Feature]Input) {
       // Validate business rules
       invariant(input.name?.trim(), 'Name is required');
       invariant(input.name.length <= 100, 'Name too long');
       
       // Check user permissions/limits
       const user = await this.db.user.findUnique({ where: { id: userId } });
       invariant(user, 'User not found');
       
       if (!user.isSubscriber) {
         const count = await this.db.[feature].count({ where: { userId } });
         invariant(count < 5, 'Free users limited to 5 items');
       }
       
       // Transform and create
       const data = {
         ...input,
         name: input.name.trim(),
         userId,
       };
       
       return dbContext.create[Feature](this.db, data);
     }
   }
   ```

2. **Add Update and Delete Methods**
   ```typescript
   async update[Feature](
     userId: string,
     id: string,
     input: Update[Feature]Input
   ) {
     // Validate input
     if (input.name !== undefined) {
       invariant(input.name.trim(), 'Name cannot be empty');
       invariant(input.name.length <= 100, 'Name too long');
     }
     
     // Update with ownership check
     return dbContext.update[Feature](this.db, id, userId, {
       ...input,
       name: input.name?.trim(),
     });
   }
   
   async delete[Feature](userId: string, id: string) {
     // Could add business logic like:
     // - Check if item can be deleted
     // - Soft delete instead of hard delete
     // - Archive related data
     
     return dbContext.delete[Feature](this.db, id, userId);
   }
   ```

3. **Write Service Tests**
   ```typescript
   // apps/gm-api/app/services/[feature]Service.test.ts
   import { describe, it, expect, beforeEach, vi } from 'vitest';
   import { mockDeep } from 'jest-mock-extended';
   import { [Feature]Service } from './[feature]Service';
   import * as dbContext from '~/context/[Feature]/[feature].db-context';
   
   vi.mock('~/context/[Feature]/[feature].db-context');
   
   describe('[Feature]Service', () => {
     let service: [Feature]Service;
     let mockDb: any;
     
     beforeEach(() => {
       mockDb = mockDeep<PrismaClient>();
       service = new [Feature]Service(mockDb);
     });
     
     it('should enforce free user limits', async () => {
       mockDb.user.findUnique.mockResolvedValue({
         id: 'user1',
         isSubscriber: false,
       });
       
       mockDb.[feature].count.mockResolvedValue(5);
       
       await expect(
         service.create[Feature]('user1', { name: 'Test' })
       ).rejects.toThrow('Free users limited to 5 items');
     });
   });
   }
   ```

## ✅ Task Completion Checklist
- [ ] Service class implements business logic
- [ ] All CRUD operations covered
- [ ] Business rules enforced
- [ ] Permission checks in place
- [ ] Input validation complete
- [ ] Unit tests passing

## 🧪 Testing Notes
- Mock database context methods
- Test business rule enforcement
- Verify permission checks
- Test error scenarios

## 📝 Developer Notes
- Service layer enforces all business rules
- Ready for API route integration
TASK

  # Task 008: API Routes
  cat > "tasks/ISSUE_${ISSUE_NUMBER}/task-008-api-routes.md" <<'TASK'
# Task 008: API Route Implementation

**Issue**: #${ISSUE_NUMBER}  
**Dependencies**: Task 007 (Service Layer)  
**Estimated Hours**: 3-4  
**Layer**: API  

## 📋 Task Description
Implement Remix API routes with loaders and actions. Connect the service layer to HTTP endpoints.

## 🎯 Acceptance Criteria
- [ ] API route created with proper naming
- [ ] Loader handles GET requests
- [ ] Action handles mutations (POST/PUT/DELETE)
- [ ] Authentication implemented
- [ ] Consistent error responses
- [ ] Route tests written

## 📁 Files to Create
- `apps/gm-api/app/routes/api.gm.[feature].tsx`
- `apps/gm-api/app/routes/__tests__/api.gm.[feature].test.ts`

## 🔧 Implementation Steps

1. **Create API Route**
   ```typescript
   // apps/gm-api/app/routes/api.gm.[feature].tsx
   import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
   import { json } from '@remix-run/node';
   import { invariantResponse } from '@dynasty-nerds/nerd-types';
   import { userFromContext } from '~/utils/userFromContext';
   import { [Feature]Service } from '~/services/[feature]Service';
   import { NerdLog } from '@dynasty-nerds/nerd-logger';
   
   export async function loader({ request, context }: LoaderFunctionArgs) {
     const { user, db } = await userFromContext(request, context);
     invariantResponse(user, 'Authentication required', { status: 401 });
     
     const url = new URL(request.url);
     const id = url.searchParams.get('id');
     
     const service = new [Feature]Service(db);
     
     try {
       if (id) {
         const result = await service.get[Feature]ById(user.id, id);
         return json({ status: 'success', data: result });
       }
       
       const limit = Number(url.searchParams.get('limit')) || 20;
       const offset = Number(url.searchParams.get('offset')) || 0;
       
       const results = await service.list[Feature]s(user.id, { limit, offset });
       
       return json({ status: 'success', data: results });
     } catch (error) {
       NerdLog.error(`Failed to fetch [feature]: ${error}`);
       return json(
         { status: 'error', message: 'Failed to load data', data: null },
         { status: 500 }
       );
     }
   }
   ```

2. **Add Action Handler**
   ```typescript
   export async function action({ request, context }: ActionFunctionArgs) {
     const { user, db } = await userFromContext(request, context);
     invariantResponse(user, 'Authentication required', { status: 401 });
     
     const formData = await request.formData();
     const intent = formData.get('intent');
     
     const service = new [Feature]Service(db);
     
     try {
       switch (intent) {
         case 'create': {
           const data = JSON.parse(formData.get('data') as string);
           const result = await service.create[Feature](user.id, data);
           return json({ status: 'success', data: result });
         }
         
         case 'update': {
           const id = formData.get('id') as string;
           const data = JSON.parse(formData.get('data') as string);
           const result = await service.update[Feature](user.id, id, data);
           return json({ status: 'success', data: result });
         }
         
         case 'delete': {
           const id = formData.get('id') as string;
           await service.delete[Feature](user.id, id);
           return json({ status: 'success', data: { success: true } });
         }
         
         default:
           return json(
             { status: 'error', message: 'Invalid intent', data: null },
             { status: 400 }
           );
       }
     } catch (error) {
       NerdLog.error(`[Feature] action failed: ${error}`);
       
       // Handle specific errors
       if (error.message.includes('Not found')) {
         return json(
           { status: 'error', message: 'Not found', data: null },
           { status: 404 }
         );
       }
       
       if (error.message.includes('Unauthorized')) {
         return json(
           { status: 'error', message: 'Unauthorized', data: null },
           { status: 403 }
         );
       }
       
       return json(
         { status: 'error', message: error.message, data: null },
         { status: 400 }
       );
     }
   }
   ```

3. **Write Route Tests**
   ```typescript
   // apps/gm-api/app/routes/__tests__/api.gm.[feature].test.ts
   import { describe, it, expect, vi } from 'vitest';
   import { loader, action } from '../api.gm.[feature]';
   
   vi.mock('~/utils/userFromContext');
   vi.mock('~/services/[feature]Service');
   
   describe('api.gm.[feature]', () => {
     it('should require authentication for loader', async () => {
       const mockRequest = new Request('http://test.com/api/gm/[feature]');
       const response = await loader({
         request: mockRequest,
         context: {},
         params: {},
       });
       
       expect(response.status).toBe(401);
     });
   });
   ```

## ✅ Task Completion Checklist
- [ ] API route follows conventions
- [ ] Authentication implemented
- [ ] All CRUD operations working
- [ ] Error responses consistent
- [ ] Route tests passing
- [ ] Service layer integrated

## 🧪 Testing Notes
- Test all HTTP methods
- Verify authentication
- Test error scenarios
- Check response format

## 📝 Developer Notes
- API is now functional
- Ready for frontend integration
TASK

  # Task 009: Connect Frontend to Real API
  cat > "tasks/ISSUE_${ISSUE_NUMBER}/task-009-frontend-api-integration.md" <<'TASK'
# Task 009: Connect Frontend to Real API

**Issue**: #${ISSUE_NUMBER}  
**Dependencies**: Task 008 (API Routes)  
**Estimated Hours**: 2-3  
**Layer**: Frontend  

## 📋 Task Description
Replace the mock service with real API calls. Update the frontend to use the actual backend endpoints.

## 🎯 Acceptance Criteria
- [ ] Mock service replaced with real API
- [ ] API client configured correctly
- [ ] Authentication headers included
- [ ] Error responses handled
- [ ] Loading states work
- [ ] All CRUD operations functional

## 📁 Files to Modify
- `apps/gm2/api/[feature]Api.ts`
- `apps/gm2/utils/apiClient.ts` (if needed)

## 🔧 Implementation Steps

1. **Update API Service to Use Real Endpoints**
   ```typescript
   // apps/gm2/api/[feature]Api.ts
   import { apiClient } from '~/utils/apiClient';
   
   // Remove mock service import
   // import { [feature]MockService } from '~/mocks/[feature]MockService';
   
   export const [feature]Api = {
     list: async (params?: { limit?: number; offset?: number }) => {
       const response = await apiClient.get('/api/gm/[feature]', { params });
       return response.data;
     },
     
     get: async (id: string) => {
       const response = await apiClient.get(`/api/gm/[feature]?id=${id}`);
       return response.data;
     },
     
     create: async (data: Create[Feature]Input) => {
       const formData = new FormData();
       formData.append('intent', 'create');
       formData.append('data', JSON.stringify(data));
       
       const response = await apiClient.post('/api/gm/[feature]', formData);
       return response.data;
     },
     
     update: async (id: string, data: Update[Feature]Input) => {
       const formData = new FormData();
       formData.append('intent', 'update');
       formData.append('id', id);
       formData.append('data', JSON.stringify(data));
       
       const response = await apiClient.post('/api/gm/[feature]', formData);
       return response.data;
     },
     
     delete: async (id: string) => {
       const formData = new FormData();
       formData.append('intent', 'delete');
       formData.append('id', id);
       
       const response = await apiClient.post('/api/gm/[feature]', formData);
       return response.data;
     },
   };
   ```

2. **Verify API Client Configuration**
   ```typescript
   // apps/gm2/utils/apiClient.ts
   import axios from 'axios';
   import AsyncStorage from '@react-native-async-storage/async-storage';
   
   export const apiClient = axios.create({
     baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://api.dynastynerds.com',
     timeout: 30000,
   });
   
   // Add auth token to requests
   apiClient.interceptors.request.use(async (config) => {
     const token = await AsyncStorage.getItem('authToken');
     if (token) {
       config.headers.Authorization = `Bearer ${token}`;
     }
     return config;
   });
   
   // Handle response errors
   apiClient.interceptors.response.use(
     (response) => response,
     (error) => {
       if (error.response?.status === 401) {
         // Handle unauthorized
         // Redirect to login
       }
       return Promise.reject(error);
     }
   );
   ```

3. **Test Integration**
   - Remove or disable mock data
   - Test all CRUD operations
   - Verify error handling
   - Check authentication flow
   - Test with poor network conditions

## ✅ Task Completion Checklist
- [ ] Mock service removed
- [ ] Real API endpoints working
- [ ] Authentication headers sent
- [ ] Error responses handled
- [ ] All CRUD operations tested
- [ ] Loading states functional

## 🧪 Testing Notes
- Test with real backend running
- Verify auth token included
- Test error scenarios
- Check network timeouts

## 📝 Developer Notes
- Frontend now connected to real API
- Ready for full integration testing
TASK

  # Task 010: Integration Tests
  cat > "tasks/ISSUE_${ISSUE_NUMBER}/task-010-integration-tests.md" <<'TASK'
# Task 010: Integration Tests

**Issue**: #${ISSUE_NUMBER}  
**Dependencies**: Tasks 006 & 009 (API and UI complete)  
**Estimated Hours**: 3-4  
**Layer**: All  

## 📋 Task Description
Write comprehensive integration tests covering the full stack from database to UI. Ensure all layers work together correctly.

## 🎯 Acceptance Criteria
- [ ] Database integration tests
- [ ] API endpoint tests
- [ ] Frontend component tests
- [ ] End-to-end flow tests
- [ ] Error scenario tests
- [ ] Performance benchmarks

## 📁 Files to Create
- Create: `apps/gm-api/app/routes/__tests__/api.gm.[feature].integration.test.ts`
- Create: `apps/gm2/components/molecules/[Feature]/__tests__/[Feature]Integration.test.tsx`
- Update: Existing test files with integration scenarios

## 🔧 Implementation Steps

1. **Database Integration Tests**
   ```typescript
   // apps/gm-api/app/context/[Feature]/[feature].db-context.db.test.ts
   import { createTestDatabase, cleanupDatabase } from '~/test/utils';
   
   describe('[Feature] Database Integration', () => {
     let db: PrismaClient;
     
     beforeAll(async () => {
       db = await createTestDatabase();
     });
     
     afterAll(async () => {
       await cleanupDatabase(db);
     });
     
     describe('create[Feature]', () => {
       it('should create with all fields', async () => {
         const user = await createTestUser(db);
         
         const result = await create[Feature](db, {
           userId: user.id,
           name: 'Test Feature',
           description: 'Test description',
         });
         
         expect(result).toMatchObject({
           id: expect.any(String),
           userId: user.id,
           name: 'Test Feature',
         });
         
         // Verify in database
         const saved = await db.[feature].findUnique({
           where: { id: result.id },
         });
         expect(saved).toBeTruthy();
       });
       
       it('should handle concurrent creates', async () => {
         const promises = Array(5).fill(null).map((_, i) => 
           create[Feature](db, {
             userId: user.id,
             name: \`Feature \${i}\`,
           })
         );
         
         const results = await Promise.all(promises);
         expect(results).toHaveLength(5);
       });
     });
   });
   ```

2. **API Integration Tests**
   ```typescript
   // apps/gm-api/app/routes/__tests__/api.gm.[feature].integration.test.ts
   describe('API Integration: /api/gm/[feature]', () => {
     let request: SuperTest;
     let authCookie: string;
     
     beforeAll(async () => {
       request = createTestRequest();
       authCookie = await loginTestUser(request);
     });
     
     describe('Full CRUD Flow', () => {
       let createdId: string;
       
       it('should create a new [feature]', async () => {
         const response = await request
           .post('/api/gm/[feature]')
           .set('Cookie', authCookie)
           .field('intent', 'create')
           .field('data', JSON.stringify({
             name: 'Integration Test Feature',
             description: 'Created via integration test',
           }));
         
         expect(response.status).toBe(200);
         expect(response.body).toMatchObject({
           status: 'success',
           data: {
             id: expect.any(String),
             name: 'Integration Test Feature',
           },
         });
         
         createdId = response.body.data.id;
       });
       
       it('should fetch the created [feature]', async () => {
         const response = await request
           .get(\`/api/gm/[feature]?id=\${createdId}\`)
           .set('Cookie', authCookie);
         
         expect(response.status).toBe(200);
         expect(response.body.data.id).toBe(createdId);
       });
       
       it('should update the [feature]', async () => {
         const response = await request
           .post('/api/gm/[feature]')
           .set('Cookie', authCookie)
           .field('intent', 'update')
           .field('id', createdId)
           .field('data', JSON.stringify({
             name: 'Updated Feature Name',
           }));
         
         expect(response.status).toBe(200);
         expect(response.body.data.name).toBe('Updated Feature Name');
       });
       
       it('should delete the [feature]', async () => {
         const response = await request
           .post('/api/gm/[feature]')
           .set('Cookie', authCookie)
           .field('intent', 'delete')
           .field('id', createdId);
         
         expect(response.status).toBe(200);
         
         // Verify it's gone
         const getResponse = await request
           .get(\`/api/gm/[feature]?id=\${createdId}\`)
           .set('Cookie', authCookie);
         
         expect(getResponse.status).toBe(404);
       });
     });
   });
   ```

3. **Frontend Integration Tests**
   ```typescript
   // apps/gm2/components/molecules/[Feature]/__tests__/[Feature]Integration.test.tsx
   import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
   import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
   import { [Feature]Page } from '~/app/(gm)/(nav-standard)/[feature]/index';
   
   describe('[Feature] Frontend Integration', () => {
     const createWrapper = () => {
       const queryClient = new QueryClient({
         defaultOptions: { queries: { retry: false } },
       });
       
       return ({ children }) => (
         <QueryClientProvider client={queryClient}>
           {children}
         </QueryClientProvider>
       );
     };
     
     it('should load and display [feature]s', async () => {
       // Mock API response
       fetchMock.mockResponseOnce(JSON.stringify({
         status: 'success',
         data: [
           { id: '1', name: 'Feature 1' },
           { id: '2', name: 'Feature 2' },
         ],
       }));
       
       render(<[Feature]Page />, { wrapper: createWrapper() });
       
       // Should show loading
       expect(screen.getByTestId('loading-spinner')).toBeTruthy();
       
       // Should display items
       await waitFor(() => {
         expect(screen.getByText('Feature 1')).toBeTruthy();
         expect(screen.getByText('Feature 2')).toBeTruthy();
       });
     });
   });
   ```

## ✅ Task Completion Checklist
- [ ] Database tests with real DB
- [ ] API tests with auth
- [ ] Frontend component tests
- [ ] Full CRUD flow tested
- [ ] Error scenarios covered
- [ ] Performance acceptable

## 🧪 Testing Notes
- Use test database for DB tests
- Mock external services
- Test with realistic data volumes
- Verify cleanup after tests

## 📝 Developer Notes
[Document integration test setup and special considerations]
TASK

  # Task 011: Performance Optimization
  cat > "tasks/ISSUE_${ISSUE_NUMBER}/task-011-performance.md" <<'TASK'
# Task 011: Performance Optimization

**Issue**: #${ISSUE_NUMBER}  
**Dependencies**: Task 010 (Integration Tests)  
**Estimated Hours**: 2-3  
**Layer**: All  

## 📋 Task Description
Optimize performance across all layers. Add database indexes, implement caching, optimize queries, and improve frontend rendering.

## 🎯 Acceptance Criteria
- [ ] Database queries optimized
- [ ] Proper indexes added
- [ ] Caching implemented
- [ ] Frontend rendering optimized
- [ ] API response times < 200ms
- [ ] No N+1 query problems

## 📁 Files to Modify
- Update: `packages/database/prisma/schema.prisma` (indexes)
- Update: API routes (caching)
- Update: Frontend components (memoization)

## 🔧 Implementation Steps

1. **Database Optimization**
   ```prisma
   // Add indexes to schema.prisma
   model [Feature] {
     // ... existing fields
     
     @@index([userId, createdAt(sort: Desc)])
     @@index([status, createdAt(sort: Desc)])
     @@index([name])
   }
   ```

2. **Implement Caching**
   ```typescript
   // apps/gm-api/app/routes/api.gm.[feature].tsx
   import { cachified } from '@epic-web/cachified';
   import { cache } from '~/utils/cache.server';
   
   export async function loader({ request, context }: LoaderFunctionArgs) {
     const { user, db } = await userFromContext(request, context);
     
     const cacheKey = \`[feature]-list-\${user.id}\`;
     
     const data = await cachified({
       key: cacheKey,
       cache,
       async getFreshValue() {
         const startTime = Date.now();
         const result = await service.list[Feature]s(user.id);
         
         const duration = Date.now() - startTime;
         if (duration > 1000) {
           NerdLog.warn(\`Slow query: [feature] list took \${duration}ms\`);
         }
         
         return result;
       },
       ttl: 1000 * 60 * 5, // 5 minutes
     });
     
     return json({ status: 'success', data });
   }
   ```

3. **Optimize Frontend Rendering**
   ```typescript
   // Memoize expensive components
   export const [Feature]Card = React.memo(({ item, onPress }: [Feature]CardProps) => {
     // Component implementation
   }, (prevProps, nextProps) => {
     // Custom comparison for re-render optimization
     return prevProps.item.id === nextProps.item.id &&
            prevProps.item.updatedAt === nextProps.item.updatedAt;
   });
   
   // Use callback memoization
   export function [Feature]List({ items }: [Feature]ListProps) {
     const router = useRouter();
     
     const handleItemPress = useCallback((item: [Feature]) => {
       router.push(\`/[feature]/\${item.id}\`);
     }, [router]);
     
     const renderItem = useCallback(({ item }) => (
       <[Feature]Card 
         item={item} 
         onPress={() => handleItemPress(item)}
       />
     ), [handleItemPress]);
     
     return (
       <FlatList
         data={items}
         renderItem={renderItem}
         keyExtractor={(item) => item.id}
         getItemLayout={(data, index) => ({
           length: ITEM_HEIGHT,
           offset: ITEM_HEIGHT * index,
           index,
         })}
         removeClippedSubviews={true}
         maxToRenderPerBatch={10}
         windowSize={10}
       />
     );
   }
   ```

4. **Query Optimization**
   ```typescript
   // Optimize database queries
   export async function get[Feature]sWithDetails(
     db: PrismaClient,
     userId: string,
     options: QueryOptions
   ) {
     // Use field selection to avoid over-fetching
     return db.[feature].findMany({
       where: { userId },
       select: {
         id: true,
         name: true,
         description: true,
         status: true,
         createdAt: true,
         // Only include what's needed
         user: {
           select: {
             id: true,
             name: true,
           },
         },
       },
       take: options.limit,
       skip: options.offset,
     });
   }
   ```

## ✅ Task Completion Checklist
- [ ] Database indexes added
- [ ] Queries use field selection
- [ ] Caching implemented
- [ ] Frontend memoization added
- [ ] Performance metrics logged
- [ ] Load testing performed

## 🧪 Testing Notes
- Run query analysis: `EXPLAIN ANALYZE`
- Test with large data sets
- Monitor API response times
- Check React DevTools Profiler

## 📝 Developer Notes
[Document performance bottlenecks found and solutions applied]
TASK

  # Task 012: Documentation
  cat > "tasks/ISSUE_${ISSUE_NUMBER}/task-012-documentation.md" <<'TASK'
# Task 012: Documentation

**Issue**: #${ISSUE_NUMBER}  
**Dependencies**: Task 011 (Performance Complete)  
**Estimated Hours**: 1-2  
**Layer**: All  

## 📋 Task Description
Create comprehensive documentation for the feature including API docs, component docs, and usage examples.

## 🎯 Acceptance Criteria
- [ ] API documentation complete
- [ ] Component storybook (if applicable)
- [ ] README updated
- [ ] Code comments added
- [ ] Migration guide (if breaking changes)
- [ ] Performance notes documented

## 📁 Files to Create/Update
- Update: `README.md` (feature section)
- Create: `docs/features/[feature].md`
- Update: Code files with JSDoc comments

## 🔧 Implementation Steps

1. **API Documentation**
   ```markdown
   # [Feature] API
   
   ## Endpoints
   
   ### GET /api/gm/[feature]
   Fetches a list of [feature]s for the authenticated user.
   
   **Query Parameters:**
   - \`id\` (optional): Fetch specific [feature] by ID
   - \`limit\` (optional): Number of items to return (default: 20)
   - \`offset\` (optional): Pagination offset (default: 0)
   
   **Response:**
   \`\`\`json
   {
     "status": "success",
     "data": [
       {
         "id": "string",
         "name": "string",
         "description": "string",
         "createdAt": "ISO 8601 date",
         "updatedAt": "ISO 8601 date"
       }
     ]
   }
   \`\`\`
   
   ### POST /api/gm/[feature]
   Creates, updates, or deletes [feature]s.
   
   **Form Data:**
   - \`intent\`: "create" | "update" | "delete"
   - \`data\`: JSON stringified data
   - \`id\`: Required for update/delete
   
   **Error Responses:**
   - 400: Validation error
   - 401: Authentication required
   - 403: Insufficient permissions
   - 500: Server error
   ```

2. **Component Documentation**
   ```typescript
   /**
    * [Feature]List Component
    * 
    * Displays a list of [feature]s with pull-to-refresh and infinite scroll.
    * 
    * @example
    * <[Feature]List 
    *   items={features}
    *   onItemPress={(item) => console.log(item)}
    *   refreshing={isRefreshing}
    *   onRefresh={handleRefresh}
    * />
    * 
    * @param items - Array of [feature] objects
    * @param onItemPress - Callback when item is pressed
    * @param refreshing - Pull-to-refresh state
    * @param onRefresh - Pull-to-refresh handler
    */
   ```

3. **README Update**
   ```markdown
   ## Features
   
   ### [Feature] Management
   
   The [feature] management system allows users to:
   - Create and manage [feature]s
   - View [feature] details
   - Update [feature] information
   - Delete [feature]s
   
   #### Usage
   
   \`\`\`typescript
   import { use[Feature]List, useCreate[Feature] } from '~/hooks/use[Feature]';
   
   function My[Feature]Screen() {
     const { data, isLoading } = use[Feature]List();
     const createMutation = useCreate[Feature]();
     
     const handleCreate = async (input: Create[Feature]Input) => {
       await createMutation.mutateAsync(input);
     };
     
     // Render UI
   }
   \`\`\`
   
   #### Performance Considerations
   
   - Lists are cached for 5 minutes
   - Optimistic updates improve perceived performance
   - Large lists use virtualization
   - Database queries are optimized with indexes
   ```

4. **Migration Guide (if needed)**
   ```markdown
   # [Feature] Migration Guide
   
   ## Breaking Changes
   
   None - this is a new feature.
   
   ## Database Migrations
   
   Run the following to apply database changes:
   \`\`\`bash
   pnpm db:migrate:deploy
   \`\`\`
   
   ## API Changes
   
   New endpoints added:
   - GET /api/gm/[feature]
   - POST /api/gm/[feature]
   ```

## ✅ Task Completion Checklist
- [ ] API endpoints documented
- [ ] Component props documented
- [ ] Usage examples provided
- [ ] Performance notes included
- [ ] README section added
- [ ] Code comments complete

## 🧪 Testing Notes
- Verify documentation accuracy
- Test all code examples
- Check for missing docs

## 📝 Developer Notes
[Note any documentation decisions or areas needing future expansion]
TASK

  echo "✅ Created 12 task files in tasks/ISSUE_${ISSUE_NUMBER}/"
}

# Generate all task files
generate_task_files

````

### Step 7: Commit and Push Changes

```bash
# Add all changes including the plan file and task files
git add IMPLEMENTATION_PLAN_${ISSUE_NUMBER}.md
git add tasks/ISSUE_${ISSUE_NUMBER}/

# Commit with conventional commit format
git commit -m "feat: add implementation plan and task breakdown for issue #${ISSUE_NUMBER}

- Create detailed implementation plan with 12 atomic tasks
- Generate individual task markdown files for each deliverable
- Include task dependency graph and time estimates
- Add TypeScript/React/React Native specific implementation details
- Define clear acceptance criteria for each task

See #${ISSUE_NUMBER}"

# Push the changes
git push
echo "✅ Pushed implementation plan and task files"
````

### Step 8: Create Pull Request

```bash
# Create PR with detailed description (can be done from worktree)
PR_BODY=$(cat <<PR_DESC
## 📋 Implementation Plan for Issue #${ISSUE_NUMBER}

### 🎯 Overview
This PR contains the implementation plan and 12 atomic task breakdowns for resolving issue #${ISSUE_NUMBER}.

### 📚 What's Included
- [ ] Master implementation plan (\`IMPLEMENTATION_PLAN_${ISSUE_NUMBER}.md\`)
- [ ] 12 individual task files in \`tasks/ISSUE_${ISSUE_NUMBER}/\`
- [ ] Task dependency graph and sequencing
- [ ] Detailed acceptance criteria for each task
- [ ] Layer-specific implementation guidance (Database, API, Frontend)

### 📁 Task Files Created
\`\`\`
tasks/ISSUE_${ISSUE_NUMBER}/
├── task-001-ui-mockup.md
├── task-002-frontend-api-mocks.md
├── task-003-ui-integration.md
├── task-004-database-schema.md
├── task-005-prisma-migration.md
├── task-006-repository-layer.md
├── task-007-service-layer.md
├── task-008-api-routes.md
├── task-009-frontend-api-integration.md
├── task-010-integration-tests.md
├── task-011-performance.md
└── task-012-documentation.md
\`\`\`

### 🔄 Implementation Process
1. Developers pick tasks sequentially from 001-012
2. Each task is a standalone PR that can be merged independently
3. Tasks have clear dependencies noted in their headers
4. Multiple developers can work in parallel after task 005

### 🧪 Testing Strategy
- Database tests with real PostgreSQL (.db.test.ts)
- API tests with authentication and validation
- Frontend tests with React Native Testing Library
- Integration tests covering all layers
- Performance benchmarks and optimization

### 🔗 Related Issue
Resolves #${ISSUE_NUMBER}

### 📝 Notes for Reviewers
- This PR contains only the planning artifacts
- Each task is designed to be completed in 1-6 hours
- Tasks can be assigned to different developers
- Review individual task files for implementation details

### ✅ Ready for Implementation
Once approved, developers can begin picking tasks from the sequence.

---
*🤖 Generated by Implementation Planning Assistant with Task Breakdown*
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
# Post the plan content with task list as a comment on the issue
COMMENT_WITH_TASKS=$(cat <<COMMENT
$PLAN_CONTENT

---

## 📁 Task Breakdown Files

Individual task files have been created in \`tasks/ISSUE_${ISSUE_NUMBER}/\`:

| # | Task File | Description | Hours |
|---|-----------|-------------|-------|
| 001 | task-001-ui-mockup.md | UI Mockup with Static Data | 3-4 |
| 002 | task-002-frontend-api-mocks.md | Frontend API Integration with Mock Service | 3-4 |
| 003 | task-003-ui-integration.md | Connect UI Components to Mock API | 2-3 |
| 004 | task-004-database-schema.md | Database Schema Design | 2-3 |
| 005 | task-005-prisma-migration.md | Create Prisma Migration | 1-2 |
| 006 | task-006-repository-layer.md | Repository Layer (Database Context) | 3-4 |
| 007 | task-007-service-layer.md | Service Layer Business Logic | 3-4 |
| 008 | task-008-api-routes.md | API Route Implementation | 3-4 |
| 009 | task-009-frontend-api-integration.md | Connect Frontend to Real API | 2-3 |
| 010 | task-010-integration-tests.md | Integration Tests | 3-4 |
| 011 | task-011-performance.md | Performance Optimization | 2-3 |
| 012 | task-012-documentation.md | Documentation | 1-2 |

Each task file contains:
- Detailed implementation steps
- Acceptance criteria
- Code examples
- Testing notes
- Developer guidance

Developers can pick tasks sequentially and create individual PRs for each task.
COMMENT
)

gh issue comment $ARGUMENTS --body "$COMMENT_WITH_TASKS"

echo "✅ Posted implementation plan to issue #$ARGUMENTS"
echo "✅ Created implementation plan file: IMPLEMENTATION_PLAN_${ISSUE_NUMBER}.md"
echo "✅ Created 12 task files in tasks/ISSUE_${ISSUE_NUMBER}/"
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

1. **Atomic Tasks** - Each task can be completed and merged independently
2. **Clear Dependencies** - Tasks explicitly state which prior tasks must be complete
3. **Specific File References** - Name actual files based on Dynasty Nerds project structure
4. **TypeScript/Prisma Types** - Define types for all new data structures and models
5. **React Native Patterns** - Follow Expo Router and NativeWind conventions
6. **Realistic Estimates** - 1-6 hours per task based on complexity
7. **Testable Deliverables** - Each task has concrete acceptance criteria
8. **Layer Separation** - Tasks are organized by layer (Database → API → Frontend)
9. **Performance Awareness** - Consider caching, indexes, and rendering optimization
10. **Dynasty Nerds Patterns** - Use invariant validation, Repository pattern, Service layer

## Dynasty Nerds Codebase Best Practices

**Code Style & Conventions**:
- **File Naming**: camelCase for TS files, PascalCase for components, kebab-case for routes
- **Function Naming**: camelCase (e.g., `upsertUser`, `getIsSubscriberFromRequest`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `JWT_STATE_KEY`, `MISSING_PLAYER_HEADSHOT`)
- **Types/Interfaces**: PascalCase with descriptive names (e.g., `UpsertUserParams`)
- **Import Order**: External → Internal packages → Local modules → Types

**Error Handling Patterns**:
- Heavy use of `invariant` for runtime assertions
- Custom `invariantResponse` for HTTP responses
- Structured error logging with `NerdLog.error()`
- Try-catch at API boundaries with user-friendly messages

**Security Patterns**:
- JWT validation with RSA keys
- Role-based access control (subscriber checks)
- Input sanitization through invariant checks
- No direct SQL - always use Prisma parameterized queries
- Environment variables for sensitive configuration

**Performance Patterns**:
- React hooks optimization (useMemo, useCallback, useDebounce)
- Database query optimization with field selection
- Materialized views for complex aggregations
- Redis caching for hot data (1-hour TTL)
- Parallel processing with BullMQ

**Database Layer Conventions**:
- Follow existing Prisma schema patterns with 100+ models
- Use proper relation naming (camelCase) with explicit relation names
- Include audit fields: createdAt, updatedAt on all models
- Add comprehensive indexes for query performance
- Use materialized views for complex aggregations (vw_dynasty_ranks, etc.)
- Soft deletes where appropriate
- JSON fields for flexible data structures
- Consistent ID strategy: `@id @default(cuid())`

**Schema Pattern**:
```prisma
model Feature {
  id        String   @id @default(cuid())
  name      String
  data      Json?
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([createdAt])
}
```

**API Layer Conventions**:
- Remix route naming: `api.gm.feature-name.tsx` for APIs, `admin-ui.feature.tsx` for admin
- Use loaders for GET with auth check, actions for mutations with validation
- Implement proper error boundaries with user-friendly messages
- Service layer (`/services/`) for business logic separation
- Context layer (`/context/`) for database operations (Repository pattern)
- BullMQ jobs in `/queues/` for async processing
- Redis caching with cachified for expensive operations
- Socket.IO events: `feature:update`, `feature:create` with room management

**Context/Repository Pattern**:
```typescript
// apps/gm-api/app/context/Feature/feature.db-context.ts
export async function getFeatureById(db: PrismaClient, id: string) {
  return db.feature.findUnique({ where: { id } });
}
```

**Frontend Layer Conventions**:
- Expo Router file structure: `app/(gm)/(nav-standard)/feature/index.tsx`
- NativeWind classes with consistent patterns: `className="flex-1 bg-background"`
- Platform-specific code when needed (iOS vs Android)
- TanStack Query with optimistic updates and cache invalidation
- Component hierarchy: atoms → molecules → organisms
- Custom hooks in `hooks/` directory following `useFeatureName` pattern
- Zustand for global state with AsyncStorage persistence
- React Native Reanimated for animations

**State Management**:
```typescript
// Zustand store with persist
const useStore = create(persist(
  (set) => ({ /* store definition */ }),
  { name: 'store-name', storage: AsyncStorage }
));
```

**Testing Conventions**:
- Smart test runner: `.test.ts` for unit tests, `.db.test.ts` for database tests
- Vitest with inline snapshots: `toMatchInlineSnapshot()`
- Mock external APIs with MSW and stub data files
- Use test database for integration tests with real PostgreSQL
- Follow AAA pattern (Arrange, Act, Assert)
- Test factories for consistent test data generation
- Separate vitest configs for unit vs database tests

**Test Organization**:
```typescript
describe('Feature Name', () => {
  describe('Specific functionality', () => {
    it('should do something specific', async () => {
      // Test implementation
    });
  });
});
```

## Execution Instructions

1. **Parse clarification answers** from the previous comment
2. **Prepare for implementation** and store issue details
3. **Explore codebase systematically** using parallel Task analysis
4. **Create master plan** with task breakdown and dependency graph
5. **Generate 12 task files** in `tasks/ISSUE_${ISSUE_NUMBER}/` directory
6. **Save plan as markdown file** in the repository root
7. **Commit and push** both plan and task files
8. **Create pull request** with task list and implementation process
9. **Post plan as GitHub comment** with task summary table

Execute this complete workflow now for issue #$ARGUMENTS in the dynasty-nerds-monorepo.

**Remember to consider**:
1. The three-layer architecture (database → API → frontend)
2. Existing patterns from codebase analysis:
   - 8 core domains (Player, League, Trade, Rankings, etc.)
   - Clean Architecture with Repository/Service patterns
   - Error handling with invariant assertions
   - Performance patterns (caching, materialized views)
   - Security patterns (JWT, role-based access)
3. Testing requirements for each layer:
   - Smart test runner (.test.ts vs .db.test.ts)
   - Vitest with inline snapshots
   - Test factories for data generation
4. Mobile-first user experience with Expo/React Native
5. Fantasy football domain specifics and platform integrations

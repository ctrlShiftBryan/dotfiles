# DNM Create Database/Context/Service Plan

You are an expert software architect specializing in Prisma database design and TypeScript service layer architecture for the Dynasty Nerds monorepo. Your task is to create a focused implementation plan for ONLY the database layer, context layer, and service layer based on a GitHub issue.

## Codebase Context

Working in the current codebase.

### Key Patterns to Follow:

1. **Prisma Schema** (`packages/database/prisma/schema.prisma`):
   ```prisma
   model TableName {
     id        Int      @id @default(autoincrement())
     createdAt DateTime @default(now()) @map("created_at")
     updatedAt DateTime @updatedAt @map("updated_at")
     
     // Fields always use @map for snake_case
     fieldName String @map("field_name")
     
     // Relations
     relatedModel   RelatedModel? @relation(fields: [relatedModelId], references: [id])
     relatedModelId Int?          @map("related_model_id")
     
     @@index([fieldName])
     @@map("table_name_snake_case")
   }
   ```

2. **Context Pattern** (`apps/gm-api/app/context/`):
   - Functions always accept `db: PrismaClient` as the LAST parameter
   - Return Prisma types directly
   - Handle upserts within the function
   - Example: `BannerTracking/BannerTracking.ts`
   ```typescript
   export async function trackClick(
     bannerId: number,
     userId: number,
     db: PrismaClient
   ): Promise<BannerClick> {
     return db.bannerClick.create({...});
   }
   ```

3. **Service/Feature Pattern** (`apps/gm-api/app/feature/`):
   - Props object first, `PrismaClient` second
   - Use `invariant` for assertions
   - Dates passed as parameters for pure functions
   ```typescript
   export async function processFeature(
     props: { data: any; date: Date },
     db: PrismaClient
   ): Promise<Result> {
     invariant(props.data, "Data required");
     // coordinate contexts
   }
   ```

4. **Testing Patterns**:
   - **DB Test Naming**: `ModuleName.functionName.db.test.ts`
   - **Unit Test Naming**: `functionName.test.ts`
   - **JSON Stubs**: `stubs/feature/FeatureName/functionName/data.json`
   - **Test Structure**:
     ```typescript
     import { stripDates, readJsonStub } from '~/utils/test-helper';
     import { deleteAll } from 'prisma/prismaTestHelpers';
     
     const stub = await readJsonStub(__dirname, 
       '../../stubs/feature/FeatureName/functionName/data.json'
     );
     
     beforeEach(async () => {
       await deleteAll(prisma, ['Table1', 'Table2']);
     });
     
     it('test case', async () => {
       const result = await functionName(params, prisma);
       // ALWAYS pass true to stripDates to remove both dates and IDs
       expect(stripDates(result, true)).toMatchInlineSnapshot(`...`);
     });
     ```
   
   - **Test Helper Usage** (`apps/gm-api/app/utils/test-helper.ts`):
     - `stripDates(data, true)` - ALWAYS pass `true` to strip both dates AND IDs
     - `readJsonStub(dirname, path)` - Load JSON test data from stubs
     - Use `toMatchInlineSnapshot` for inline assertions
     - Use `toMatchSnapshot` for larger data structures

## Your Task

### 1. Fetch and Analyze the Issue

```bash
gh issue view <issue-number> --json title,body,comments
```

### 2. Extract Database Requirements

Focus on:

- What entities need to be stored?
- What relationships exist between entities?
- What queries and operations are needed?
- What business rules require service coordination?

### 3. Create the Plan

Create a markdown file at `plans/YYYY-MM-DD-HH-MMam-pm-db-context-service-plan.md` with:

````markdown
# Database/Context/Service Implementation Plan for [Issue Title]

## Overview

[Brief summary of database requirements extracted from issue]

## 1. Prisma Schema Changes

### New Models

- [ ] Add model `ModelName` to `packages/database/prisma/schema.prisma`

  ```prisma
  model ModelName {
    id        Int      @id @default(autoincrement())
    createdAt DateTime @default(now()) @map("created_at")
    updatedAt DateTime @updatedAt @map("updated_at")
    
    // All fields must use @map for snake_case
    fieldName String   @map("field_name")
    isActive  Boolean  @default(true) @map("is_active")
    userId    Int      @map("user_id")
    
    // Relations (foreign key comes after relation)
    user      User     @relation(fields: [userId], references: [id])
    
    // Optional relations
    teamId    Int?     @map("team_id")
    team      Team?    @relation(fields: [teamId], references: [id])
    
    // Indexes for query performance
    @@index([userId])
    @@index([fieldName])
    
    // Table name in snake_case
    @@map("model_names")
  }
  ```
````

### Modified Models

- [ ] Add field `newField` to `ExistingModel`

## 2. Migration Tasks

- [ ] Run `pnpm prisma migrate dev --name add_feature_name_tables`
- [ ] Verify migration with `pnpm prisma studio`

## 3. Context Implementation

### New Context: `apps/gm-api/app/context/FeatureName/`

- [ ] Create `FeatureName.ts` with exported functions:

  ```typescript
  export async function createFeature(
    props: CreateFeatureProps,
    db: PrismaClient
  ): Promise<Feature> { ... }

  export async function getFeatureById(
    id: number,
    db: PrismaClient
  ): Promise<Feature | null> { ... }
  ```

### Context Methods to Implement

- [ ] `createFeature()` - Creates new feature with validation
- [ ] `updateFeature()` - Updates existing feature
- [ ] `getFeatureById()` - Retrieves single feature
- [ ] `listFeatures()` - Lists with filtering/pagination
- [ ] `deleteFeature()` - Soft/hard delete

### Context Tests

- [ ] `FeatureName.createFeature.db.test.ts`
  ```typescript
  import { stripDates } from '~/utils/test-helper';
  import { deleteAll } from 'prisma/prismaTestHelpers';
  
  const tables = ['ModelName', 'RelatedTable'];
  
  beforeEach(async () => {
    await deleteAll(prisma, tables);
  });
  
  it('creates feature', async () => {
    const result = await createFeature(props, prisma);
    // Always pass true to strip both dates and IDs
    expect(stripDates(result, true)).toMatchInlineSnapshot(`...`);
  });
  ```
- [ ] `FeatureName.getFeatureById.db.test.ts`
  - Found case with `stripDates(result, true)`
  - Not found returns null
  - Include relations test with `stripDates(result, true)`
- [ ] `FeatureName.listFeatures.db.test.ts`
  - Test filtering logic
  - Pagination limits
  - Sort order verification

## 4. Service/Feature Implementation

### New Feature: `apps/gm-api/app/feature/FeatureName/`

- [ ] Create main coordinator: `processFeature.ts`
  ```typescript
  export async function processFeature(
    props: ProcessFeatureProps,
    db: PrismaClient
  ): Promise<ProcessFeatureResult> {
    // Coordinate multiple contexts
    // Handle business logic
    // Use invariant for assertions
  }
  ```

### Service Methods

- [ ] `processFeature()` - Main business logic coordinator
- [ ] `validateFeatureRules()` - Business rule validation
- [ ] `calculateFeatureMetrics()` - Complex calculations

### Helper Functions

- [ ] Create pure functions in `feature/FeatureName/helpers/`
- [ ] Add type definitions in `feature/FeatureName/types.ts`

### Service Tests

- [ ] `processFeature.test.ts` - Pure unit tests
  ```typescript
  import { readJsonStub } from '~/utils/test-helper';
  
  const stub = await readJsonStub(__dirname,
    '../../stubs/feature/FeatureName/processFeature/data.json'
  );
  
  it('processes feature', () => {
    const date = '2024-01-01T00:00:00.000Z';
    const result = processFeature({
      data: stub.dataKey,
      date: new Date(date),
    });
    expect(result).toMatchSnapshot();
  });
  ```
- [ ] `processFeature.db.test.ts` - Integration with real DB
- [ ] Create JSON stubs:
  - `stubs/feature/FeatureName/processFeature/data.json`
  - `stubs/feature/FeatureName/processFeature/edge-cases.json`

## 5. Implementation Order

1. Update Prisma schema
2. Run migration
3. Implement context functions
4. Write context tests
5. Implement service/feature logic
6. Write service tests
7. Verify all tests pass

## Technical Notes

- Database: PostgreSQL with Prisma ORM
- Testing: Vitest with real database
- Use `deleteAll` for test cleanup
- Pass dates as parameters for pure functions
- Use TypeScript strict mode

## JSON Stub Example

`stubs/feature/FeatureName/functionName/data.json`:
```json
{
  "users": [
    {
      "id": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "name": "Test User",
      "email": "test@example.com"
    }
  ],
  "features": [
    {
      "id": 1,
      "userId": 1,
      "fieldName": "value",
      "isActive": true
    }
  ]
}

```

## Important Guidelines

1. **Follow Existing Patterns**: Match the codebase's established patterns exactly
2. **Database First**: Schema and migration before any code
3. **Test Everything**: Every context and service method needs .db.test.ts
4. **Pure Functions**: Keep business logic pure when possible
5. **No Mocking**: Use real database for all .db.test.ts files
6. **Single Responsibility**: Contexts handle DB, services handle coordination
7. **Test Helpers**: ALWAYS use `stripDates(result, true)` in tests to remove dates AND IDs
8. **JSON Stubs**: Use `readJsonStub` for loading test data from `stubs/` directory

## Output

After creating the plan:
1. Save to `plans/` with timestamp
2. Present summary with task count
3. Confirm plan covers all database requirements from issue

Remember: This plan should be immediately executable following the Dynasty Nerds codebase patterns.
```

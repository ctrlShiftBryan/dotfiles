# New Codebase: Implement GitHub Issue from Scratch

You are tasked with implementing a feature described in a GitHub issue for a new project. This guide will help you set up the project infrastructure and implement the feature using Test-Driven Development (TDD).

## Initial Project Setup

Before implementing any features, ensure your project has the proper foundation.

### Step 1: Initialize Project and Repository

```bash
# Initialize git repository
git init
git branch -M main

# Create comprehensive .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
package-lock.json
yarn.lock
pnpm-lock.yaml

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
.DS_Store

# Build
dist/
build/
out/
coverage/

# Logs
*.log
logs/
npm-debug.log*

# Temp
tmp/
temp/
*.tmp
EOF

# Initialize npm project
npm init -y

# Create initial README
cat > README.md << 'EOF'
# Project Name

## Description
Implementation of GitHub issue #[ISSUE_NUMBER]

## Setup
```bash
npm install
```

## Development
```bash
npm run dev
```

## Testing
```bash
npm test
npm run test:watch
```

## Build
```bash
npm run build
```
EOF

# Initial commit
git add .
git commit -m "chore: initialize project repository"
```

### Step 2: Set Up Development Environment

```bash
# Install TypeScript and essential tools
npm install --save-dev typescript @types/node
npm install --save-dev eslint prettier
npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin

# Initialize TypeScript
npx tsc --init --strict --esModuleInterop --skipLibCheck --forceConsistentCasingInFileNames --outDir dist --rootDir src

# Create source directory
mkdir -p src

# Configure ESLint
cat > .eslintrc.json << 'EOF'
{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "env": {
    "node": true,
    "es2021": true
  },
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-module-boundary-types": "off"
  }
}
EOF

# Configure Prettier
cat > .prettierrc << 'EOF'
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
EOF

# Update package.json scripts
npm pkg set scripts.build="tsc"
npm pkg set scripts.dev="tsc --watch"
npm pkg set scripts.lint="eslint . --ext .ts,.tsx"
npm pkg set scripts.format="prettier --write ."

git add .
git commit -m "chore: configure TypeScript and development tools"
```

### Step 3: Set Up Testing Framework

```bash
# Decide on testing framework based on project type
# For Node.js/React projects:
npm install --save-dev jest @types/jest ts-jest
npm install --save-dev @testing-library/jest-dom

# Initialize Jest configuration
npx ts-jest config:init

# Create Jest setup file
mkdir -p src/__tests__
cat > src/setupTests.ts << 'EOF'
// Add custom jest matchers if needed
import '@testing-library/jest-dom';
EOF

# Update Jest config to include setup
cat > jest.config.js << 'EOF'
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
};
EOF

# Add test scripts
npm pkg set scripts.test="jest"
npm pkg set scripts.test:watch="jest --watch"
npm pkg set scripts.test:coverage="jest --coverage"

# Create first test to verify setup
cat > src/__tests__/setup.test.ts << 'EOF'
describe('Test Environment', () => {
  it('should be properly configured', () => {
    expect(true).toBe(true);
  });
});
EOF

# Run test to verify
npm test

git add .
git commit -m "test: configure Jest testing framework with TypeScript"
git push -u origin main
```

## Analyzing the GitHub Issue

Now, let's gather information about the issue to implement:

```
Use Task tool to simultaneously:
1. Fetch issue details: gh issue view $ISSUE_NUMBER --json title,body,comments,labels,assignees
2. Research best practices for the type of feature described
3. Look up common patterns for similar implementations
4. Find relevant libraries or packages that might help
5. Identify potential edge cases or challenges
```

## Planning the Implementation

Based on the issue requirements, create an implementation plan:

### Step 1: Design the Architecture

```bash
# Create architecture documentation
mkdir -p docs
cat > docs/architecture.md << 'EOF'
# Architecture Decision Records

## Feature: [Feature Name from Issue]

### Context
[Summarize the issue requirements]

### Decision
[Describe your architectural approach]

### Consequences
[List the implications of this approach]
EOF

git add docs/
git commit -m "docs: add architecture decision for issue #$ISSUE_NUMBER"
git push
```

### Step 2: Create Project Structure

Based on your architecture decision, create the necessary directories:

```bash
# Example structure for a typical feature
mkdir -p src/{components,services,utils,types}

# Create type definitions first
cat > src/types/index.ts << 'EOF'
// Type definitions for the feature
export interface FeatureConfig {
  // Add based on issue requirements
}
EOF

git add src/
git commit -m "feat: add initial project structure for issue #$ISSUE_NUMBER"
git push
```

## Implementing with TDD

Follow the TDD cycle for each component:

### Step 1: Write Failing Test

```bash
# Create test file for the feature
cat > src/services/__tests__/feature.test.ts << 'EOF'
import { FeatureService } from '../feature';

describe('FeatureService', () => {
  it('should exist', () => {
    expect(FeatureService).toBeDefined();
  });
  
  it('should implement the basic requirement from issue', () => {
    const service = new FeatureService();
    const result = service.process('input');
    expect(result).toBe('expected output');
  });
});
EOF

# Run test to see it fail
npm test

git add src/services/__tests__/
git commit -m "test: add failing tests for feature service (#$ISSUE_NUMBER)"
git push
```

### Step 2: Implement Minimum Code

```bash
# Create implementation
cat > src/services/feature.ts << 'EOF'
export class FeatureService {
  process(input: string): string {
    // Minimal implementation to pass the test
    return 'expected output';
  }
}
EOF

# Run tests to verify they pass
npm test

git add src/services/
git commit -m "feat: implement basic feature service (#$ISSUE_NUMBER)"
git push
```

### Step 3: Refactor and Expand

```bash
# Add more comprehensive tests
cat >> src/services/__tests__/feature.test.ts << 'EOF'

  describe('edge cases', () => {
    it('should handle empty input', () => {
      const service = new FeatureService();
      expect(() => service.process('')).toThrow('Input cannot be empty');
    });
    
    it('should handle special characters', () => {
      const service = new FeatureService();
      const result = service.process('test@#$');
      expect(result).toBe('sanitized output');
    });
  });
EOF

# Update implementation
# ... implement edge case handling ...

git add .
git commit -m "test: add edge case tests for feature service (#$ISSUE_NUMBER)"
git push
```

## Framework-Specific Setup

If the issue requires a specific framework:

### For React Projects

```bash
# Install React dependencies
npm install react react-dom
npm install --save-dev @types/react @types/react-dom
npm install --save-dev @testing-library/react @testing-library/user-event

# Update Jest config for React
npm install --save-dev jest-environment-jsdom

# Update jest.config.js
echo "testEnvironment: 'jsdom'," >> jest.config.js
```

### For Express/API Projects

```bash
# Install Express dependencies
npm install express
npm install --save-dev @types/express supertest @types/supertest

# Create basic server structure
mkdir -p src/{routes,middleware,controllers}
```

## Integration and Documentation

### Step 1: Create Integration Tests

```bash
# Create integration test
cat > src/__tests__/integration.test.ts << 'EOF'
describe('Feature Integration', () => {
  it('should work end-to-end', async () => {
    // Test the complete flow
  });
});
EOF
```

### Step 2: Update Documentation

```bash
# Update README with feature documentation
cat >> README.md << 'EOF'

## Features

### [Feature Name]
[Description of the implemented feature]

#### Usage
```typescript
// Example usage
```

#### API Reference
[Document the public API]
EOF

git add .
git commit -m "docs: add feature documentation (#$ISSUE_NUMBER)"
git push
```

## Continuous Integration

Set up CI to run tests automatically:

```bash
# Create GitHub Actions workflow
mkdir -p .github/workflows
cat > .github/workflows/test.yml << 'EOF'
name: Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - run: npm ci
    - run: npm run lint
    - run: npm test -- --coverage
    - run: npm run build
EOF

git add .github/
git commit -m "ci: add GitHub Actions workflow for automated testing (#$ISSUE_NUMBER)"
git push
```

## Final Steps

1. **Run Full Test Suite**: `npm test -- --coverage`
2. **Check Code Quality**: `npm run lint`
3. **Build Project**: `npm run build`
4. **Update Issue**: Comment on the issue with implementation details

```bash
# Comment on the issue
gh issue comment $ISSUE_NUMBER --body "Implementation complete! 

## Summary
- Set up project with TypeScript and Jest
- Implemented feature using TDD approach
- Added comprehensive test coverage
- Created documentation

## Test Coverage
[Include coverage report]

## Next Steps
Ready for review!"
```

## Implementation Summary Format

<implementation_summary>
Set up new TypeScript project with Jest testing framework. Implemented feature from issue #X using TDD approach, ensuring each component has test coverage before implementation. Created proper project structure with clear separation of concerns.
</implementation_summary>

<commit_messages>
chore: initialize project repository
chore: configure TypeScript and development tools
test: configure Jest testing framework with TypeScript
docs: add architecture decision for issue #X
feat: add initial project structure for issue #X
test: add failing tests for feature service (#X)
feat: implement basic feature service (#X)
test: add edge case tests for feature service (#X)
feat: handle edge cases in feature service (#X)
docs: add feature documentation (#X)
ci: add GitHub Actions workflow for automated testing (#X)
</commit_messages>
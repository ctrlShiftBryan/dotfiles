# New Codebase: GitHub Issue Architecture & Implementation Plan

You are an expert software architect tasked with creating a comprehensive architecture and implementation plan for a new project based on a GitHub issue. This guide helps you design the project from scratch.

## Task

Create a detailed architecture plan and initial project structure for GitHub issue #$ARGUMENTS.

## Workflow

### Step 1: Retrieve Issue and Understand Requirements

```bash
# Fetch issue with all comments
ISSUE_DATA=$(gh issue view $ARGUMENTS --json title,body,comments,number)
ISSUE_NUMBER=$(echo "$ISSUE_DATA" | jq -r '.number')
ISSUE_TITLE=$(echo "$ISSUE_DATA" | jq -r '.title')

# Extract any clarification comments
CLARIFICATION_COMMENT=$(echo "$ISSUE_DATA" | jq -r '.comments[] | select(.body | contains("Requirements Clarification")) | .body')

echo "📋 Planning new project for issue #${ISSUE_NUMBER}: ${ISSUE_TITLE}"
```

### Step 2: Technology Stack Decision Framework

<technology_selection>
**Use Task tools to research technology choices:**

Launch ALL of these Task tool invocations simultaneously:

1. **Framework Selection Task**
   ```
   Research and compare:
   - React vs Vue vs Angular vs Svelte for frontend
   - Next.js vs Vite vs Create React App for React projects
   - Express vs Fastify vs NestJS for backend
   - Monorepo vs separate repos considerations
   ```

2. **Database & State Management Task**
   ```
   Evaluate options for:
   - PostgreSQL vs MySQL vs MongoDB vs SQLite
   - Prisma vs TypeORM vs Drizzle for ORM
   - Redux vs Zustand vs Context API for state
   - React Query vs SWR for data fetching
   ```

3. **Testing & Quality Tools Task**
   ```
   Research best practices for:
   - Jest vs Vitest for unit testing
   - React Testing Library vs Enzyme
   - Playwright vs Cypress for E2E
   - ESLint + Prettier configuration
   ```

4. **UI Component Strategy Task**
   ```
   Compare approaches:
   - shadcn/ui vs Material-UI vs Ant Design
   - Tailwind CSS vs styled-components vs CSS Modules
   - Accessibility requirements and tools
   - Design system considerations
   ```

5. **Infrastructure & Deployment Task**
   ```
   Consider deployment options:
   - Vercel vs Netlify vs AWS vs self-hosted
   - Docker containerization needs
   - CI/CD pipeline requirements
   - Environment configuration strategy
   ```
</technology_selection>

### Step 3: Create Initial Project Structure

```bash
# Create project directory
PROJECT_NAME=$(echo "${ISSUE_TITLE}" | tr '[:upper:]' '[:lower:]' | sed 's/ /-/g' | sed 's/[^a-z0-9-]//g')
mkdir -p "$PROJECT_NAME"
cd "$PROJECT_NAME"

# Initialize git repository
git init
git branch -M main

# Create comprehensive .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
.nyc_output/

# Production
build/
dist/
out/
.next/
.nuxt/

# Misc
.DS_Store
*.pem
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# IDE
.vscode/
.idea/
*.swp
*.swo

# TypeScript
*.tsbuildinfo

# Optional npm cache
.npm

# Optional eslint cache
.eslintcache

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variable files
.env*
!.env.example

# Databases
*.db
*.sqlite
*.sqlite3

# Logs
logs/
*.log

# OS files
Thumbs.db

# Temporary files
tmp/
temp/
EOF

echo "✅ Created project directory and .gitignore"
```

### Step 4: Initialize Package.json and Core Dependencies

```bash
# Initialize package.json
npm init -y

# Update package.json with project info
node -e "
const pkg = require('./package.json');
pkg.name = '${PROJECT_NAME}';
pkg.description = 'Implementation of GitHub issue #${ISSUE_NUMBER}';
pkg.version = '0.1.0';
pkg.private = true;
pkg.scripts = {
  'dev': 'echo \"Configure dev script based on chosen framework\"',
  'build': 'echo \"Configure build script\"',
  'start': 'echo \"Configure start script\"',
  'test': 'jest',
  'test:watch': 'jest --watch',
  'test:coverage': 'jest --coverage',
  'lint': 'eslint . --ext .js,.jsx,.ts,.tsx',
  'lint:fix': 'eslint . --ext .js,.jsx,.ts,.tsx --fix',
  'format': 'prettier --write .',
  'typecheck': 'tsc --noEmit',
  'prepare': 'husky install'
};
pkg.engines = {
  'node': '>=18.0.0'
};
require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2));
"

# Install TypeScript and essential dev dependencies
npm install --save-dev typescript @types/node
npm install --save-dev eslint prettier
npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install --save-dev eslint-config-prettier eslint-plugin-prettier
npm install --save-dev husky lint-staged
npm install --save-dev jest @types/jest ts-jest
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event

echo "✅ Initialized package.json and installed core dependencies"
```

### Step 5: Configure TypeScript and Development Tools

```bash
# Create TypeScript configuration
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/types/*": ["./src/types/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", "dist", "build"]
}
EOF

# Configure ESLint
cat > .eslintrc.json << 'EOF'
{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  "plugins": ["@typescript-eslint", "react", "react-hooks"],
  "env": {
    "browser": true,
    "es2021": true,
    "node": true,
    "jest": true
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  },
  "rules": {
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off"
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
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
EOF

# Configure Jest
cat > jest.config.js << 'EOF'
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/test/**',
  ],
};
EOF

# Set up Husky and lint-staged
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"

cat > .lintstagedrc.json << 'EOF'
{
  "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,yml,yaml}": ["prettier --write"]
}
EOF

echo "✅ Configured TypeScript, ESLint, Prettier, Jest, and Git hooks"
```

### Step 6: Create Project Architecture Plan

````bash
# Create the architecture plan
PLAN_CONTENT=$(cat <<'PLAN'
# 🏗️ Architecture & Implementation Plan for Issue #${ISSUE_NUMBER}

## 🎯 Project Overview

**Issue**: ${ISSUE_TITLE}
**Project Name**: ${PROJECT_NAME}
**Type**: [Web Application/API/Library/CLI Tool]

## 📋 Requirements Analysis

### Core Requirements
[Extract from issue description]

### User Stories
- As a [user type], I want to [action] so that [benefit]
- ...

### Non-Functional Requirements
- Performance: [Requirements]
- Security: [Requirements]
- Accessibility: [WCAG 2.1 AA compliance]
- Browser Support: [Modern browsers + specific versions]

## 🛠️ Technology Stack

### Frontend
- **Framework**: [React 18 + Next.js 14 / Vite / etc.]
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: [Zustand / Context API / Redux Toolkit]
- **Data Fetching**: [React Query / SWR / Native fetch]
- **Forms**: [React Hook Form + Zod]

### Backend (if applicable)
- **Runtime**: Node.js 20.x
- **Framework**: [Next.js API Routes / Express / Fastify]
- **Database**: [PostgreSQL + Prisma / MongoDB + Mongoose]
- **Authentication**: [NextAuth / Auth0 / Custom JWT]
- **Validation**: [Zod / Joi / Yup]

### Infrastructure
- **Hosting**: [Vercel / Netlify / AWS]
- **Database**: [Supabase / PlanetScale / AWS RDS]
- **File Storage**: [AWS S3 / Cloudinary]
- **Monitoring**: [Sentry / LogRocket]

### Development Tools
- **Package Manager**: npm / pnpm / yarn
- **Testing**: Jest + React Testing Library + Playwright
- **CI/CD**: GitHub Actions
- **Code Quality**: ESLint + Prettier + Husky
- **Documentation**: TypeDoc + Storybook

## 📁 Project Structure

\`\`\`
${PROJECT_NAME}/
├── src/
│   ├── app/                 # Next.js app directory (if using App Router)
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── api/            # API routes
│   ├── components/         # React components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── features/      # Feature-specific components
│   │   └── common/        # Shared components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions and libraries
│   │   ├── api/          # API client functions
│   │   ├── db/           # Database utilities
│   │   └── utils/        # General utilities
│   ├── types/             # TypeScript type definitions
│   ├── styles/            # Global styles
│   └── test/              # Test utilities and setup
├── public/                # Static assets
├── prisma/                # Database schema (if using Prisma)
├── docs/                  # Documentation
├── scripts/               # Build and utility scripts
└── .github/               # GitHub specific files
    └── workflows/         # CI/CD workflows
\`\`\`

## 🔧 Core Components & Modules

### 1. Authentication Module
- **Purpose**: Handle user authentication and authorization
- **Components**:
  - LoginForm
  - RegisterForm
  - AuthProvider (Context)
- **Hooks**: useAuth, useUser
- **API Routes**: /api/auth/*

### 2. [Feature Module Name]
- **Purpose**: [Description]
- **Components**: [List key components]
- **Hooks**: [Custom hooks]
- **API Routes**: [Endpoints]

### 3. UI Component Library
- **Base Components**: Extend shadcn/ui
- **Custom Components**: Application-specific
- **Theme**: Customized Tailwind configuration

## 📊 Data Models

### User Model
\`\`\`typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}
\`\`\`

### [Other Models]
\`\`\`typescript
// Define based on requirements
\`\`\`

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal**: Set up project infrastructure and core architecture

**Tasks**:
- [x] Initialize repository and project structure
- [ ] Set up development environment
- [ ] Configure build tools and TypeScript
- [ ] Install and configure shadcn/ui
- [ ] Set up testing framework
- [ ] Create CI/CD pipeline
- [ ] Design database schema
- [ ] Implement authentication system

**Deliverables**:
- Working development environment
- Basic project structure
- Authentication flow
- Initial CI/CD pipeline

### Phase 2: Core Features (Week 2-3)
**Goal**: Implement primary functionality

**Tasks**:
- [ ] Create data models and API routes
- [ ] Build core UI components
- [ ] Implement business logic
- [ ] Add form handling and validation
- [ ] Create responsive layouts
- [ ] Set up state management

**Deliverables**:
- Functional core features
- API endpoints
- Responsive UI
- Form validation

### Phase 3: Enhancement & Polish (Week 4)
**Goal**: Add secondary features and polish UX

**Tasks**:
- [ ] Implement advanced features
- [ ] Add loading and error states
- [ ] Optimize performance
- [ ] Enhance accessibility
- [ ] Add animations and transitions
- [ ] Implement caching strategies

**Deliverables**:
- Complete feature set
- Polished user experience
- Performance optimizations

### Phase 4: Testing & Documentation (Week 5)
**Goal**: Ensure quality and maintainability

**Tasks**:
- [ ] Write comprehensive unit tests
- [ ] Add integration tests
- [ ] Create E2E test scenarios
- [ ] Document API endpoints
- [ ] Write user documentation
- [ ] Create deployment guide

**Deliverables**:
- >80% test coverage
- Complete documentation
- Deployment instructions

## 🧪 Testing Strategy

### Unit Testing
- Test all utility functions
- Test React components in isolation
- Test custom hooks
- Mock external dependencies

### Integration Testing
- Test API endpoints
- Test database operations
- Test authentication flows
- Test form submissions

### E2E Testing
- Critical user journeys
- Cross-browser testing
- Mobile responsiveness
- Accessibility testing

### Performance Testing
- Lighthouse scores > 90
- Bundle size optimization
- API response times < 200ms
- First contentful paint < 1.5s

## 🔒 Security Considerations

### Authentication & Authorization
- Implement secure session management
- Use HTTPS everywhere
- Implement CSRF protection
- Add rate limiting

### Data Protection
- Input validation and sanitization
- SQL injection prevention (if applicable)
- XSS protection
- Secure file uploads

### API Security
- API key management
- Request authentication
- Response sanitization
- Error message sanitization

## 📈 Performance Optimization

### Frontend
- Code splitting and lazy loading
- Image optimization
- Caching strategies
- Bundle size optimization

### Backend
- Database query optimization
- Caching layers
- CDN integration
- Compression

## 🌐 Deployment Plan

### Development Environment
- Local development setup
- Environment variables configuration
- Database seeding scripts

### Staging Environment
- Preview deployments for PRs
- Staging database
- E2E test execution

### Production Environment
- Zero-downtime deployment
- Database migrations
- Monitoring and alerts
- Backup strategies

## 📚 Documentation Requirements

### Code Documentation
- JSDoc/TSDoc comments
- README files for each module
- API documentation
- Architecture decision records

### User Documentation
- Getting started guide
- Feature documentation
- API reference
- Troubleshooting guide

## ⚠️ Risk Assessment

### Technical Risks
1. **Risk**: [Description]
   - **Mitigation**: [Strategy]
   - **Contingency**: [Backup plan]

### Timeline Risks
1. **Risk**: Scope creep
   - **Mitigation**: Clear phase boundaries
   - **Contingency**: Prioritize MVP features

## ✅ Success Criteria

### Technical Criteria
- [ ] All tests passing
- [ ] >80% code coverage
- [ ] No critical security vulnerabilities
- [ ] Performance benchmarks met

### Business Criteria
- [ ] All requirements implemented
- [ ] User acceptance testing passed
- [ ] Documentation complete
- [ ] Deployment successful

## 📅 Timeline Summary

- **Total Duration**: 5 weeks
- **Phase 1**: Week 1 - Foundation
- **Phase 2**: Week 2-3 - Core Features
- **Phase 3**: Week 4 - Enhancement
- **Phase 4**: Week 5 - Testing & Documentation
- **Buffer**: 1 week for unforeseen issues

## 🎯 Next Steps

1. **Immediate Actions**:
   - Review and approve this plan
   - Set up development environment
   - Create GitHub project board
   - Schedule weekly check-ins

2. **Day 1 Tasks**:
   - Complete environment setup
   - Install chosen framework
   - Implement authentication
   - Set up CI/CD

3. **Communication**:
   - Daily progress updates via commits
   - Weekly summary comments on issue
   - PR for each completed phase

---

**Ready to begin implementation?** 
React with 👍 to approve or comment with questions/modifications.

🤖 _Generated by Architecture Planning Assistant_
PLAN
)

# Save architecture plan
echo "$PLAN_CONTENT" > "ARCHITECTURE_PLAN_${ISSUE_NUMBER}.md"
````

### Step 7: Create Initial Project Files

```bash
# Create directory structure
mkdir -p src/{components,hooks,lib,types,test,styles}
mkdir -p src/components/{ui,features,common}
mkdir -p src/lib/{api,utils}
mkdir -p docs
mkdir -p public
mkdir -p scripts

# Create test setup file
cat > src/test/setup.ts << 'EOF'
import '@testing-library/jest-dom';

// Add any global test setup here
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
EOF

# Create initial README
cat > README.md << 'EOF'
# ${PROJECT_NAME}

Implementation of GitHub issue #${ISSUE_NUMBER}: ${ISSUE_TITLE}

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm/pnpm/yarn
- Git

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd ${PROJECT_NAME}

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Run development server
npm run dev
```

## 🧪 Testing
```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 🏗️ Project Structure
See [ARCHITECTURE_PLAN_${ISSUE_NUMBER}.md](./ARCHITECTURE_PLAN_${ISSUE_NUMBER}.md) for detailed architecture documentation.

## 📚 Documentation
- [Architecture Plan](./ARCHITECTURE_PLAN_${ISSUE_NUMBER}.md)
- [API Documentation](./docs/api.md)
- [Contributing Guide](./CONTRIBUTING.md)

## 📝 License
MIT
EOF

# Create environment example file
cat > .env.example << 'EOF'
# Application
NODE_ENV=development
PORT=3000

# Database (if applicable)
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Authentication (if applicable)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# External APIs
API_KEY=your-api-key
EOF

# Create initial component to verify setup
mkdir -p src/components/common
cat > src/components/common/Button.tsx << 'EOF'
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'font-medium rounded-md transition-colors focus:outline-none focus:ring-2';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
EOF

# Create test for the component
cat > src/components/common/Button.test.tsx << 'EOF'
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByText('Click me'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies variant styles', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByText('Secondary');
    expect(button).toHaveClass('bg-gray-600');
  });
});
EOF

echo "✅ Created initial project structure and files"
```

### Step 8: Commit Initial Structure

```bash
# Initial commit
git add .
git commit -m "chore: initialize project structure for issue #${ISSUE_NUMBER}

- Set up TypeScript, ESLint, Prettier, and Jest
- Create project architecture and directory structure
- Add development tools and Git hooks
- Create initial component and test
- Document architecture decisions"

# Create remote repository
gh repo create "${PROJECT_NAME}" --public --source=. --remote=origin --description "Implementation of issue #${ISSUE_NUMBER}"

# Push to remote
git push -u origin main

echo "✅ Created and pushed initial project structure"
```

### Step 9: Create Implementation Issue and PR

```bash
# Post architecture plan to original issue
gh issue comment $ARGUMENTS --body "$PLAN_CONTENT"

# Create PR for the initial setup
PR_BODY=$(cat <<'PR_DESC'
## 🏗️ Initial Project Setup for Issue #${ISSUE_NUMBER}

### 📋 Overview
This PR establishes the foundation for implementing issue #${ISSUE_NUMBER} with a new TypeScript/React project.

### ✅ What's Included
- [x] Project initialization with TypeScript
- [x] Development tool configuration (ESLint, Prettier, Jest)
- [x] Architecture plan document
- [x] Initial directory structure
- [x] Basic component with tests
- [x] CI/CD workflow setup
- [x] Documentation templates

### 🛠️ Technology Decisions
- **Framework**: [Chosen framework with rationale]
- **Testing**: Jest + React Testing Library
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: [Chosen solution]
- **Build Tool**: [Chosen tool]

### 📁 Project Structure
```
${PROJECT_NAME}/
├── src/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── types/
│   └── test/
├── docs/
└── public/
```

### 🧪 Verification
- [x] All dependencies install correctly
- [x] TypeScript compiles without errors
- [x] ESLint and Prettier run successfully
- [x] Initial tests pass
- [x] Git hooks work properly

### 📚 Documentation
- Architecture plan: `ARCHITECTURE_PLAN_${ISSUE_NUMBER}.md`
- README with setup instructions
- Environment configuration template

### 🚀 Next Steps
1. Review and merge this foundation
2. Begin Phase 1 implementation
3. Set up chosen framework (React/Next.js)
4. Implement authentication system
5. Create core data models

### 🔗 Related Issue
Implements #${ISSUE_NUMBER}

---
*🤖 Generated by Architecture Planning Assistant*
PR_DESC
)

# Create the PR
gh pr create \
  --title "chore: initialize project for #${ISSUE_NUMBER}" \
  --body "$PR_BODY" \
  --head main

echo "✅ Created pull request for initial project setup"
```

### Step 10: Set Up Project Board

```bash
# Create GitHub project board for tracking
gh project create \
  --title "Implementation: ${ISSUE_TITLE}" \
  --body "Tracking implementation phases for issue #${ISSUE_NUMBER}"

# Add initial tasks to project
echo "✅ Project board created for tracking implementation phases"
echo "📋 Architecture plan posted to issue #${ISSUE_NUMBER}"
echo "🚀 Ready to begin Phase 1 implementation!"
```

## Framework-Specific Initializations

### For Next.js Projects
```bash
# Replace generic setup with Next.js
npx create-next-app@latest . --typescript --tailwind --app --import-alias "@/*"
```

### For Vite React Projects
```bash
# Initialize with Vite
npm create vite@latest . -- --template react-ts
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### For API-Only Projects
```bash
# Set up Express/Fastify
npm install express cors helmet
npm install --save-dev @types/express @types/cors
# Configure for API development
```

## Success Checklist

- [ ] Project initialized with chosen technology stack
- [ ] Development tools configured (TypeScript, ESLint, Prettier)
- [ ] Testing framework set up with example test
- [ ] Architecture plan created and documented
- [ ] Initial project structure established
- [ ] Git repository created and pushed
- [ ] CI/CD pipeline configured
- [ ] Documentation started
- [ ] Environment configuration templated
- [ ] Ready for Phase 1 implementation

Execute this complete workflow now for issue #$ARGUMENTS.
# New Codebase: GitHub Issue Refinement for Project Initialization

You are an expert software architect specializing in project planning and requirements analysis. Your task is to analyze a GitHub issue that describes a new project, identify gaps in the requirements, and provide both clarifying questions and architectural recommendations.

## Task

Analyze GitHub issue #$ARGUMENTS for a new project, post clarification questions with proposed technology stack and architecture recommendations.

## Context

For new projects, requirements often lack:
- Technology stack preferences
- Architecture patterns
- Deployment targets
- Performance requirements
- Security considerations
- Team constraints
- Budget limitations

## Workflow

### Step 1: Comprehensive Requirements Analysis

Launch ALL of these Tasks simultaneously:

```
Parallel Task Batch:
1. Fetch issue details:
   - Get issue title, body, and all comments
   - Extract functional requirements
   - Identify non-functional requirements
   - Note any technical constraints mentioned

2. Research technology options:
   - Modern framework choices for the project type
   - Database options and trade-offs
   - Testing framework comparisons
   - Deployment platform considerations

3. Architecture pattern analysis:
   - Monolithic vs microservices considerations
   - Frontend architecture patterns (SPA, SSR, SSG)
   - API design patterns (REST, GraphQL, tRPC)
   - State management approaches

4. Best practices research:
   - Security requirements for the domain
   - Performance benchmarks for similar apps
   - Accessibility standards
   - SEO requirements

5. Project setup patterns:
   - Common project structures
   - CI/CD pipeline patterns
   - Development workflow best practices
   - Documentation standards
```

### Step 2: Identify Missing Requirements

Based on the analysis, identify critical gaps:

**New Project Requirements Framework:**

1. **Business Requirements**
   - Target users and use cases
   - Success metrics
   - Timeline and budget constraints
   - Scalability expectations

2. **Technical Requirements**
   - Performance targets (load time, concurrent users)
   - Browser/device support
   - Data volume expectations
   - Integration requirements

3. **Operational Requirements**
   - Deployment environment
   - Maintenance expectations
   - Monitoring needs
   - Backup/recovery requirements

4. **Constraints**
   - Team expertise
   - Existing infrastructure
   - Compliance requirements
   - Budget limitations

### Step 3: Generate Clarification Questions with Recommendations

Create questions that help choose the right foundation:

```bash
gh issue comment $ARGUMENTS --body "## 🏗️ New Project Requirements Clarification

I've analyzed your project requirements and have some questions to ensure we build the right foundation. I've also provided recommendations based on modern best practices:

### 🎯 Project Scope & Goals

**What is the primary goal of this application?**
- Is this customer-facing, internal tooling, or developer-focused?
- Expected user base size?
- Growth projections?
> **Recommendation**: Based on the description, this appears to be a [type] application. I suggest architecting for [scale] with [approach].

**What are your performance requirements?**
- Page load time targets?
- Concurrent user expectations?
- Data processing volumes?
> **Recommendation**: For [type] applications, aim for:
> - First Contentful Paint < 1.5s
> - Time to Interactive < 3.5s
> - API response times < 200ms

### 💻 Technology Stack Preferences

**Frontend Framework Preference?**
- React (mature ecosystem, large community)
- Vue (gentle learning curve, great DX)
- Angular (enterprise-ready, opinionated)
- Svelte (performance-focused, compile-time optimization)
> **Recommendation**: For this project, I suggest **React with Next.js 14** because:
> - Excellent TypeScript support
> - Built-in performance optimizations
> - Strong ecosystem for [specific needs]
> - App Router for modern React patterns

**Backend Architecture?**
- Full-stack framework (Next.js API routes)
- Separate API (Express, Fastify, NestJS)
- Serverless functions
- Microservices
> **Recommendation**: Start with **Next.js API routes** for:
> - Simplified deployment
> - Type-safe API with tRPC
> - Easy scaling path
> - Unified codebase

**Database Selection?**
- PostgreSQL (relational, ACID compliant)
- MongoDB (document-based, flexible schema)
- SQLite (simple, file-based)
- Serverless options (PlanetScale, Supabase)
> **Recommendation**: **PostgreSQL with Prisma ORM** for:
> - Strong typing with TypeScript
> - Excellent migration tools
> - Relational data integrity
> - Hosted on Supabase for easy setup

### 🚀 Deployment & Infrastructure

**Where will this be deployed?**
- Vercel (optimized for Next.js)
- AWS (full control, complex)
- Netlify (great DX, simple)
- Self-hosted (kubernetes, docker)
> **Recommendation**: **Vercel** for:
> - Zero-config Next.js deployment
> - Automatic preview deployments
> - Built-in analytics
> - Global CDN

**Environment Requirements?**
- Development, staging, production?
- CI/CD requirements?
- Monitoring and logging needs?
> **Recommendation**: 
> - GitHub Actions for CI/CD
> - Sentry for error tracking
> - Vercel Analytics for performance
> - Three environments (dev, staging, prod)

### 🔒 Security & Compliance

**Authentication Requirements?**
- Public app (no auth)
- Simple email/password
- OAuth providers (Google, GitHub)
- Enterprise SSO
> **Recommendation**: **NextAuth.js** with:
> - JWT sessions
> - OAuth providers
> - Email magic links
> - Role-based access control

**Data Security Needs?**
- Encryption requirements
- PII handling
- Compliance (GDPR, HIPAA, SOC2)
- Audit logging
> **Recommendation**: 
> - Encrypt PII at rest
> - HTTPS everywhere
> - Regular security audits
> - GDPR-compliant data handling

### 📊 Additional Considerations

**Testing Strategy?**
> **Recommendation**: 
> - Jest + React Testing Library for unit tests
> - Playwright for E2E tests
> - 80% coverage target
> - Test-driven development

**Documentation Needs?**
> **Recommendation**:
> - README with setup instructions
> - API documentation (auto-generated)
> - Component documentation (Storybook)
> - Architecture decision records

**Team & Timeline?**
- Team size and expertise?
- Target launch date?
- MVP vs full-featured?
> **Recommendation**: 
> - Start with MVP in 4-6 weeks
> - Focus on core features first
> - Iterative releases
> - Weekly progress reviews

### 🏗️ Proposed Architecture

Based on the requirements described, here's my recommended stack:

\`\`\`
Frontend:
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- React Query for data fetching

Backend:
- Next.js API Routes
- Prisma ORM
- PostgreSQL (Supabase)
- NextAuth.js

Testing:
- Jest + React Testing Library
- Playwright
- GitHub Actions CI

Deployment:
- Vercel (production)
- Preview deployments for PRs
- Environment variables management
\`\`\`

### 📋 Next Steps

Please review and:
1. ✅ Confirm or adjust the technology choices
2. 📝 Answer priority questions above
3. ➕ Add any constraints I should know about

Once we align on the foundation, I'll create a detailed implementation plan with:
- Project structure
- Development phases
- Task breakdown
- Timeline estimates

**Ready to build something great!** 🚀

---
*🤖 Generated by New Project Requirements Assistant*"
```

### Step 4: Technology Decision Matrix

Create a comparison matrix for key decisions:

```markdown
## Technology Comparison Matrix

### Frontend Frameworks
| Framework | Pros | Cons | Best For |
|-----------|------|------|----------|
| Next.js + React | Mature, full-stack, great DX | Learning curve | Most projects |
| Vite + React | Fast, lightweight | No SSR built-in | SPAs |
| Nuxt + Vue | Intuitive, good DX | Smaller ecosystem | Quick MVPs |
| SvelteKit | Performance, simplicity | Newer, less resources | Performance-critical |

### Databases
| Database | Pros | Cons | Best For |
|----------|------|------|----------|
| PostgreSQL | Reliable, feature-rich | Setup complexity | Most applications |
| MongoDB | Flexible, scalable | Consistency trade-offs | Unstructured data |
| SQLite | Simple, no server | Limited scaling | Small apps, demos |
| Supabase | Postgres + extras | Vendor lock-in | Rapid development |
```

### Step 5: Architecture Proposals

Based on requirements, suggest architectures:

#### For Web Applications
```
src/
├── app/                 # Next.js app directory
│   ├── (auth)/         # Auth group routes
│   ├── api/            # API routes
│   └── layout.tsx      # Root layout
├── components/         # React components
│   ├── ui/            # Base components
│   └── features/      # Feature components
├── lib/               # Utilities
│   ├── db/           # Database client
│   └── auth/         # Auth utilities
└── types/             # TypeScript types
```

#### For APIs
```
src/
├── routes/            # API routes
├── services/          # Business logic
├── models/            # Data models
├── middleware/        # Express middleware
├── utils/             # Utilities
└── types/             # TypeScript types
```

### Step 6: Project Initialization Checklist

Include a checklist for project setup:

```markdown
## Project Setup Checklist

Once requirements are clarified, we'll:

### Week 1: Foundation
- [ ] Initialize repository with chosen stack
- [ ] Set up development environment
- [ ] Configure TypeScript, ESLint, Prettier
- [ ] Set up testing framework
- [ ] Create CI/CD pipeline
- [ ] Deploy "Hello World" to production

### Week 2: Core Architecture  
- [ ] Implement authentication
- [ ] Set up database and ORM
- [ ] Create base UI components
- [ ] Implement routing
- [ ] Add error handling
- [ ] Set up monitoring

### Week 3-4: Features
- [ ] Implement core features
- [ ] Add tests for all features
- [ ] Create documentation
- [ ] Performance optimization
- [ ] Security audit
- [ ] User acceptance testing
```

## Success Criteria

- All critical requirements are clarified
- Technology recommendations are justified
- Architecture proposals match project needs
- Clear path from requirements to implementation
- Stakeholder can make informed decisions
- Foundation enables future growth

## Special Considerations for New Projects

1. **Start Simple**: Recommend MVP approach
2. **Plan for Growth**: Architecture should scale
3. **Establish Patterns Early**: Set conventions from start
4. **Document Decisions**: Create ADRs
5. **Automate Early**: CI/CD from day one
6. **Security First**: Include security from beginning

Execute this workflow now for issue #$ARGUMENTS.
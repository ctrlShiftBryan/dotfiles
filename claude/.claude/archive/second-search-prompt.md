# Second Search Prompt: Finding Initialization Opportunities

## Purpose
This prompt guides the second search phase for transforming existing codebase prompts into "new codebase" variations. While the first search identifies phrases to remove/replace, this second search identifies opportunities to add initialization-specific guidance.

## Search Objectives

### 1. Find Missing Setup Instructions
Search for sections that assume pre-existing setup without providing initialization guidance.

**Search patterns:**
- `"test"` or `"testing"` without setup instructions
- `"configuration"` or `"config"` references
- `"structure"` or `"architecture"` mentions
- `"convention"` or `"pattern"` usage
- `"integrate"` or `"integration"` points

**What to look for:**
- Places that reference tests but don't explain test framework setup
- Mentions of config files without creation instructions
- Architecture discussions without scaffolding steps
- Pattern references without establishment guidance

### 2. Identify Workflow Assumptions
Find workflow steps that skip initialization prerequisites.

**Search patterns:**
- `"npm"` or `"yarn"` commands without setup
- `"git"` operations without repo initialization
- `"CI"` or `"pipeline"` without setup
- `"lint"` or `"format"` without tool installation
- `"build"` or `"compile"` without configuration

**What to look for:**
- Package manager commands without package.json creation
- Git workflows without initial repository setup
- CI/CD references without pipeline creation
- Tool usage without installation/configuration steps

### 3. Locate Technology Stack Gaps
Find areas where technology choices are assumed rather than decided.

**Search patterns:**
- Framework names: `"React"`, `"Vue"`, `"Next"`, `"TypeScript"`
- Tool names: `"Jest"`, `"Vitest"`, `"ESLint"`, `"Prettier"`
- Library references: `"shadcn"`, `"Tailwind"`, specific packages
- Build tools: `"webpack"`, `"vite"`, `"rollup"`

**What to look for:**
- Direct technology references without selection rationale
- Tool usage without installation instructions
- Framework patterns without setup guidance
- Missing technology evaluation steps

### 4. Find Documentation Gaps
Identify where initial documentation needs aren't addressed.

**Search patterns:**
- `"README"` references
- `"documentation"` mentions
- `"comment"` or `"comments"`
- `"API"` without documentation
- `"usage"` without examples

**What to look for:**
- Missing README.md creation steps
- Lack of initial documentation templates
- No API documentation setup
- Missing code documentation standards

### 5. Discover Security/Best Practice Oversights
Find areas lacking initial security and best practice setup.

**Search patterns:**
- `"security"` mentions
- `"environment"` or `"env"` usage
- `"secret"` or `"credential"` references
- `"dependency"` or `"dependencies"`
- `"performance"` considerations

**What to look for:**
- Environment variable setup missing
- No .gitignore creation
- Missing security configuration
- Lack of dependency management setup
- No performance baseline establishment

## Implementation Guide

### For each search result, determine:

1. **Initialization Need**: What setup step is missing?
2. **Placement**: Where should the initialization guidance go?
3. **Dependencies**: What must be set up first?
4. **Best Practices**: What modern standards apply?

### Transform findings into:

1. **Setup Sections**: Add dedicated initialization steps
2. **Decision Points**: Create technology selection guides
3. **Scaffolding Steps**: Include structure creation commands
4. **Configuration Templates**: Provide starter configurations
5. **Validation Checks**: Add setup verification steps

## Example Transformations

### Before (existing codebase):
```markdown
Run the tests to ensure nothing is broken:
\`\`\`bash
npm test
\`\`\`
```

### After (new codebase):
```markdown
Set up and run initial tests:
\`\`\`bash
# Install testing framework
npm install --save-dev jest @types/jest ts-jest

# Create Jest configuration
npx ts-jest config:init

# Create test directory structure
mkdir -p src/__tests__

# Create first test file
cat > src/__tests__/setup.test.ts << 'EOF'
describe('Project Setup', () => {
  it('should have proper TypeScript configuration', () => {
    expect(true).toBe(true);
  });
});
EOF

# Run tests
npm test
\`\`\`
```

## Search Execution Strategy

1. **Broad Search First**: Use general patterns to identify sections
2. **Context Analysis**: Review surrounding content for assumptions
3. **Gap Identification**: Note what's missing for new projects
4. **Priority Assessment**: Mark critical vs nice-to-have additions
5. **Implementation Planning**: Order additions by dependency

## Output Format

For each finding, document:
- **File**: Which prompt file
- **Section**: Where in the file
- **Missing Element**: What initialization step is needed
- **Suggested Addition**: Specific content to add
- **Priority**: High/Medium/Low
- **Dependencies**: What must be added first
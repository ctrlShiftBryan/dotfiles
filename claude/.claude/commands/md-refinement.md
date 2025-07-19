# Markdown File Refinement Prompt

You are an expert software engineer specializing in requirements analysis. Your task is to analyze a markdown file and provide clarifying questions to help refine vague or incomplete requirements, while also providing proposed answers based on codebase analysis.

## Task

Analyze markdown file at path prompt.md, generate targeted clarification questions, and provide proposed answers based on codebase analysis.

## Task Tool Usage Guidelines

IMPORTANT: Use the Task tool for ALL analysis work. Execute multiple Tasks in parallel for comprehensive codebase understanding.

## Workflow

### Step 1: Comprehensive Parallel Analysis

Launch ALL of these Tasks simultaneously in a single message:

```
Parallel Task Batch:
1. Read and analyze markdown file:
   - Extract key requirements and goals
   - Identify mentioned components or features
   - Note any technical specifications
   - Look for user stories or acceptance criteria

2. Analyze existing patterns:
   - Search for similar features in codebase
   - Find related components and their implementation
   - Identify established conventions
   - Look for relevant configuration

3. Technical context discovery:
   - Find architecture patterns used
   - Search for API/interface conventions
   - Identify data models and schemas
   - Look for testing patterns

4. Requirements gap analysis:
   - Search for edge case handling patterns
   - Find error handling conventions
   - Look for security considerations
   - Check performance patterns

5. Documentation search:
   - Find related documentation
   - Search for ADRs or design docs
   - Look for inline code comments
   - Check README files
```

This parallel approach provides comprehensive context in ~30 seconds instead of sequential analysis taking 5+ minutes.

### Step 2: Analyze for Ambiguities

Based on the Task results, examine the markdown content and identify areas needing clarification:

**Requirements Analysis Framework:**

- **Problem Definition**: Is the user problem clearly stated with specific scenarios?
- **Success Criteria**: Are measurable outcomes and acceptance criteria defined?
- **Technical Scope**: What systems/components are involved? Any constraints?
- **Implementation Details**: Are there specific technical requirements or preferences?
- **Edge Cases**: What error scenarios or boundary conditions need consideration?
- **Timeline/Priority**: Are there deadlines or priority constraints?

**Focus on identifying:**

- Vague or ambiguous statements
- Missing technical specifications
- Unclear user workflows
- Undefined business logic
- Missing error handling requirements
- Unstated assumptions

### Step 3: Generate Clarification Questions

Create structured questions organized by priority:

- **Critical**: Questions that block development
- **Important**: Questions that affect design & architecture
- **Clarifying**: Questions that improve quality

### Step 4: Analyze Codebase with Task Tool

Use Task tool to analyze the codebase and attempt to answer each question:

```
Launch a Task to perform deep codebase analysis:

# For each question generated, analyze:
# 1. Existing code patterns and conventions
# 2. Current architecture and design decisions
# 3. Similar implementations in the codebase
# 4. Configuration files and documentation
# 5. Test files that might reveal expected behavior

# Generate proposed answers based on:
# - Consistency with existing codebase patterns
# - Best practices observed in the project
# - Technical constraints discovered
# - Inferred design intentions

The Task should execute bash commands like:
- grep -r "pattern" --include="*.ts" --include="*.tsx" . | head -10
- find . -name "*.test.*" -o -name "*.spec.*"
- cat specific/config/files.json
- ls -la src/components/similar-feature/
```

For each question, provide a proposed answer based on:
- Existing codebase patterns found by Task analysis
- Best practices observed in similar features
- Technical constraints discovered
- Established conventions and standards

### Step 5: Create Analysis Document

Create a markdown file with the questions and proposed answers:

```bash
# Get input file name for output naming
INPUT_FILE="$ARGUMENTS"
BASE_NAME=$(basename "$INPUT_FILE" .md)
OUTPUT_FILE="${BASE_NAME}-clarification.md"

# Create the markdown file
cat > "$OUTPUT_FILE" << 'EOF'
# Requirements Clarification - [INPUT_FILE_NAME]

## 🔍 Requirements Clarification

I've analyzed the requirements document and need clarification on several points to ensure accurate implementation. Based on codebase analysis, I've also provided proposed answers for your confirmation:

### 🚨 Critical (Must Answer Before Implementation)

**[Question 1]**
- [Context about why this matters]
- [Options or examples if applicable]
> **Proposed Answer**: Based on analysis of [specific files/patterns], I suggest [proposed approach] because [reasoning from codebase]

**[Question 2]**
- [Context]
> **Proposed Answer**: The codebase shows [observation], so I recommend [suggestion]

### ⚠️ Important (Affects Design & Architecture)

**[Question 3]**
- [Context]
> **Proposed Answer**: Looking at similar implementations in [file/module], the pattern suggests [answer]

### 💭 Clarifying (Improves Quality)

**[Question 4]**
- [Context]
> **Proposed Answer**: The existing error handling in [component] indicates we should [suggestion]

---
**📝 Please review the proposed answers above and:**
- ✅ Confirm if they align with your intentions
- ✏️ Correct any misunderstandings
- ➕ Add any additional context I might have missed

**Why these questions matter**: Clear requirements prevent rework and ensure the solution meets your needs.

**Next step**: Please confirm or adjust the proposed answers so I can proceed with implementation planning.

🤖 *Generated by Requirements Analysis Assistant with Codebase Intelligence*
EOF

# Replace placeholder with actual filename
sed -i.bak "s/\[INPUT_FILE_NAME\]/$INPUT_FILE/g" "$OUTPUT_FILE"
rm "${OUTPUT_FILE}.bak"

echo "Created clarification document: $OUTPUT_FILE"
```

## Question Format Guidelines

Structure each question with:

1. **Clear question** - Specific and actionable
2. **Context** - Why this matters for implementation
3. **Examples/Options** - Concrete choices when helpful
4. **Impact** - How the answer affects the technical approach
5. **Proposed Answer** - Prefixed with `>`, based on codebase analysis

**Example Question Format:**

```
**User Authentication Method**
- Should this use OAuth2, JWT tokens, or session-based authentication?
- **Why**: This determines the security architecture and affects all API endpoints
- **Options**: OAuth2 (more secure, requires redirect), JWT (simpler, needs key management), Sessions (traditional, server state)
- **Impact**: Affects database schema, API design, and frontend integration
> **Proposed Answer**: Based on existing auth middleware in `/src/auth/`, the project uses JWT tokens with refresh token rotation. I suggest continuing this pattern for consistency. The `AuthService` class already supports this approach.
```

## Codebase Analysis Guidelines

When using the Task tool results to propose answers:

1. **Look for patterns** - Use findings from Task analysis to identify conventions
2. **Check similar features** - Reference comparable implementations found by Tasks
3. **Review tests** - Leverage test file analysis from parallel Tasks
4. **Examine configuration** - Use config findings from Task searches
5. **Read documentation** - Incorporate documentation discovered by Tasks
6. **Consider consistency** - Ensure proposals align with patterns found in codebase

## Execution Instructions

1. **Launch parallel Tasks** - Execute all 5 Task batches simultaneously for comprehensive analysis
2. **Analyze Task results** - Review findings to understand requirements context and codebase patterns
3. **Identify gaps** - Look for missing technical details, unclear requirements, ambiguous user stories
4. **Generate questions** - Create specific, actionable questions with proposed answers from Task findings
5. **Create output document** - Generate markdown file with structured questions and proposed answers
6. **Confirm creation** - Verify the clarification file was created successfully

## Success Criteria

- Questions are specific and actionable
- Each question explains why the answer matters
- Proposed answers are based on actual codebase analysis
- Answers reference specific files or patterns when possible
- Questions and answers are prioritized by implementation impact
- Output document is well-formatted and professional
- All major ambiguities are addressed
- User can easily confirm or correct proposed answers

Execute this workflow now for markdown file at path $ARGUMENTS.

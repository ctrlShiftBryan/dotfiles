# New Codebase Prompt Update Plan

This document outlines the plan for creating "new" variations of existing prompts, optimized for initializing brand new codebases rather than working with existing repositories.

## Overview

All existing prompts assume an established codebase with existing patterns, tests, and architecture. The "new" variations will focus on:
- Creating initial architecture and patterns
- Establishing conventions from scratch
- Proposing best practices rather than discovering them
- Building foundation rather than modifying existing code

## Prompt Update Details

### 1. commit-push.md → commit-new-push.md

**Priority**: Medium

**Key Changes**:
- Replace "review the current git diff" with "review your initial implementation"
- Change "bug fixes, refactoring" references to "initial features, setup, configuration"
- Update commit types to focus on initialization:
  - `init`: Initial project setup
  - `scaffold`: Creating project structure
  - `config`: Configuration setup
- Add guidance for meaningful first commits (not just "initial commit")
- Include best practices for structuring initial commit history

**Sections to Modify**:
- Step 1: Change from reviewing diffs to reviewing initial files created
- Step 2: Focus on logical grouping of initialization tasks
- Step 3: Emphasize creating a clean initial commit history

### 2. gh-issue-implement.md → gh-new-issue-implement.md

**Priority**: High

**Key Changes**:
- Remove all "search for existing" instructions
- Replace with "create initial" patterns
- Transform test discovery into test structure creation
- Change from "analyzing codebase structure" to "establishing codebase structure"

**Sections to Replace**:
- "Search for existing test files" → "Create initial test structure"
- "Identify testing patterns" → "Establish testing conventions"
- "Find similar implementations" → "Research best practices for this feature"
- Add scaffolding steps for creating initial directory structure
- Include technology selection guidance

**New Sections to Add**:
- Initial project setup checklist
- Directory structure creation
- Testing framework setup
- Linting and formatting configuration

### 3. gh-create-plan.md → gh-new-create-plan.md

**Priority**: High (Most extensive changes needed)

**Key Changes**:
- Complete replacement of "Codebase Analysis Framework" with "Architecture Planning Framework"
- Transform all analysis steps into decision-making steps
- Replace pattern discovery with pattern establishment

**Major Section Replacements**:

**Old: Codebase Analysis Framework**
→ **New: Architecture Planning Framework**
- Technology stack selection
- Project structure decisions
- State management approach
- API design patterns
- Testing strategy selection
- Build tooling choices

**Specific Transformations**:
- "Find similar functionality" → "Research best practices for this functionality"
- "Check for shadcn components" → "Evaluate UI component library options"
- "Review testing setup" → "Design testing architecture"
- "Integration points" → "API and interface design"

**New Sections**:
- Technology evaluation matrix
- Architecture decision records (ADRs)
- Initial dependency selection
- Development environment setup
- CI/CD pipeline design

### 4. gh-code-review.md → gh-new-code-review.md

**Priority**: High

**Key Changes**:
- Shift focus from reviewing changes to reviewing initial implementation
- Replace diff-based review with holistic architecture review
- Emphasize foundation quality over change quality

**Section Modifications**:
- "Get the diff for review" → "Review the initial implementation"
- Architecture review focuses on initial design decisions
- Add sections for:
  - Project structure appropriateness
  - Technology choices validation
  - Scalability considerations
  - Initial security setup
  - Development workflow establishment

**New Review Categories**:
- Foundation Quality (is this a solid base?)
- Extensibility (can this grow with requirements?)
- Developer Experience (is it easy to work with?)
- Best Practices Adherence
- Missing Essential Setup

### 5. gh-address-feedback.md → gh-new-address-feedback.md

**Priority**: Medium

**Key Changes**:
- Focus on addressing feedback on initial implementation
- Replace "fixing existing code" with "refining initial setup"
- Transform test updates to initial test creation

**Modifications**:
- "Understand existing test coverage" → "Establish comprehensive test coverage"
- Add guidance for common initial project feedback:
  - Missing configuration files
  - Incomplete documentation
  - Security setup oversights
  - Development environment issues
  - CI/CD pipeline gaps

### 6. gh-refinement.md → gh-new-refinement.md

**Priority**: Low (Least changes needed)

**Key Changes**:
- Replace "Analyze Codebase with UltraThink" with "Research Best Practices with UltraThink"
- Transform codebase analysis into industry standard research
- Focus questions on approach rather than implementation

**Section Updates**:
- "Existing code patterns" → "Industry standard patterns"
- "Similar implementations in codebase" → "Common implementation approaches"
- "Based on analysis of files" → "Based on best practices research"
- Add questions about:
  - Technology selection rationale
  - Architecture approach validation
  - Long-term maintainability
  - Team scalability

## Implementation Strategy

1. **Phase 1**: Create high-priority prompts first
   - gh-new-create-plan.md
   - gh-new-issue-implement.md
   - gh-new-code-review.md

2. **Phase 2**: Create medium-priority prompts
   - commit-new-push.md
   - gh-new-address-feedback.md

3. **Phase 3**: Create low-priority prompt
   - gh-new-refinement.md

## Common Patterns Across All New Prompts

### Replace Throughout:
- "existing codebase" → "new project"
- "follow existing patterns" → "establish patterns"
- "analyze current" → "design initial"
- "find similar" → "research best practices"
- "maintain consistency" → "establish consistency"

### Add to All Prompts:
- Initial setup verification steps
- Best practices research using Task tool
- Documentation creation emphasis
- Configuration file generation
- Development environment setup validation

## Success Criteria

Each new prompt should:
1. Work from a completely empty repository
2. Guide creation of initial structure and patterns
3. Establish rather than follow conventions
4. Include modern best practices
5. Create foundation for future development
6. Be opinionated about initial choices while explaining rationale

## Next Steps

1. Create each new prompt file following this plan
2. Test with sample new project scenarios
3. Refine based on actual usage
4. Update CLAUDE.md to reference both sets of prompts
5. Create a decision guide for when to use "new" vs regular prompts
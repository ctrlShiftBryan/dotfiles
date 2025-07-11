# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is the Claude Commands repository located at `~/.claude/commands/`. It contains markdown templates that serve as sophisticated prompts for automating GitHub-based development workflows. Each `.md` file represents a different workflow command designed to maintain high code quality and systematic development practices.

### Command Variants

Many commands have two versions:
- **Existing Codebase**: Standard commands for working with established projects
- **New Codebase**: `new-codebase-*.md` variants for starting projects from scratch

Choose the appropriate variant based on your project state:
- Use standard commands when joining or contributing to existing projects
- Use new-codebase commands when initializing projects from GitHub issues

## Common Commands

### Git Operations
```bash
# Check repository status
git status

# View changes
git diff                    # Unstaged changes
git diff --staged          # Staged changes

# Commit workflow (always use conventional commits)
git add <files>
git commit -m "type: description"
git push                   # Push immediately after each commit

# View commit history
git log --oneline -n 10
```

### GitHub CLI Operations
```bash
# Authentication check
gh auth status

# Issue operations
gh issue view <number> --json title,body,comments
gh issue comment <number> --body "comment"

# Pull request operations
gh pr create --title "title" --body "body"
gh pr view <number> --json title,body,reviews,comments
gh pr diff <number>
gh pr review <number> --body "review" --approve|--request-changes|--comment

# If authentication fails with GITHUB_TOKEN error
unset GITHUB_TOKEN && gh <command>
```

### Development Tools
```bash
# Search codebase (prefer ripgrep)
rg "pattern" --type ts --type tsx
grep -r "pattern" --include="*.ts" --include="*.tsx"

# Run tests (check package.json for exact commands)
npm test
npm run test:watch
npm run test:coverage

# Code quality
npm run lint
npm run typecheck
```

## Key Workflows

### 1. Commit and Push

#### Existing Codebase (`commit-push.md`)
- Review all changes with `git diff`
- Create atomic, logical commits
- Use conventional commit format
- Push immediately after each commit
- Never mix unrelated changes

#### New Codebase (`new-codebase-commit-push.md`)
- Initialize Git repository and .gitignore
- Set up package.json and dependencies
- Configure development tools (TypeScript, ESLint, Prettier)
- Create initial project structure
- Make first commits with proper structure

### 2. Issue Implementation

#### Existing Codebase (`gh-issue-implement.md`)
1. Fetch issue: `gh issue view <number> --json title,body,comments`
2. Use Task tool for research
3. Follow TDD approach:
   - Write failing test
   - Implement minimal solution
   - Refactor if needed
   - Commit and push
4. Reference issue in commits: `feat: implement feature (#123)`

#### New Codebase (`new-codebase-gh-issue-implement.md`)
1. Initialize project repository
2. Set up development environment
3. Choose and configure testing framework
4. Implement feature using TDD from scratch
5. Establish CI/CD pipeline
6. Create documentation structure

### 3. Create Implementation Plan

#### Existing Codebase (`gh-create-plan.md`)
1. Analyze codebase systematically
2. Create detailed plan with:
   - Requirements summary
   - Technical architecture
   - Phased implementation
   - Testing strategy
3. Save plan as markdown file
4. Create PR with plan
5. Post plan as GitHub comment

#### New Codebase (`new-codebase-gh-create-plan.md`)
1. Create architecture from requirements
2. Evaluate and choose technology stack
3. Design project structure
4. Plan implementation phases
5. Set up initial project scaffold
6. Document architecture decisions

### 4. Code Review

#### Existing Codebase (`gh-code-review.md`)
- Comprehensive checklist review
- Categorize feedback: Critical, Important, Suggestions
- Add inline comments
- Submit structured review
- Create review summary file

#### New Codebase (`new-codebase-gh-code-review.md`)
- Review initial architecture decisions
- Establish code quality standards
- Verify development environment setup
- Check security foundations
- Assess testing strategy
- Create follow-up issues for improvements

### 5. Address PR Feedback

#### Existing Codebase (`gh-address-feedback.md`)
- Fetch all feedback comments
- Break into manageable steps
- Use TDD for each fix
- Link commits to feedback
- Post completion summary

#### New Codebase (`new-codebase-gh-address-feedback.md`)
- Address architecture feedback
- Establish patterns from review
- Implement security foundations
- Set up quality standards
- Create documentation from feedback
- Establish team conventions

## Conventional Commit Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding missing tests
- `chore`: Maintenance tasks
- `perf`: Performance improvement

## Architecture Patterns

### TypeScript/React Focus
- Strict type safety (avoid `any`)
- React hooks best practices
- Component composition patterns
- Performance optimization (memoization, lazy loading)
- shadcn/ui component integration

### Testing Strategy
- Jest/Vitest for unit tests
- React Testing Library for components
- Test-first development (TDD)
- Each feature must have test coverage
- Run tests before committing

### Code Quality Standards
- Each commit must leave codebase working
- Security considerations in all changes
- Performance impact assessment
- Accessibility requirements for UI
- Comprehensive error handling

## Development Best Practices

### For Existing Codebases
1. **Research First**: Use Task tool for exploring codebase
2. **Small Steps**: Break work into manageable chunks
3. **Test Driven**: Write tests before implementation
4. **Continuous Integration**: Push after each commit
5. **Clear Communication**: Use conventional commits and link to issues
6. **Thorough Reviews**: Follow comprehensive review checklist

### For New Codebases
1. **Architecture First**: Design before implementing
2. **Foundation Quality**: Set up tools and standards early
3. **Documentation Driven**: Document decisions as you make them
4. **Security by Default**: Include security from the start
5. **Testing Infrastructure**: Establish testing patterns early
6. **Team Enablement**: Create onboarding documentation

## Project-Specific Notes

- This is a command template repository, not a traditional codebase
- Each `.md` file is a standalone workflow template
- Templates emphasize quality, consistency, and systematic approaches
- Heavy integration with GitHub CLI for all GitHub operations
- Focus on maintaining remote visibility through frequent pushes

## Quick Reference

When working with these commands:
1. Choose appropriate template for the task:
   - Standard commands for existing projects
   - `new-codebase-*` commands for new projects
2. Follow the template instructions precisely
3. Maintain the established patterns and conventions
4. Use GitHub CLI for all GitHub interactions
5. Commit and push frequently to maintain visibility

### Command Selection Guide

| Scenario | Command to Use |
|----------|----------------|
| Making commits in existing project | `commit-push.md` |
| Starting fresh project from issue | `new-codebase-commit-push.md` |
| Implementing feature in existing code | `gh-issue-implement.md` |
| Building new project from issue | `new-codebase-gh-issue-implement.md` |
| Planning changes to existing code | `gh-create-plan.md` |
| Architecting new project | `new-codebase-gh-create-plan.md` |
| Reviewing existing code PR | `gh-code-review.md` |
| Reviewing initial implementation | `new-codebase-gh-code-review.md` |
| Addressing feedback on existing PR | `gh-address-feedback.md` |
| Addressing feedback on first PR | `new-codebase-gh-address-feedback.md` |
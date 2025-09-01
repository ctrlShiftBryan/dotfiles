You are a software developer tasked with addressing feedback on a pull request. Follow these instructions carefully to implement the requested changes using a Test-Driven Development (TDD) approach.

IMPORTANT: You must commit and push your work after EACH small change to ensure your progress can be followed remotely on GitHub.

## Task Tool Usage Guidelines

IMPORTANT: Use the Task tool for ALL analysis and exploratory work. Execute multiple Tasks in parallel for maximum efficiency.

First, use Task tools to gather all context in parallel:

**Launch these Tasks simultaneously:**

1. **Fetch PR and feedback details**
   ```bash
   # Get the PR associated with the issue
   gh pr list --search "issue:$ARGUMENTS" --json number --jq '.[0].number' | read PR_NUMBER
   
   # Fetch PR details and comments
   gh pr view $PR_NUMBER --json title,body,comments,reviews,commits
   ```

2. **Analyze test coverage for changed files**
   - Find existing test files
   - Check current test status
   - Identify testing patterns

3. **Search for code context**
   - Find patterns mentioned in feedback
   - Locate similar implementations
   - Check for dependencies

Review all feedback from PR comments and reviews to understand what changes are needed.

Follow these steps to address the feedback using TDD:

1. Before making any code changes, ensure you understand the existing test coverage. Run all tests to confirm the current state.

2. For each piece of feedback, break it down into small, manageable steps:
   a. If the feedback requires new functionality, write a failing test first.
   b. If the feedback is about fixing existing code, ensure there's a test that covers the issue.
   c. Run the tests to confirm the test fails (or identify which tests need updating).
   d. Implement the minimum amount of code necessary to address the feedback.
   e. Run the tests again to confirm all tests pass.
   f. Refactor if necessary, ensuring all tests still pass.
   g. Commit and push your changes immediately after each piece of feedback is addressed.

3. Commit AND push your changes frequently, following this pattern:
   a. After adding/modifying a test: Commit with a message referencing the feedback, then push.
   b. After implementing the fix: Commit with a message describing the implementation, then push.
   c. After any refactoring: Commit with a message describing the refactoring, then push.
   
   IMPORTANT: Push after EVERY commit to ensure remote visibility of your progress on GitHub.

4. Use conventional commits for all your commit messages, referencing the PR feedback. The format should be:
   <type>[optional scope]: <description> (addresses PR feedback)

   Common types for addressing feedback include:
   - fix: Addressing a bug or issue raised in the PR
   - refactor: Code improvements suggested in the PR
   - test: Adding or updating tests based on PR feedback
   - style: Formatting or style changes requested
   - docs: Documentation updates requested

5. After addressing each piece of feedback, leave a comment on the PR indicating which commit addresses that specific feedback.

6. Always run the full test suite after making changes to ensure no regressions were introduced.

7. If you encounter any errors while running tests, use Task tool to investigate patterns and fix them immediately before proceeding.

8. Continue this process until all feedback has been addressed.

9. Once all feedback is addressed, add a summary comment on the PR listing all the changes made.

Your final output should include:
- A series of commit messages that address each piece of feedback
- Comments on the PR linking feedback to specific commits
- A summary of all changes made

Provide your final output in the following format:

<feedback_summary>
Summary of all feedback addressed and how it was resolved
</feedback_summary>

<commit_messages>
List of commit messages addressing the feedback, each on a new line
</commit_messages>

<pr_comments>
Comments to be added to the PR linking feedback to commits
</pr_comments>
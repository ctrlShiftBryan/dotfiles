You are a software developer tasked with implementing a plan described in a GitHub issue. Follow these instructions carefully to complete the task using a Test-Driven Development (TDD) approach.

IMPORTANT: Use the Task tool whenever possible for any research, searching, or exploratory work. This includes:
- Searching for specific implementations or patterns in the codebase
- Finding files related to the issue
- Understanding existing code structure
- Researching how similar features are implemented
- Any other investigative work that involves searching or reading multiple files 

IMPORTANT: You must commit and push your work after EACH small step to ensure your progress can be followed remotely on GitHub.

First, launch these Tasks in PARALLEL to gather comprehensive context:

```
Launch all of these Tasks simultaneously:
1. Fetch issue details: gh issue view $ARGUMENTS --json title,body,comments,labels,assignees,createdAt
2. Search for test files related to the feature mentioned in the issue
3. Find existing implementations of similar features
4. Identify utility functions or helpers that might be useful
5. Look for relevant types, interfaces, or schemas
```

After the Tasks complete, review all findings to understand:
- The requirements from the issue
- Existing patterns to follow
- Available utilities to reuse
- Test structure to maintain

Follow these steps to implement the plan using TDD:

1. Based on the parallel Task results, identify missing test coverage and add it first. This ensures that you have a solid foundation for your changes.

2. Use the Task tool to break down the work into small, manageable steps by analyzing the codebase structure and identifying the files that need to be modified. Then for each step:
   a. Write a failing test that describes the desired behavior.
   b. Run the tests to confirm that the new test fails.
   c. Implement the minimum amount of code necessary to make the test pass.
   d. Run the tests again to confirm that all tests, including the new one, pass.
   e. Refactor the code if necessary, ensuring all tests still pass.
   f. Commit and push your changes immediately to maintain remote visibility.

3. Commit AND push your changes frequently, following this pattern:
   a. After adding a new test: Commit with a message describing the test, then push.
   b. After making the test pass: Commit with a message describing the implementation, then push.
   c. After any refactoring: Commit with a message describing the refactoring, then push.
   
   IMPORTANT: Push after EVERY commit to ensure remote visibility of your progress on GitHub.

4. Use conventional commits for all your commit messages. The format should be:
   <type>[optional scope]: <description>

   Common types include:

   - test: Adding missing tests or correcting existing tests
   - feat: A new feature
   - fix: A bug fix
   - refactor: A code change that neither fixes a bug nor adds a feature

5. Always run tests after making changes to confirm your assumptions and catch any regressions. If tests fail, use the Task tool to:
   - Analyze the error messages and stack traces
   - Search for similar test patterns in the codebase
   - Understand the expected behavior vs actual behavior

6. If you encounter any errors while running tests, use the Task tool to investigate the root cause, then fix them immediately before proceeding with new changes.

7. Throughout the implementation process, use the Task tool for:
   - Searching for code patterns or examples
   - Understanding dependencies between components
   - Finding configuration files or settings
   - Any other research needed to implement the feature correctly
   
   Continue this process until you have fully implemented the plan described in the GitHub issue.

Your final output should be a series of commit messages, each following the conventional commits format, that collectively describe the implementation of the plan. Include a brief summary of the changes made and any notable decisions or challenges encountered during the implementation.

Provide your final output in the following format:

<implementation_summary>
Brief summary of the changes made and any notable decisions or challenges
</implementation_summary>

<commit_messages>
List of commit messages, each on a new line
</commit_messages>

<task>
Answer the following question about the codebase. DO NOT modify any existing files under any circumstances.
</task>

<instructions>
1. First, attempt to answer the question by reading and analyzing existing code without creating any files.
2. If you need to run code to answer the question:
   - Create temporary new files in a scratch directory (e.g., /tmp/ or ./scratch/)
   - Run experiments or tests in these new files only
   - Never modify existing project files
3. Use available tools to explore and understand the codebase (grep, find, cat, etc.)
4. Provide a clear, direct answer with supporting evidence from the code
</instructions>

<constraints>
- NEVER modify existing files in the project
- NEVER refactor, update, or change any code
- Only create new files if absolutely necessary to answer the question
- If code execution is needed, use temporary files that won't affect the project
</constraints>

<output_format>
Provide your answer in this format:
1. Direct answer to the question
2. Supporting evidence (file paths, line numbers, code snippets)
3. Any additional context or explanations
4. If you created temporary files for testing, list them at the end
</output_format>

<question>

k
$ARGUMENTS

</question>

<examples>
Good questions:
- "How does the authentication middleware work in this project?"
- "What design patterns are used in the database layer?"
- "Which files handle user session management?"
- "What's the flow of data from the API endpoint to the database?"

If asked "How does function X handle null inputs?", you might:
1. First examine the function's code
2. If unclear, create /tmp/test_function_x.py to test behavior
3. Report findings without modifying the original function
</examples>

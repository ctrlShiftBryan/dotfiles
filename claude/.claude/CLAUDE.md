# Important

In all interactions and commit messages, be extremely concise and sacrifice grammar for the sake of concision.

# Who I Am

my name is bryan

my github username is ctrlshiftbryan

## Plan Documentation

When presenting any implementation plan or strategy to the user, always:

1. Create a markdown file in the `plans/` directory at the repository root
2. Name the file using this format: `YYYY-MM-DD-HH-MMam-pm-descriptive-name.md`
   - Use system local time for the timestamp
   - Replace spaces with hyphens in the descriptive name
   - Keep the descriptive name concise (3-5 words)
3. Example: `plans/2025-01-07-02-30pm-refactor-auth-system.md`

4. The plan file should contain:

   - A clear title
   - Numbered steps or phases
   - Any relevant context or assumptions
   - Expected outcomes

5. Always create this file BEFORE presenting the plan to the user, then reference it in your response

6. When iterating or refining a plan based on user feedback:
   - Update the existing plan file directly with the changes
   - Do NOT just output changes in the prompt response
   - Keep the plan clean and current without revision tracking

This ensures all plans are:

- Timestamped for historical tracking
- Easily searchable and reviewable
- Preserved for future reference
- Organized in a dedicated location
- Always reflect the current/latest version of the plan

# when working with web urls and dev servers

please write them to the file 'tmux-urls.cfg' in the root of the repository at the same level as the .git folder.

<example-tmux-urls.cfg>
b: https://localhost:1234
gg: http://localhost:3333/dev-login
g: https://google.com
</example-tmux-urls.cfg>

this will allow the user to quickly open a browser with the url using a keyboard shortcut, so this should be kept up to date

use keyboard keys 'b,f,g,r,t,d,c,e' as needed

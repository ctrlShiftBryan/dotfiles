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

This ensures all plans are:

- Timestamped for historical tracking
- Easily searchable and reviewable
- Preserved for future reference
- Organized in a dedicated location

# Main Branch Plan Guard

After a plan is approved and before starting implementation, check if the current branch is the repo's main/default branch (main or master). If so:

1. Use AskUserQuestion to ask: "You're on the main branch. How should this plan be handled?"
   - **Implement here on main** - proceed with implementation as normal
   - **Post as GitHub issue** - create a GitHub issue with the plan title and full plan content as the body, then stop

When posting as a GitHub issue:

- Use `gh issue create`
- Title: the plan's heading
- Body: full plan markdown content
- After posting, show the issue URL and stop (do not implement)

If NOT on the main/default branch, skip this check and proceed normally.

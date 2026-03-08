---
name: review-address
description: "Reply to every PR review comment with fixes or push-backs. Fetches all comments, triages, fixes code, commits, and posts inline replies. Not complete until every comment has a response."
---

# Review Address — Reply to Every PR Review Comment

**Goal: Post an inline reply to every reviewer comment on the PR.** Code fixes and push-backs are the content of those replies — but the replies themselves are the deliverable. The skill is NOT complete until every comment has a response posted via the GitHub API.

## Process (Default — Not in Plan Mode)

### 1. Detect PR

```bash
gh pr view --json number,author -q '{number: .number, author: .author.login}'
```

Capture PR number + PR_AUTHOR. Stop with message if no open PR on current branch.

### 2. Fetch & Process All Comments

Get owner/repo from `gh repo view --json owner,name`.

Three paginated API calls (no login filter):

- **Review comments (inline):**
  ```bash
  gh api repos/{owner}/{repo}/pulls/$PR/comments --paginate
  ```
- **Issue comments (top-level):**
  ```bash
  gh api repos/{owner}/{repo}/issues/$PR/comments --paginate
  ```
- **Reviews (for reviewer identity):**
  ```bash
  gh api repos/{owner}/{repo}/pulls/$PR/reviews --paginate
  ```

Discard all comments where `.user.login == PR_AUTHOR`.

Keep every review comment where `.user.login != PR_AUTHOR`. Compute `handled_by_author` (whether PR_AUTHOR already replied in thread) only as metadata for reply wording — never skip a comment because of it.

- **Inline comments:** check `in_reply_to_id` chain for a reply where `.user.login == PR_AUTHOR` → set `handled_by_author: true`
- **Top-level comments:** check subsequent comments by PR_AUTHOR → set `handled_by_author: true`

Display comments grouped by `user.login` for triage clarity:

- Bots first (logins ending in `[bot]`)
- Then humans alphabetically

Triage every kept comment (address or push back), even if already handled/resolved.

### 3. Make Code Fixes

For each comment triaged as "address":

- Make the minimal KISS fix in the code
- No distinction between bot/human

For push-backs: prepare clear reasoning response (no code changes).

### 4. Commit & Push

Only if code changes were made:

```bash
git add -A && git commit -m "fix: address PR review feedback" && git push
```

Skip this step entirely if all comments were push-backs (no code changes).

### 5. Reply to Every Comment

**This is the primary deliverable.** Reply to every triaged comment via appropriate endpoint:

- **Inline comments:**
  ```bash
  gh api repos/{owner}/{repo}/pulls/$PR/comments/{id}/replies -X POST -f body="Fixed — [brief description]"
  ```
- **Top-level comments:**
  ```bash
  gh api repos/{owner}/{repo}/issues/$PR/comments -X POST -f body="[response]"
  ```

For addressed items: "Fixed — [brief description]"
For push-backs: clear reasoning why the suggestion was declined.

**Do not proceed to the next step until every comment has a reply posted.**

### 6. CodeRabbit Resolve (conditional)

Only if CodeRabbit (`coderabbitai[bot]`) comments were processed AND none remain unaddressed:

```bash
gh api repos/{owner}/{repo}/issues/$PR/comments -X POST -f body="@coderabbitai resolve"
```

Skip entirely if no CodeRabbit comments exist or any remain unaddressed.

### 7. Re-review Prompt (conditional)

After all replies posted, if any **human** reviewers (non-bot) had comments that were **addressed** (not pushed back):

Use `AskUserQuestion` to ask if the user wants to request re-review from those specific humans. List each human reviewer whose feedback was addressed.

For each selected reviewer:

```bash
gh api repos/{owner}/{repo}/pulls/$PR/requested_reviewers -X POST --field "reviewers[]={login}"
```

Skip entirely if no human reviewers had comments addressed.

## Completion Checklist (must all be true)

- [ ] Every reviewer comment has an inline reply posted via `gh api`
- [ ] Code fixes committed and pushed (if any)
- [ ] CodeRabbit resolve posted (if applicable)

**If replies are not posted, the skill has NOT been executed.**

## Plan Mode Behavior

If triggered while in plan mode: **do not act**. Instead produce a triage table grouped by reviewer listing each comment, the decision (address/push-back), and proposed change or reasoning.

## Principles

- **Replies are the output** — code fixes support replies, not the other way around
- **Re-runnable means safe to run repeatedly** — not "skip handled"
- **KISS** — minimal fixes, no over-engineering
- **Push back when warranted** — not all suggestions are improvements
- **Single commit** — one commit for all fixes
- **Reviewer-grouped** — triage organized by commenter for clarity

## Edge Cases

| Condition                    | Handling                                 |
| ---------------------------- | ---------------------------------------- |
| No open PR                   | stop with message                        |
| No review comments           | stop with message                        |
| All from PR author           | stop: "no reviewer comments to address"  |
| All previously handled       | still reply to all with follow-up status |
| All push-backs               | skip commit/push, only reply             |
| No human reviewers addressed | skip re-review prompt                    |
| No CodeRabbit comments       | skip `@coderabbitai resolve`             |

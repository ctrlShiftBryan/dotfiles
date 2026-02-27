---
name: review-address
description: 'Auto-resolve ALL PR review feedback (human + bot). Fetches unhandled comments, fixes or pushes back, commits, pushes, replies inline, optionally requests re-review. Re-runnable.'
---

# Review Address — Automatic PR Review Resolver

Fully automatic. Fetches ALL review comments from the current PR (human reviewers, bots, everyone), fixes or pushes back on each, commits, pushes, replies inline. CodeRabbit `@coderabbitai resolve` is a special case triggered only when all CR comments are cleared.

## Process (Default — Not in Plan Mode)

### 1. Detect PR

```bash
gh pr view --json number,author -q '{number: .number, author: .author.login}'
```

Capture PR number + PR_AUTHOR. Stop with message if no open PR on current branch.

### 2. Fetch All Comments

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

### 3. Filter Out PR Author

Discard all comments where `.user.login == PR_AUTHOR`. These are the PR author's own comments — not review feedback.

### 4. Filter Unhandled

A comment is "handled" if its thread has a reply from `PR_AUTHOR` (not just "any non-bot" — a bot replying to another bot doesn't count).

- **Inline comments:** check `in_reply_to_id` chain for a reply where `.user.login == PR_AUTHOR`
- **Top-level comments:** check subsequent comments by PR_AUTHOR

Skip handled comments.

### 5. Group by Reviewer

Display unhandled comments grouped by `user.login` for triage clarity:
- Bots first (logins ending in `[bot]`)
- Then humans alphabetically

### 6. Triage Each

For each unhandled comment:

- **Address** — make the minimal KISS fix in the code
- **Push back** — prepare a clear reasoning response

No distinction between bot/human at triage time.

### 7. Commit & Push

Only if code changes were made:

```bash
git add -A && git commit -m "fix: address PR review feedback" && git push
```

Skip this step entirely if all comments were push-backs (no code changes).

### 8. Reply Inline

Reply to every triaged comment via appropriate endpoint:

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

### 9. CodeRabbit-Specific (conditional)

Only if CodeRabbit (`coderabbitai[bot]`) comments were processed AND none remain unaddressed:

```bash
gh api repos/{owner}/{repo}/issues/$PR/comments -X POST -f body="@coderabbitai resolve"
```

Skip entirely if no CodeRabbit comments exist or any remain unaddressed.

### 10. Re-review Prompt (conditional)

After all replies posted, if any **human** reviewers (non-bot) had comments that were **addressed** (not pushed back):

Use `AskUserQuestion` to ask if the user wants to request re-review from those specific humans. List each human reviewer whose feedback was addressed.

For each selected reviewer:

```bash
gh api repos/{owner}/{repo}/pulls/$PR/requested_reviewers -X POST --field "reviewers[]={login}"
```

Skip entirely if no human reviewers had comments addressed.

## Plan Mode Behavior

If triggered while in plan mode: **do not act**. Instead produce a triage table grouped by reviewer listing each comment, the decision (address/push-back), and proposed change or reasoning.

## Principles

- **KISS** — minimal fixes, no over-engineering
- **Re-runnable** — skip already-handled comments (PR_AUTHOR replied)
- **Every comment gets a response** — nothing ignored silently
- **Push back when warranted** — not all suggestions are improvements
- **Single commit** — one commit for all fixes
- **Reviewer-grouped** — triage organized by commenter for clarity

## Edge Cases

| Condition | Handling |
|---|---|
| No open PR | stop with message |
| No review comments | stop with message |
| All from PR author | stop: "no reviewer comments to address" |
| All already handled | stop: "all comments already addressed" |
| All push-backs | skip commit/push, only reply |
| No human reviewers addressed | skip re-review prompt |
| No CodeRabbit comments | skip `@coderabbitai resolve` |

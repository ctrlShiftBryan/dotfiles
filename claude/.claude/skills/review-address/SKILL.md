---
name: review-address
description: "Auto-resolve CodeRabbit review feedback on current PR. Fetches unhandled comments, fixes or pushes back, commits, pushes, replies inline. Re-runnable."
---

# Review Address — Automatic CodeRabbit Resolver

Fully automatic. Fetches CodeRabbit comments from the current PR, fixes or pushes back on each, commits, pushes, replies inline, and requests approval.

## Process (Default — Not in Plan Mode)

### 1. Detect PR

```bash
gh pr view --json number -q '.number'
```

Stop with message if no open PR on current branch.

### 2. Fetch CodeRabbit Comments

Get owner/repo from `gh repo view --json owner,name`.

Two paginated API calls:

- **Review comments (inline):**
  ```bash
  gh api repos/{owner}/{repo}/pulls/$PR/comments --paginate
  ```
- **Issue comments (top-level):**
  ```bash
  gh api repos/{owner}/{repo}/issues/$PR/comments --paginate
  ```

Filter both by `.user.login == "coderabbitai"`.

### 3. Filter Unhandled

A comment is "handled" if its thread has any non-bot reply. Skip those.

For review comments: check if any reply exists with a different `user.login` in the same `in_reply_to_id` chain.

For issue comments: check if any subsequent non-bot comment references or follows the CodeRabbit comment.

### 4. Triage Each

For each unhandled comment:

- **Address** — make the minimal KISS fix in the code
- **Push back** — prepare a clear reasoning response

### 5. Commit & Push

Only if code changes were made:

```bash
git add -A && git commit -m "fix: address coderabbit feedback" && git push
```

Skip this step entirely if all comments were push-backs (no code changes).

### 6. Reply Inline

Reply to every triaged comment:

- **Review comments (inline):**
  ```bash
  gh api repos/{owner}/{repo}/pulls/$PR/comments/{id}/replies -X POST -f body="Fixed — [brief description]"
  ```
- **Issue comments (top-level):**
  ```bash
  gh api repos/{owner}/{repo}/issues/$PR/comments -X POST -f body="@coderabbitai [response]"
  ```

For addressed items: "Fixed — [brief description]"
For push-backs: clear reasoning why the suggestion was declined.

### 7. Request Approval

If no un-addressed issues remain, post a top-level comment:

```bash
gh api repos/{owner}/{repo}/issues/$PR/comments -X POST -f body="@coderabbitai resolve"
```

## Plan Mode Behavior

If triggered while in plan mode: **do not act**. Instead produce a triage plan listing each comment, the decision (address/push-back), and proposed change or reasoning.

## Principles

- **KISS** — minimal fixes, no over-engineering
- **Re-runnable** — skip already-handled comments
- **Every comment gets a response** — nothing ignored silently
- **Push back when warranted** — not all suggestions are improvements
- **Single commit** — one commit for all fixes

## Edge Cases

- No open PR → stop with message
- No CodeRabbit comments → stop with message
- All already handled → stop with message
- No code changes (all push-backs) → skip commit/push, only reply

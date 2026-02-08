---
name: code-rabbit-feedback
description: "Review CodeRabbit AI feedback on PRs. Triage what to address vs push back on. KISS approach - no over-engineering."
---

# CodeRabbit Feedback Review

Make plan that reviews @coderabbitai feedback on the current PR.

## Process

1. **Read all CodeRabbit comments** on the PR
2. **Check each comment's thread for existing replies** - skip comments already handled
3. **For remaining unhandled comments, decide:** address it or push back
4. **If addressing:** make the fix, keep it simple
5. **If pushing back:** reply directly to that specific comment in GitHub with reasoning. Make sure the reply is to the original comment or tag @coderabbitai in the comment

## Skipping Already-Handled Comments

A comment is "handled" and should be skipped if any of:
- You or another human already replied with a fix or explanation
- You or another human already pushed back on it
- The comment thread has any non-bot response

This allows re-running the skill to pick up only **new/unaddressed** comments.

## Principles

- **KISS** - keep it simple, don't over-engineer solutions
- **Only process unhandled comments** - skip anything already addressed or pushed back on
- **Each new comment gets a response** - either a fix or a pushback reply
- **Reply to individual comments** - no giant batch responses
- **Push back when warranted** - not all suggestions are improvements

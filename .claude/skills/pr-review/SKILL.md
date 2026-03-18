---
name: pr-review
description: Review a pull request — summarise changes, check tests pass, flag risks, and leave a comment
argument-hint: "<pr-number>"
allowed-tools: Bash(gh *)
---

Review PR #$ARGUMENTS for HACOY:

1. Fetch the PR diff: `gh pr diff $ARGUMENTS`
2. Fetch PR metadata: `gh pr view $ARGUMENTS`
3. Check CI status: `gh pr checks $ARGUMENTS`
4. Analyse the diff for:
   - Correctness: does the code do what the PR description says?
   - Security: any hardcoded secrets, SQL injection, XSS, or OWASP Top 10 issues?
   - Style: does it follow the HACOY code style (2-space indent, single quotes, ES modules)?
   - Tests: are new/changed code paths covered by tests?
   - Scope creep: are changes focused, or is there unrelated work mixed in?
5. Post a review comment on the PR via `gh pr review $ARGUMENTS --comment --body "<your review>"`
6. Summarise your findings to the user.

---
name: fix-issue
description: Fix a GitHub issue end-to-end — read it, implement the fix, test, commit, push, and open a PR
argument-hint: "<issue-number>"
allowed-tools: Bash(gh *), Read, Grep, Glob, Edit, Write
---

Fix GitHub issue #$ARGUMENTS end-to-end:

1. Read the issue: `gh issue view $ARGUMENTS`
2. Understand what needs to change
3. Search the codebase for relevant files
4. Implement the fix
5. Run `npm run test` and fix any failures
6. Run `npm run lint` and fix any issues
7. Commit with a message like: `fix: resolve issue #$ARGUMENTS - <short description>`
8. Push to a branch named `bugfix/issue-$ARGUMENTS`
9. Open a PR: `gh pr create --title "Fix #$ARGUMENTS" --body "Closes #$ARGUMENTS"`
10. Return the PR URL

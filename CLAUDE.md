# HACOY — Claude Code Guide

This file tells Claude how to work best with HACOY's codebase and team.
It loads automatically at the start of every session.

---

## 1. Project Basics

- **Stack**: Node.js 20.x, npm, deployed to Azure Web Apps
- **CI/CD**: GitHub Actions (`.github/workflows/`) — build, test, deploy to Azure on push to `main`
- **Package manager**: always use `npm` (not yarn or bun)

## 2. Build & Test Commands

```bash
npm install       # install dependencies
npm run build     # build (if present)
npm run test      # run tests — do this before every commit
npm run lint      # lint code
```

Run `npm run test` after every code change. Fix all failures before committing.

## 3. Code Style Rules

- **Language**: JavaScript / TypeScript
- **Indentation**: 2 spaces
- **Imports**: ES modules (`import`/`export`), not CommonJS (`require`)
- **Naming**: camelCase for variables/functions, PascalCase for classes/components
- **No unused variables**: treat them as errors
- **Strings**: single quotes preferred

## 4. Git Workflow

- **Branch naming**: `feature/X`, `bugfix/X`, `docs/X`, `claude/X`
- **Commit messages**: imperative mood — "add auth", not "added auth"
- **Never push directly to `main`** — always use a branch + PR
- **PRs require**: passing tests + lint before merge

## 5. Azure Deployment Notes

- Production deploys happen automatically on push to `main` via GitHub Actions
- Set `AZURE_WEBAPP_NAME` and `AZURE_WEBAPP_PUBLISH_PROFILE` in GitHub Secrets before deploying
- Node version is pinned to `20.x` — do not upgrade without updating the workflow file

## 6. Security Rules

- **Never commit `.env` files or secrets** — they go in GitHub Secrets or Azure App Settings
- **Never hardcode credentials** — use environment variables
- **Never run `rm -rf` without confirmation**
- **Never force-push to `main`**

## 7. Skills (Slash Commands)

HACOY uses custom skills stored in `.claude/skills/`. Invoke them with `/skill-name`.
See `.claude/skills/` for available workflows.

## 8. Working Style Preferences

- **Plan first, code second**: for anything non-trivial, write out the plan before implementing
- **Run tests and fix failures**: always verify work with `npm run test`
- **Commit frequently**: small, focused commits with clear messages
- **Ask before deleting files** or making large structural changes

---

## Quick Reference

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Build | `npm run build` |
| Test | `npm run test` |
| Lint | `npm run lint` |
| New feature | branch off `main` → implement → test → PR |
| Deploy | merge PR to `main` → GitHub Actions auto-deploys |

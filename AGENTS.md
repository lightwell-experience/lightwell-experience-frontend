# AGENTS.md

React + PatternFly 6 app loaded into console.redhat.com as a module federation remote, built with `fec`. Node version per `.nvmrc`.

## Commands

- `yarn start`: dev server against stage (run `yarn patch:hosts` once first). `yarn local` points the API at a backend on `:8000`.
- `yarn verify`: build, lint, format check and unit tests. Run before opening a PR.
- `yarn test`: Jest unit tests. `yarn test-ui`: Playwright (setup in `playwright/README.md`).

## Layout

- `src/AppEntry.tsx`: app root, exposed as `./RootApp` in `fec.config.js`. Deployed via `deploy/frontend.yaml`.
- `src/Pages/Lightwell/`: pages. `src/services/`: API clients. `src/kit/`: UI kit.
- Imports resolve from `src/` (e.g. `import ... from 'Hooks/...'`).
- Editing `src/kit/`, `src/Pages/Lightwell/` or `styles/lightwell-*`: follow `docs/skills/kit/SKILL.md`.

## Pull requests

- Title must start with a Jira ticket id (`LWLP-1234: summary`), or `Build`/`Test` when there is no ticket. 5-70 characters. Enforced by `.github/workflows/title.yml`.
- Open PRs against `main`. Fill in the sections of `.github/pull_request_template.md`.

# AGENTS.md

Guidance for AI coding agents in **Lightwell Experience frontend**: a React + PatternFly 6 app loaded into console.redhat.com as a module federation remote, built with `fec`.

## Where guidance lives

| Source                                       | Use it                                                                    |
| -------------------------------------------- | ------------------------------------------------------------------------- |
| [docs/skills/kit/](docs/skills/kit/SKILL.md) | Before editing `src/kit/`, `src/Pages/Lightwell/` or `styles/lightwell-*` |
| [src/kit/README.md](src/kit/README.md)       | Kit structure (primitives, assemblies)                                    |
| [playwright/README.md](playwright/README.md) | E2E setup and layout                                                      |

## Repository Architecture

Imports resolve from `src/` (e.g. `import ... from 'Hooks/...'`).

```
├── fec.config.js          # fec config: module federation exposes, dev proxy routes
├── deploy/frontend.yaml   # console deployment (routes /lightwell → ./RootApp)
├── src/
│   ├── AppEntry.tsx       # app root and providers, exposed as ./RootApp
│   ├── moduleEntries/     # PDF templates loaded by crc-pdf-generator
│   ├── Pages/Lightwell/   # pages, one folder per area (Beacon, Lens, Packages, ...)
│   ├── services/          # API clients (*Api.ts) and React Query hooks (*Queries.ts)
│   ├── kit/               # Lw* UI kit
│   └── components/, Hooks/, store/, middleware/
├── styles/                # global SCSS overrides
└── playwright/            # E2E tests
```

## Key Commands

```bash
yarn install
yarn patch:hosts   # once, may need sudo
yarn start         # dev server against stage; `yarn local` for a backend on :8000
yarn verify        # build + lint + format check + unit tests; run before opening a PR
yarn lint:fix && yarn format
yarn test          # Jest, tests colocated as *.test.ts(x)
yarn test-ui       # Playwright
```

## Pull Requests

- Title must start with a Jira ticket id (`LWLP-1234: summary`), or `Build`/`Test` when there is no ticket. 5-70 characters. Enforced by `.github/workflows/title.yml`.
- Open PRs against `main`. Fill in the sections of `.github/pull_request_template.md`.

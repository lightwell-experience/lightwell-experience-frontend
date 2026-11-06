# Playwright E2E

Top-level Playwright suite for Lightwell Experience.

## Setup

1. Copy `playwright.example.env` into `.env`
2. Copy `creds.example.json` into `creds-stage.json` and/or `creds-prod.json` and fill in values
3. `yarn test-use-creds:stage` or `yarn test-use-creds:prod` depending on which environment you'd like to test
4. `yarn test-ui`

Auth runs first (`auth.setup.ts`) for users in `creds.json`. Specs pick a user via `test.use({ storageState })` from `helpers/auth` `users`.

## Layout

| Path | Purpose |
|------|---------|
| `auth.setup.ts` | Login and persist storage state |
| `helpers/auth.ts` | Users list, login / logout helpers |
| `helpers/` | Shared test helpers |
| `pages/` | Page objects |
| `Integration/` | E2E specs (Stage/Prod PR + nightly) |

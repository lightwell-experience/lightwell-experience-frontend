# Lightwell Experience Frontend

## Setup

```bash
yarn install
yarn patch:hosts   # May require sudo (one-time)
yarn build         # Only required when setting up for the first time
yarn start         # or: yarn local (with backend on :8000)
```

Open the URL listed in the terminal output (`https://stage.foo.redhat.com:1337/staging-lightwell` for example)

## Lint

- `yarn lint` to check ESLint linting errors or `yarn lint:fix` to check and fix
- `yarn format:check` will check format with Prettier, `yarn format` will check and fix

## Tests

- `yarn test` to run Jest unit tests
- `yarn verify` to build, check ESLint and Prettier, and run unit tests in one go


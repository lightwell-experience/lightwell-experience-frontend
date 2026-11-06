/**
 * Authentication setup for Playwright tests.
 *
 * Authenticates users based on AUTH_USERS (comma-separated keys) or all
 * configured users. Network is always authenticated last.
 */

import { test, expect } from '@playwright/test';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

import {
  DEFAULT_USER_KEY,
  ensureNotInPreview,
  storeStorageStateAndToken,
  logout,
  logInWithUsernameAndPassword,
  users,
  type AuthUser,
} from './helpers/auth';
import { closeGenericPopupsIfExist } from './helpers/popups';

const authDir = process.env.PLAYWRIGHT_AUTH_DIR || path.join(__dirname, '../.auth');
if (!existsSync(authDir)) {
  mkdirSync(authDir, { recursive: true });
}

const buildActiveUsers = (): AuthUser[] => {
  if (process.env.AUTH_USERS) {
    const requestedKeys = process.env.AUTH_USERS.split(',').map((k) => k.trim());
    const selected = users.filter((u) => requestedKeys.includes(u.key));

    if (requestedKeys.length !== selected.length) {
      const missingUsers = requestedKeys.filter((k) => !users.find((u) => u.key === k));
      throw new Error(
        `Couldn't find user(s): ${missingUsers.join(', ')}. Available: ${users.map((u) => u.key).join(', ')}`,
      );
    }

    const active = [...selected];
    const defaultIndex = active.findIndex((u) => u.key === DEFAULT_USER_KEY);
    if (defaultIndex !== -1 && defaultIndex !== active.length - 1) {
      const [defaultUser] = active.splice(defaultIndex, 1);
      active.push(defaultUser);
    }
    return active;
  }

  // Authenticate every configured user; network is already last in `users`.
  return [...users];
};

const getRequiredEnvVars = (active: AuthUser[]): string[] => {
  const baseVars = ['BASE_URL'];
  const userCredentials = active.flatMap((u) => u.credentialEnvVars);
  const integrationVars = process.env.INTEGRATION
    ? process.env.BASE_URL?.includes('foo')
      ? []
      : ['PROXY']
    : [];
  return [...new Set([...baseVars, ...userCredentials, ...integrationVars])];
};

const validateEnvVars = () => {
  const wrongProxySettings = process.env.BASE_URL?.includes('foo') && !!process.env.PROXY;
  if (wrongProxySettings) {
    throw new Error(
      'You are trying to test against a locally running frontend while having PROXY set, please unset it.',
    );
  }
  const required = getRequiredEnvVars(activeUsers);
  const missing = required.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    throw new Error('Missing env variables: ' + missing.join(', '));
  }
};

const activeUsers = buildActiveUsers();
validateEnvVars();

test.describe('Set up authentication states', () => {
  test.describe.configure({ retries: 2 });

  for (const user of activeUsers) {
    test(`Authenticate ${user.key} user and save state`, async ({ page }) => {
      test.setTimeout(60_000);

      await closeGenericPopupsIfExist(page);
      await logInWithUsernameAndPassword(
        page,
        process.env[user.credentialEnvVars[0]],
        process.env[user.credentialEnvVars[1]],
      );
      await ensureNotInPreview(page);
      await storeStorageStateAndToken(page, user.tokenEnvVar);
      expect(process.env[user.tokenEnvVar]).toBeDefined();

      if (user.key !== DEFAULT_USER_KEY) {
        await logout(page);
      }
    });
  }
});

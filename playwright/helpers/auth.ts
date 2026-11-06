import { expect, type Page } from '@playwright/test';
import { readFileSync } from 'fs';
import path from 'path';

const LIGHTWELL_HOME = '/lightwell';

/** Default session used by the integration project. */
export const DEFAULT_USER_KEY = 'network';

export type AuthUser = {
  name: string;
  key: string;
  tokenEnvVar: string;
  credentialEnvVars: [string, string];
  storageState: string;
};

const defineUser = (
  user: Omit<AuthUser, 'storageState'>,
): AuthUser => ({
  ...user,
  storageState: `.auth/${user.tokenEnvVar}.json`,
});

/** Users authenticated by auth.setup.ts. Network is last for the default storageState. */
export const users: AuthUser[] = [
  defineUser({
    name: 'Academic',
    key: 'academic',
    tokenEnvVar: 'LW_ACADEMIC_TOKEN',
    credentialEnvVars: ['LW_ACADEMIC_USERNAME', 'LW_ACADEMIC_PASSWORD'],
  }),
  defineUser({
    name: 'Clearinghouse',
    key: 'clearinghouse',
    tokenEnvVar: 'LW_CLEARINGHOUSE_TOKEN',
    credentialEnvVars: ['LW_CLEARINGHOUSE_USERNAME', 'LW_CLEARINGHOUSE_PASSWORD'],
  }),
  defineUser({
    name: 'Network',
    key: DEFAULT_USER_KEY,
    tokenEnvVar: 'LW_NETWORK_TOKEN',
    credentialEnvVars: ['LW_NETWORK_USERNAME', 'LW_NETWORK_PASSWORD'],
  }),
];

export const logout = async (page: Page) => {
  await page
    .getByRole('button')
    .filter({ has: page.getByRole('img', { name: 'User Avatar' }) })
    .click();

  await expect(async () => page.getByRole('menuitem', { name: 'Log out' }).isVisible()).toPass();

  await page.getByRole('menuitem', { name: 'Log out' }).click();

  await expect(async () => {
    expect(page.url()).not.toContain(LIGHTWELL_HOME);
  }).toPass();
  await expect(page.getByText('Log in to your Red Hat account')).toBeVisible();
};

export const logInWithUsernameAndPassword = async (
  page: Page,
  username?: string,
  password?: string,
) => {
  if (!username || !password) {
    throw new Error('Username or password not found');
  }

  await page.goto(LIGHTWELL_HOME);

  await expect(page.getByText('Log in to your Red Hat account')).toBeVisible();

  const login = page.getByRole('textbox');
  await login.fill(username);
  await login.press('Enter');
  const passwordField = page.getByRole('textbox', { name: 'Password' });
  await passwordField.fill(password);
  await passwordField.press('Enter');

  await expect(async () => {
    expect(page.url()).toContain(`${process.env.BASE_URL}${LIGHTWELL_HOME}`);

    const cookies = await page.context().cookies();
    const found = cookies.find((cookie) => cookie.name === 'cs_jwt');
    expect(found).toBeDefined();
  }).toPass({
    intervals: [1_000],
    timeout: 30_000,
  });
};

export const storeStorageStateAndToken = async (page: Page, tokenEnvVar: string) => {
  const authDir = process.env.PLAYWRIGHT_AUTH_DIR || path.join(__dirname, '../../.auth');
  const storageFile = `${tokenEnvVar}.json`;
  const { cookies } = await page.context().storageState({ path: path.join(authDir, storageFile) });
  const token = cookies.find((cookie) => cookie.name === 'cs_jwt')?.value;
  expect(token).toBeDefined();
  process.env.TOKEN = `Bearer ${token}`;
  process.env[tokenEnvVar] = `Bearer ${token}`;
};

export const getUserAuthToken = (name: string) => {
  const authDir = process.env.PLAYWRIGHT_AUTH_DIR || path.join(__dirname, '../../.auth');
  const userPath = path.join(authDir, `${name}.json`);
  const fileContent = readFileSync(userPath, { encoding: 'utf8' });

  const regex = /"name":\s*"cs_jwt",\s*"value":\s*"(.*?)"/;

  const match = fileContent.match(regex);
  if (match && match[1]) {
    return `Bearer ${match[1]}`;
  }

  return '';
};

export const ensureNotInPreview = async (page: Page) => {
  const toggle = page.locator('div').filter({ hasText: 'Preview mode' }).getByRole('switch');
  if ((await toggle.isVisible()) && (await toggle.isChecked())) {
    await toggle.click();
  }
};

import { defineConfig, devices } from '@playwright/test';
import { config, populate } from 'dotenv';
import fs from 'fs';
import path from 'path';

import { DEFAULT_USER_KEY, users } from './playwright/helpers/auth';

config({ path: path.join(__dirname, './.env'), quiet: true });

if (!process.env.PLAYWRIGHT_AUTH_DIR) {
  process.env.PLAYWRIGHT_AUTH_DIR = path.join(__dirname, '.auth');
}

const defaultStorageState = users.find((u) => u.key === DEFAULT_USER_KEY)!.storageState;

let creds: Record<string, string> = {};
try {
  const credsPath = path.join(__dirname, 'creds.json');
  const rawCreds = fs.readFileSync(credsPath, 'utf-8');
  creds = JSON.parse(rawCreds);
} catch (error) {
  const err = error as NodeJS.ErrnoException;

  if (err.code !== 'ENOENT') {
    // Do not log the actual error, to prevent leaking secrets.
    console.error('Failed to read or parse creds.json. Check the file and/or setup.');
  }
}
populate(process.env, creds);

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './playwright',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [
        ['html', { outputFolder: 'playwright-report' }],
        [
          'playwright-ctrf-json-reporter',
          { outputDir: 'playwright-ctrf', outputFile: 'playwright-ctrf.json' },
        ],
      ]
    : 'list',
  globalTimeout: (process.env.INTEGRATION ? 35 : 20) * 60 * 1000,
  timeout: (process.env.INTEGRATION ? 6 : 4) * 60 * 1000,
  expect: { timeout: 30_000 },
  use: {
    actionTimeout: 30_000,
    navigationTimeout: 30_000,
    launchOptions: {
      args: ['--use-fake-device-for-media-stream'],
    },
    baseURL: process.env.BASE_URL,
    ignoreHTTPSErrors: true,
    ...(process.env.PROXY
      ? {
          proxy: {
            server: process.env.PROXY,
          },
        }
      : {}),
    testIdAttribute: 'data-ouia-component-id',
    trace: 'on',
    screenshot: 'on',
    video: 'on',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: { trace: 'off', screenshot: 'off', video: 'off' },
    },
    {
      name: 'integration',
      use: {
        ...devices['Desktop Chrome'],
        storageState: defaultStorageState,
      },
      testDir: './playwright/Integration/',
      dependencies: ['setup'],
    },
  ],
});

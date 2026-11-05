/**
 * Beacon access: Only Clearinghouse users can access Beacon.
 */

import { test } from '@playwright/test';

import { users } from '../../helpers/auth';
import { BeaconPage } from '../../pages/BeaconPage';

test.describe('Beacon access', () => {
  for (const { name, storageState } of users.filter((u) => u.key !== 'clearinghouse')) {
    test.describe(name, () => {
      test.use({ storageState });

      test(`${name} user cannot access Beacon`, async ({ page }) => {
        const beaconPage = new BeaconPage(page);

        await beaconPage.goto();
        await beaconPage.expectDenied();
      });
    });
  }
});

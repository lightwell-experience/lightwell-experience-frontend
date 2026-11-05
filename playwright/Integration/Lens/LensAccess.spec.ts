/**
 * Lens access: Network, Academic, and Clearinghouse users can access Lens.
 */

import { test } from '@playwright/test';

import { users } from '../../helpers/auth';
import { LensUploadPage } from '../../pages/LensUploadPage';

test.describe('Lens access', () => {
  for (const { name, storageState } of users) {
    test.describe(name, () => {
      test.use({ storageState });

      test(`${name} user can access Lens`, async ({ page }) => {
        const lensUploadPage = new LensUploadPage(page);

        await lensUploadPage.goto();
        await lensUploadPage.expectLoaded();
      });
    });
  }
});

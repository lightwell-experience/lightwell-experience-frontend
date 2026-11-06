import { expect, type Locator, type Page } from '@playwright/test';

import { closeGenericPopupsIfExist } from '../helpers/popups';

/**
 * Page object for Lens upload.
 */
export class LensUploadPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get heading(): Locator {
    return this.page.getByRole('heading').and(this.page.getByTestId('lightwell-coverage-header'));
  }

  get chooseFileButton(): Locator {
    return this.page.getByRole('button', { name: 'Choose file' });
  }

  async goto(): Promise<void> {
    await closeGenericPopupsIfExist(this.page);
    await this.page.goto('/lightwell/lens');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toContainText('Lens');
    await expect(this.page.getByText('Select your manifest file')).toBeVisible();
    await expect(this.chooseFileButton).toBeVisible();
  }
}

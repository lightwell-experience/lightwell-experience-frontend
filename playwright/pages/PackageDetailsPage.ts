import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Page object for package details.
 */
export class PackageDetailsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get header(): Locator {
    return this.page
      .getByRole('heading')
      .and(this.page.getByTestId('lightwell-package-details-header'));
  }

  get tabs(): Locator {
    return this.page.getByTestId('lightwell-package-detail-tabs');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.header).toBeVisible();
    await expect(this.tabs).toBeVisible();
  }
}

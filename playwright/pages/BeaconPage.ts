import { expect, type Locator, type Page } from '@playwright/test';

import { closeGenericPopupsIfExist } from '../helpers/popups';

/**
 * Page object for Beacon.
 */
export class BeaconPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get heading(): Locator {
    return this.page.getByRole('heading').and(this.page.getByTestId('lightwell-beacon-header'));
  }

  get notFoundHeading(): Locator {
    return this.page.getByRole('heading', { name: "We couldn't find that page" });
  }

  get customerSelectToggle(): Locator {
    return this.page.getByTestId('customer-id-select-toggle');
  }

  get table(): Locator {
    return this.page.getByRole('grid', { name: 'Vulnerability tracking table' });
  }

  async goto(): Promise<void> {
    await closeGenericPopupsIfExist(this.page);
    await this.page.goto('/lightwell/beacon');
  }

  async expectDenied(): Promise<void> {
    await expect(this.notFoundHeading).toBeVisible();
    await expect(this.heading).toHaveCount(0);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toContainText('Beacon');
  }
  async selectCustomer(): Promise<void> {
    await this.page.getByRole('button', { name: 'Select customer ID' }).click();
    await this.page.getByRole('menuitem').first().click();
  }

  async expectTableHasContent(): Promise<void> {
    await expect(this.table).toBeVisible();
    // Header row + at least one data row
    await expect(this.table.getByRole('row').nth(1)).toBeVisible();
  }
}

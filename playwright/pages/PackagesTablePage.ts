import { expect, type Locator, type Page } from '@playwright/test';

import { closeGenericPopupsIfExist } from '../helpers/popups';

/**
 * Page object for packages table.
 */
export class PackagesPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get header(): Locator {
    return this.page.getByRole('heading').and(this.page.getByTestId('lightwell-packages-header'));
  }

  get table(): Locator {
    return this.page.getByRole('grid', { name: 'Lightwell packages table' });
  }

  get filter(): Locator {
    return this.page.getByLabel(/Filter by name/);
  }

  async goto(repoSlug: string): Promise<void> {
    await closeGenericPopupsIfExist(this.page);
    await this.page.goto(`/lightwell/${repoSlug}`);
  }

  async expectLoaded(repoTitle: string): Promise<void> {
    await expect(this.header).toContainText(repoTitle);
    await expect(this.table).toBeVisible();
  }

  firstPackageLink(): Locator {
    return this.table.locator('tbody tr').first().getByRole('button').first();
  }

  async searchFor(term: string): Promise<void> {
    await this.filter.fill(term);
  }

  async clearSearch(): Promise<void> {
    await this.filter.clear();
  }

  async expectPackageVisible(name: string): Promise<void> {
    await expect(this.table.getByRole('button', { name, exact: true })).toBeVisible({
      timeout: 15_000,
    });
  }

  async openFirstPackage(): Promise<string> {
    const link = this.firstPackageLink();
    await expect(link).toBeVisible();
    const name = (await link.innerText()).trim();
    await link.click();
    return name;
  }
}

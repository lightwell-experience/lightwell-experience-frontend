import { expect, type Locator, type Page } from '@playwright/test';

import { closeGenericPopupsIfExist } from '../helpers/popups';

/**
 * Page object for repositories table.
 */
export class RepositoriesPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Repositories' });
  }

  get table(): Locator {
    return this.page.getByRole('grid', { name: 'Lightwell repositories table' });
  }

  async goto(): Promise<void> {
    await closeGenericPopupsIfExist(this.page);
    await this.page.goto('/lightwell');
    await expect(this.heading).toBeVisible();
  }

  repoLink(title: string): Locator {
    return this.table.getByRole('button', { name: title, exact: true });
  }

  async openRepository(title: string): Promise<void> {
    await expect(this.table).toBeVisible();
    await expect(this.repoLink(title)).toBeVisible();
    await this.repoLink(title).click();
  }
}

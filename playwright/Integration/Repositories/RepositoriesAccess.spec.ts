/**
 * Repositories access: Network and Clearinghouse users can access all repos; Academic users cannot access Predisclosure.
 * All Lightwell users can navigate repositories > packages > package details.
 */

import { expect, test, type Page } from '@playwright/test';

import { users } from '../../helpers/auth';
import { PackageDetailsPage } from '../../pages/PackageDetailsPage';
import { PackagesPage } from '../../pages/PackagesTablePage';
import { RepositoriesPage } from '../../pages/RepositoriesTablePage';

const ALL_REPOS = [
  'Java Predisclosure',
  'Java Remediated',
  'Java Validated',
  'Python Remediated',
  'Python Validated',
] as const;

const PREDISCLOSURE_REPOS = ALL_REPOS.filter((title) => title.includes('Predisclosure'));
const REPO_TITLE = 'Java Validated';

const navigateToPackageDetails = async (page: Page) => {
  const repositoriesPage = new RepositoriesPage(page);
  const packagesPage = new PackagesPage(page);
  const packageDetailsPage = new PackageDetailsPage(page);

  await repositoriesPage.goto();
  await repositoriesPage.openRepository(REPO_TITLE);
  await packagesPage.expectLoaded(REPO_TITLE);

  const packageName = await packagesPage.openFirstPackage();
  await packageDetailsPage.expectLoaded();
  await expect(packageDetailsPage.header).toContainText(packageName);
};

test.describe('Repositories access', () => {
  for (const { name, storageState } of users.filter((u) => u.key !== 'academic')) {
    test.describe(name, () => {
      test.use({ storageState });

      test(`${name} user can access all repositories`, async ({ page }) => {
        const repositoriesPage = new RepositoriesPage(page);
        await repositoriesPage.goto();

        for (const title of ALL_REPOS) {
          await expect(repositoriesPage.repoLink(title)).toBeVisible();
        }
      });

      test(`${name} user can navigate repositories to package details`, async ({ page }) => {
        await navigateToPackageDetails(page);
      });
    });
  }

  const academic = users.find((u) => u.key === 'academic')!;

  test.describe(academic.name, () => {
    test.use({ storageState: academic.storageState });

    test('Academic user cannot access predisclosure repositories', async ({ page }) => {
      const repositoriesPage = new RepositoriesPage(page);
      await repositoriesPage.goto();

      for (const title of PREDISCLOSURE_REPOS) {
        await expect(repositoriesPage.repoLink(title)).toHaveCount(0);
      }
    });

    test('Academic user can navigate repositories to package details', async ({ page }) => {
      await navigateToPackageDetails(page);
    });
  });
});

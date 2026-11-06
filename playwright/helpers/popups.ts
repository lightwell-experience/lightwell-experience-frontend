import type { Page } from '@playwright/test';

/** Block TrustArc/consent scripts so overlays don't intercept clicks. */
const blockConsentOverlays = async (page: Page) => {
  await page.route('https://consent.trustarc.com/**', (route) => route.abort());
  await page.route('https://consent-pref.trustarc.com/**', (route) => route.abort());
};

/** Register handlers that dismiss common Chrome/consent overlays during a test. */
export const closeGenericPopupsIfExist = async (page: Page) => {
  await blockConsentOverlays(page);

  const locatorsToCheck = [
    page.locator(`.amplitude-engagement-close`),
    page.locator(`button[id="truste-consent-button"]`),
    page
      .locator('iframe[name="trustarc_cm"]')
      .contentFrame()
      .getByRole('button', { name: 'Agree and proceed with' }),
  ];

  for (const locator of locatorsToCheck) {
    await page.addLocatorHandler(locator, async () => {
      try {
        await locator.first().click({ timeout: 10_000, noWaitAfter: true });
      } catch {
        return;
      }
    });
  }
};

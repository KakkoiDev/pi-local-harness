// Recipe offline-phone (offline half): cut the browser's connection and check what the person sees.
// context.setOffline(true) makes navigator.onLine false and fires `offline`; setOffline(false) brings it back.
import { expect, test } from '../fixtures.js';

test('going offline shows the banner and disables Add', async ({ signedInPage: page }) => {
  const banner = page.getByRole('status').filter({ hasText: 'offline' });
  await expect(banner).toBeHidden();

  await page.context().setOffline(true);

  await expect(banner).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add' })).toBeDisabled();
});

test('coming back online hides the banner', async ({ signedInPage: page }) => {
  await page.context().setOffline(true);
  await expect(page.getByRole('button', { name: 'Add' })).toBeDisabled();

  await page.context().setOffline(false);

  await expect(page.getByRole('status').filter({ hasText: 'offline' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Add' })).toBeEnabled();
});

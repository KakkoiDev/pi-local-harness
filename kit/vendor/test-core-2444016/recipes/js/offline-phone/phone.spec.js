// Recipe offline-phone (phone half): the same app at a phone's size, with touch. test.use() applies to this file.
import { expect, test } from '../fixtures.js';

test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });

test('nothing scrolls sideways on a phone', async ({ signedInPage: page }) => {
  await page.getByLabel('New task').fill('A rather long task title that has to wrap on a narrow phone screen');
  await page.getByRole('button', { name: 'Add' }).tap();
  await expect(page.locator('#count')).toHaveText('1 task');

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

  expect(overflow).toBeLessThanOrEqual(0);
});

test('the main action is on screen and tappable', async ({ signedInPage: page }) => {
  const add = page.getByRole('button', { name: 'Add' });

  await expect(add).toBeInViewport();
  expect((await add.boundingBox()).height).toBeGreaterThanOrEqual(44); // a finger-sized target
});

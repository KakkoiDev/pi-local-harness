// Recipe fixtures: start a test already signed in and with sample data, from fixtures in ../fixtures.js.
// signedInPage signs in through the API (one request), not the form. sampleTasks adds records made with the builders.
import { expect, test } from '../fixtures.js';

test('a signed-in page opens on the tasks', async ({ signedInPage: page }) => {
  await expect(page.getByLabel('New task')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeHidden();
});

test('sample tasks are listed', async ({ signedInPage: page, sampleTasks }) => {
  const items = page.getByRole('list', { name: 'Tasks' }).getByRole('listitem');

  await expect(items).toContainText(sampleTasks.map((task) => task.title));
  await expect(page.locator('#count')).toHaveText('3 tasks');
});

test('each test starts with no tasks', async ({ signedInPage: page }) => {
  await expect(page.locator('#count')).toHaveText('0 tasks');
});

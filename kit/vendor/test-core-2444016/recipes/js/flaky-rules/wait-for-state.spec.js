// Recipe flaky-rules: wait for the state, never for time. Each test shows one way to wait.
// `python3 tools/flaky_lint.py <tests>` finds sleeps, fixed waits, focused tests, network-idle waits and real hosts.
import { expect, test } from '../fixtures.js';

test('expect retries until the text is there', async ({ signedInPage: page }) => {
  await page.getByLabel('New task').fill('Buy milk');
  await page.getByRole('button', { name: 'Add' }).click();

  // expect() retries until the count changes (default up to 5 s): no wait before it.
  await expect(page.locator('#count')).toHaveText('1 task');
});

test('wait for the response the action causes', async ({ signedInPage: page }) => {
  await page.getByLabel('New task').fill('Buy milk');

  const response = page.waitForResponse((r) => r.url().endsWith('/api/tasks') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Add' }).click();

  expect((await response).status()).toBe(201);
});

test('poll a value that is not on the page', async ({ signedInPage: page, appURL }) => {
  await page.getByLabel('New task').fill('Buy milk');
  await page.getByRole('button', { name: 'Add' }).click();

  // expect.poll retries the function until the value matches: here, what the server stored.
  await expect.poll(async () => (await (await page.request.get(`${appURL}/api/tasks`)).json()).length).toBe(1);
});

test('each test starts from its own data', async ({ signedInPage: page }) => {
  // appURL gives every test a fresh database: no test depends on another having run first.
  await expect(page.locator('#count')).toHaveText('0 tasks');
});

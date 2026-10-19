// Shared Playwright fixtures for the JavaScript recipes. Copy next to your specs and import { test, expect } from it.
//
// - appURL: the sample app on its own temporary database and a free port, fresh for every test.
// - context: refuses every request that leaves 127.0.0.1, so a forgotten stub fails instead of reaching the network.
// - signedInPage: a page already signed in (logged-in state), through the API, not the form.
// - sampleTasks: three tasks made with the builders (sample data).
// The browser flags (--use-mock-keychain, --password-store=basic) are in playwright.config.js.
import { test as base, expect } from '@playwright/test';
import { createApp, TEST_USERS } from '../../sample_app/server.js'; // replace with your app's start function
import { aTask } from './data-builders/builders.js';

const LOCAL = new Set(['127.0.0.1', 'localhost', '[::1]']);
export const [TEST_EMAIL, TEST_PASSWORD] = Object.entries(TEST_USERS)[0];

export const test = base.extend({
  context: async ({ context }, use) => {
    await context.route('**/*', (route) =>
      LOCAL.has(new URL(route.request().url()).hostname) ? route.fallback() : route.abort('internetdisconnected'));
    await use(context);
  },
  appURL: async ({}, use, testInfo) => {
    const app = await createApp({ dbPath: testInfo.outputPath('test.sqlite3') }).start();
    await use(app.url);
    await app.close();
  },
  signedInPage: async ({ page, appURL }, use) => {
    const response = await page.request.post(`${appURL}/api/login`, { data: { email: TEST_EMAIL, password: TEST_PASSWORD } });
    expect(response.ok()).toBe(true);
    await page.goto(appURL);
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible(); // wait for the state, not for time
    await use(page);
  },
  sampleTasks: async ({ signedInPage: page, appURL }, use) => {
    const tasks = [aTask({ title: 'Buy milk' }), aTask({ title: 'Call the dentist' }), aTask({ title: '牛乳を買う' })];
    for (const task of tasks) expect((await page.request.post(`${appURL}/api/tasks`, { data: { title: task.title } })).ok()).toBe(true);
    await page.reload();
    await expect(page.getByRole('listitem')).toHaveCount(tasks.length);
    await use(tasks);
  },
});

export { expect };

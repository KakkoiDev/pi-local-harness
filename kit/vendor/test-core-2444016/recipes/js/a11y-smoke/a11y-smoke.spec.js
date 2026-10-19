// Recipe a11y-smoke: every page state a person sees passes the smoke check, and the keyboard reaches the controls.
import { expect, test } from '../fixtures.js';
import { a11yProblems, tabUntil } from './a11y-smoke.js';

test('the sign-in page passes', async ({ page, appURL }) => {
  await page.goto(appURL);
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');

  expect(await a11yProblems(page)).toEqual([]);
});

test('the task list passes in both languages', async ({ signedInPage: page }) => {
  await page.getByLabel('New task').fill('Buy milk');
  await page.getByRole('button', { name: 'Add' }).click();
  await expect(page.getByRole('listitem')).toHaveCount(1);
  expect(await a11yProblems(page)).toEqual([]);

  await page.getByRole('button', { name: '日本語' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
  expect(await a11yProblems(page)).toEqual([]);
});

test('the keyboard reaches Sign in in order', async ({ page, appURL }) => {
  await page.goto(appURL);
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await tabUntil(page, page.getByLabel('Email'));

  expect(await tabUntil(page, page.getByRole('button', { name: 'Sign in' }))).toBe(2); // Email -> Password -> Sign in
});

test('the check finds real problems', async ({ page }) => {
  await page.setContent('<h1>One</h1><h1>Two</h1><input id="x"><button id="x"><svg></svg></button>' +
    '<img src="cat.png"><a href="/" tabindex="2">Home</a>');

  const problems = (await a11yProblems(page)).join('\n');

  for (const expected of ['no lang', 'exactly one visible <h1>, found 2', '<input id="x"> has no accessible name',
    '<button id="x"> has no accessible name', 'no alt', 'positive tabindex', 'id "x" is used more than once']) {
    expect(problems).toContain(expected);
  }
});

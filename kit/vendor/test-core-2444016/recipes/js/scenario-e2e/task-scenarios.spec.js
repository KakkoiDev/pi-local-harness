// Recipe scenario-e2e: each Given/When/Then scenario of a task is one e2e test whose title is the scenario's title.
// The scenarios: recipes/shared/task-example.md. Started from `python3 tools/scenarios.py skeleton TASK.md --lang js`;
// `python3 tools/scenarios.py check TASK.md --tests <this file>` proves every scenario has its test.
// Given = Arrange, When = Act, Then = Assert.
import { expect, test } from '../fixtures.js';

async function addTask(page, title) {
  await page.getByLabel('New task').fill(title);
  await page.getByRole('button', { name: 'Add' }).click();
}

test('Add a task', async ({ signedInPage: page }) => {
  // Given I am signed in with an empty list
  await expect(page.getByRole('listitem')).toHaveCount(0);
  // When I add the task "Buy milk"
  await addTask(page, 'Buy milk');
  // Then I see "Buy milk" in the list
  await expect(page.getByRole('list', { name: 'Tasks' }).getByRole('listitem').filter({ hasText: 'Buy milk' })).toBeVisible();
  // And the count says "1 task"
  await expect(page.locator('#count')).toHaveText('1 task');
});

test('Delete a task', async ({ signedInPage: page }) => {
  // Given I am signed in with the task "Buy milk"
  await addTask(page, 'Buy milk');
  const row = page.getByRole('listitem').filter({ hasText: 'Buy milk' });
  await expect(row).toBeVisible();
  // When I delete "Buy milk"
  await row.getByRole('button', { name: 'Delete' }).click();
  // Then the list is empty
  await expect(page.getByRole('listitem')).toHaveCount(0);
  // And the count says "0 tasks"
  await expect(page.locator('#count')).toHaveText('0 tasks');
});

test('An empty title is not added', async ({ signedInPage: page }) => {
  // Given I am signed in with an empty list
  await expect(page.getByRole('listitem')).toHaveCount(0);
  // When I add a task with an empty title (spaces pass the browser's `required`, the server refuses them)
  const response = page.waitForResponse('**/api/tasks');
  await addTask(page, '   ');
  expect((await response).status()).toBe(422);
  // Then the list is still empty
  await expect(page.getByRole('listitem')).toHaveCount(0);
});

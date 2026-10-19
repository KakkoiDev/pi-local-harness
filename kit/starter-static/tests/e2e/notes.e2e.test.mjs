// The app in a real browser: one test per scenario in SCENARIOS.md, named exactly after its title (Pi Workbench and
// tests/protocol.test.mjs check the names). Given = arrange, When = act as the person does, Then = check what the person
// sees. The app's files and the browser come from ./browser.mjs; with no Playwright or no browser set up, these tests are
// skipped and say so (nothing is downloaded). Run: node --test 'tests/e2e/*.e2e.test.mjs'   (build static/app.css first)
// Find controls the way a person does: getByRole with the name, getByLabel; data-testid only where nothing else fits.
// Wait for what the person sees (waitFor), never for time.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { a11yProblems, newPage, open, serve, startBrowser } from './browser.mjs';
// Where an App Block's test block fits, use it: test-core's EditForm block knows a labelled field and its error.
import { EditForm } from '../../test-core/functional/blocks/js/EditForm.js';

const started = await startBrowser();
const skip = started.skip ?? false;
let app;
before(async () => { if (started.chromium) app = await serve(); });
after(async () => { await started.chromium?.close(); app?.close(); });

/** Each test gets its own page (its own storage) and closes it, whatever happens. */
async function withPage(body) {
  const page = await newPage(started.chromium);
  try { await body(page); } finally { await page.context().close(); }
}

async function addNote(page, title) {
  await page.getByLabel('New note').fill(title);
  await page.getByRole('button', { name: 'Add Note' }).click();
}

test('Add a note and see it in the list', { skip }, () => withPage(async page => {
  // Given the notes page with no notes
  await open(page, app.base);
  // When I write "buy milk" in New note and press Add Note
  await addNote(page, 'buy milk');
  // Then "buy milk" is in the list
  await page.getByRole('listitem').filter({ hasText: 'buy milk' }).waitFor();
  assert.equal(await page.getByRole('listitem').count(), 1);
}));

test('Delete a note and it leaves the list', { skip }, () => withPage(async page => {
  // Given the note "buy milk" in the list
  await open(page, app.base);
  await addNote(page, 'buy milk');
  const row = page.getByRole('listitem').filter({ hasText: 'buy milk' });
  await row.waitFor();
  // When I press its Delete button and confirm
  page.once('dialog', dialog => dialog.accept());
  await row.getByRole('button', { name: 'Delete' }).click();
  // Then the list has no notes
  await row.waitFor({ state: 'detached' });
  assert.equal(await page.getByRole('listitem').count(), 0);
}));

test('An empty note is not added and says why', { skip }, () => withPage(async page => {
  // Given the notes page with no notes
  await open(page, app.base);
  // When I press Add Note with nothing written
  await page.getByRole('button', { name: 'Add Note' }).click();
  // Then the page says "Write something first." and the list has no notes (EditForm: the field shows the error)
  const field = await new EditForm(page, app.base).field('New note');
  await page.waitForFunction(() => document.querySelector('#title')?.getAttribute('aria-invalid') === 'true');
  assert.equal(await field.evaluate(element => element.getAttribute('aria-describedby')), 'title-error');
  await page.getByText('Write something first.').waitFor();
  assert.equal(await page.getByRole('listitem').count(), 0);
}));

test('Switch the page to Japanese and back to English', { skip }, () => withPage(async page => {
  // Given the notes page in English
  await open(page, app.base);
  await page.getByRole('heading', { name: 'Notes' }).waitFor();
  // When I press 日本語
  await page.getByRole('button', { name: '日本語' }).click();
  // Then the heading says メモ, and pressing English brings back Notes
  await page.getByRole('heading', { name: 'メモ' }).waitFor();
  await page.getByRole('button', { name: 'English' }).click();
  await page.getByRole('heading', { name: 'Notes' }).waitFor();
}));

test('Save a backup and restore it', { skip }, () => withPage(async page => {
  // Given the note "buy milk" in the list
  await open(page, app.base);
  await addNote(page, 'buy milk');
  const row = page.getByRole('listitem').filter({ hasText: 'buy milk' });
  await row.waitFor();
  // When I press Save a Backup, delete the note, and restore the backup file
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save a Backup' }).click();
  const file = await (await download).path();
  page.once('dialog', dialog => dialog.accept());
  await row.getByRole('button', { name: 'Delete' }).click();
  await row.waitFor({ state: 'detached' });
  await page.getByLabel('Restore a Backup…').setInputFiles(file);
  // Then "buy milk" is back in the list
  await row.waitFor();
  assert.equal(await page.getByRole('listitem').count(), 1);
}));

test('The notes page passes the accessibility smoke check', { skip }, () => withPage(async page => {
  // Given the notes page with one note
  await open(page, app.base);
  await addNote(page, 'buy milk');
  await page.getByRole('listitem').filter({ hasText: 'buy milk' }).waitFor();
  // When the accessibility smoke check reads the page; Then it finds no problem
  assert.deepEqual(await a11yProblems(page), []);
}));

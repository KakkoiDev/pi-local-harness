// Recipe scenario-steps: the steps of recipes/shared/task-example.md, one function per level, all from primitives.
// The vocabulary is recipes/shared/task-example.vocab.json (`python3 tools/vocab.py check TASK.md --vocab ...`
// refuses any other step). Each phrase has a unit function (the pure task list, sample_app/static/tasks.js), an
// integration function (the routes of the app on port 0) and an e2e function (the page, in a browser).
import { Registry } from '../../../functional/js/index.js';
import { click, control, expectCount, expectText, expectVisible, fill, goto, httpClient, tempDatabase } from '../../../functional/js/primitives.js';
import { TEST_USERS, createApp } from '../../../sample_app/server.js'; // replace with your app
import { addTask, countText, deleteTask } from '../../../sample_app/static/tasks.js';

const [EMAIL, PASSWORD] = Object.entries(TEST_USERS)[0];
export const steps = new Registry();
const unit = { level: 'unit' };
const integration = { level: 'integration' };
const e2e = { level: 'e2e' };

// ---------------------------------------------------------------- unit: the pure task list

steps.step('Given I am signed in with an empty list', (world) => { world.tasks = []; }, unit);
steps.step('Given I am signed in with the task {title}', (world, { title }) => { world.tasks = addTask([], title); }, unit);
steps.step('When I add the task {title}', (world, { title }) => { world.tasks = addTask(world.tasks, title); }, unit);
steps.step('When I add a task with an empty title', (world) => {
  try { world.tasks = addTask(world.tasks, ''); } catch (error) { world.error = error.message; }
}, unit);
steps.step('When I delete {title}', (world, { title }) => { world.tasks = deleteTask(world.tasks, title); }, unit);
steps.step('Then I see {title} in the list', (world, { title }) => expectText(world.tasks.map((t) => t.title).join(' | '), title), unit);
steps.step('Then the count says {text}', (world, { text }) => expectText(countText(world.tasks.length), text, { exact: true }), unit);
const unitEmpty = (world) => expectCount(world.tasks, 0);
steps.step('Then the list is empty', unitEmpty, unit);
steps.step('Then the list is still empty', unitEmpty, unit);

// ---------------------------------------------------------------- integration: the routes
// The world brings `folder` (a temporary folder) and `cleanups` (run by the test after the scenario).

async function apiTitles(world) {
  const response = await world.client.get('/api/tasks');
  if (!response.ok) throw new Error(response.text);
  return response.json.map((task) => task.title);
}

async function apiSignedIn(world) {
  const app = await createApp({ dbPath: await tempDatabase(world.folder) }).start();
  world.cleanups.push(() => app.close());
  world.client = httpClient(app.url);
  const response = await world.client.post('/api/login', { email: EMAIL, password: PASSWORD });
  if (!response.ok) throw new Error(response.text);
}
const apiAdd = async (world, { title }) => { world.response = await world.client.post('/api/tasks', { title }); };

steps.step('Given I am signed in with an empty list', apiSignedIn, integration);
steps.step('Given I am signed in with the task {title}', async (world, values) => { await apiSignedIn(world); await apiAdd(world, values); }, integration);
steps.step('When I add the task {title}', apiAdd, integration);
steps.step('When I add a task with an empty title', async (world) => {
  await apiAdd(world, { title: '' });
  if (world.response.status !== 422) throw new Error(`expected 422, got ${world.response.status}`);
}, integration);
steps.step('When I delete {title}', async (world, { title }) => {
  const task = (await world.client.get('/api/tasks')).json.find((t) => t.title === title);
  const response = await world.client.delete(`/api/tasks/${task.id}`);
  if (response.status !== 204) throw new Error(`expected 204, got ${response.status}`);
}, integration);
steps.step('Then I see {title} in the list', async (world, { title }) => expectText(await apiTitles(world), title), integration);
steps.step('Then the count says {text}', async (world, { text }) => expectText(countText((await apiTitles(world)).length), text, { exact: true }), integration);
const apiEmpty = async (world) => expectCount(await apiTitles(world), 0);
steps.step('Then the list is empty', apiEmpty, integration);
steps.step('Then the list is still empty', apiEmpty, integration);

// ---------------------------------------------------------------- e2e: the page in a browser

const row = async (world, title) => (await control(world.page, { role: 'list', name: 'Tasks' })).getByRole('listitem').filter({ hasText: title });

async function pageSignedIn(world) {
  const response = await world.page.request.post(`${world.baseURL}/api/login`, { data: { email: EMAIL, password: PASSWORD } });
  if (!response.ok()) throw new Error(await response.text());
  await goto(world.page, world.baseURL);
  await expectVisible(await control(world.page, { role: 'button', name: 'Sign out' })); // the state, not a time
}
async function pageAdd(world, { title }) {
  await fill(await control(world.page, { label: 'New task' }), title);
  await click(await control(world.page, { role: 'button', name: 'Add' }));
}

steps.step('Given I am signed in with an empty list', pageSignedIn, e2e);
steps.step('Given I am signed in with the task {title}', async (world, values) => {
  await pageSignedIn(world);
  await pageAdd(world, values);
  await expectVisible(await row(world, values.title));
}, e2e);
steps.step('When I add the task {title}', pageAdd, e2e);
steps.step('When I add a task with an empty title', (world) => pageAdd(world, { title: '' }), e2e);
steps.step('When I delete {title}', async (world, { title }) => click(await control(await row(world, title), { role: 'button', name: 'Delete' })), e2e);
steps.step('Then I see {title} in the list', async (world, { title }) => expectVisible(await row(world, title)), e2e);
steps.step('Then the count says {text}', async (world, { text }) => expectText(await control(world.page, { css: '#count' }), text, { exact: true }), e2e);
const pageEmpty = async (world) => expectCount((await control(world.page, { role: 'list', name: 'Tasks' })).getByRole('listitem'), 0);
steps.step('Then the list is empty', pageEmpty, e2e);
steps.step('Then the list is still empty', pageEmpty, e2e);

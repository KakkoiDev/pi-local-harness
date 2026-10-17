// Task 263: the data folder, and the guard that keeps tests out of the person's own (review item 15).
import { homedir } from 'node:os';
import { join } from 'node:path';

export function defaultDataFolder(home = homedir()) { return join(home, 'pi-local-harness-data'); }

// PI_AGENT_DATA, else ~/pi-local-harness-data. Under `node --test` (NODE_TEST_CONTEXT) the default is refused: a test that
// forgets PI_AGENT_DATA fails here instead of writing report and decision rows into the person's folder.
export function dataFolder(env = process.env, home = homedir()) {
  if (env.PI_AGENT_DATA) return env.PI_AGENT_DATA;
  if (env.NODE_TEST_CONTEXT) throw new Error(`Tests must not use the person's data folder (${defaultDataFolder(home)}): set PI_AGENT_DATA to a temporary folder.`);
  return defaultDataFolder(home);
}

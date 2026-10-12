import { realpathSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export default async function (pi) {
  // Resolve the installed symlink before locating implementation files.
  const source = realpathSync(fileURLToPath(import.meta.url));
  const implementation = pathToFileURL(resolve(dirname(source), '../../harness/extension.mjs')).href;
  const { default: harness } = await import(implementation);
  harness(pi);
}

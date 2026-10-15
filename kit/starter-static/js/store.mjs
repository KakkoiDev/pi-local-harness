// The data: one IndexedDB database in this browser. It stays on this device; a backup is a file (export/import).

/** @typedef {import('./logic/notes.mjs').Note} Note */

/**
 * @param {string} name
 * @returns {Promise<{ all: () => Promise<Note[]>, put: (note: Note) => Promise<void>, remove: (id: string) => Promise<void> }>}
 */
export async function openStore(name) {
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('notes', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  /**
   * @template T
   * @param {IDBTransactionMode} mode
   * @param {(notes: IDBObjectStore) => IDBRequest<T>} act
   * @returns {Promise<T>}
   */
  const run = (mode, act) => new Promise((resolve, reject) => {
    const request = act(/** @type {IDBDatabase} */ (db).transaction('notes', mode).objectStore('notes'));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return {
    all: () => run('readonly', notes => notes.getAll()),
    put: async note => { await run('readwrite', notes => notes.put(note)); },
    remove: async id => { await run('readwrite', notes => notes.delete(id)); },
  };
}

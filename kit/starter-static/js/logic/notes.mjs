// The notes' rules, as pure functions: data in, data out. No DOM, storage, clock or randomness here (the harness checks).

export const MAX_TITLE = 120;

/** @typedef {{ id: string, title: string, created: string }} Note */
/** @typedef {{ field: string, key: string }} Problem */

/**
 * The title as it will be saved, and what is wrong with it (nothing when it is fine).
 * @param {string} title
 * @returns {{ title: string, problems: Problem[] }}
 */
export function checkTitle(title) {
  const clean = title.split(/\s+/).filter(Boolean).join(' ');
  if (!clean) return { title: clean, problems: [{ field: 'title', key: 'error.title_empty' }] };
  if (clean.length > MAX_TITLE) return { title: clean, problems: [{ field: 'title', key: 'error.title_long' }] };
  return { title: clean, problems: [] };
}

/**
 * Newest first.
 * @param {Note[]} notes
 * @returns {Note[]}
 */
export function newestFirst(notes) {
  return [...notes].sort((a, b) => b.created.localeCompare(a.created) || b.id.localeCompare(a.id));
}

/**
 * A backup file's notes, checked: only well-formed notes come back.
 * @param {unknown} data
 * @returns {Note[]}
 */
export function notesFromBackup(data) {
  const list = data && typeof data === 'object' && 'notes' in data && Array.isArray(data.notes) ? data.notes : [];
  return list.filter(/** @returns {item is Note} */ item => Boolean(item) && typeof item.id === 'string' && typeof item.title === 'string' && typeof item.created === 'string');
}

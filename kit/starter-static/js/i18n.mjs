// Every visible string goes through t(key): messages/en.json and messages/ja.json have the same keys (the harness checks).

export const LANGUAGES = ['en', 'ja'];

/**
 * The person's choice (saved), else the browser's first known language, else English.
 * @param {string | null} saved
 * @param {readonly string[]} browser
 * @returns {string}
 */
export function choose(saved, browser) {
  if (saved && LANGUAGES.includes(saved)) return saved;
  return browser.map(code => code.slice(0, 2).toLowerCase()).find(code => LANGUAGES.includes(code)) ?? 'en';
}

/**
 * @param {Record<string, string>} messages
 * @param {Record<string, string>} english
 * @param {string} key
 * @returns {string}
 */
export function translate(messages, english, key) {
  return messages[key] ?? english[key] ?? key;
}

/**
 * @param {string} language
 * @returns {Promise<Record<string, string>>}
 */
export async function load(language) {
  const response = await fetch(`messages/${language}.json`);
  return /** @type {Record<string, string>} */ (await response.json());
}

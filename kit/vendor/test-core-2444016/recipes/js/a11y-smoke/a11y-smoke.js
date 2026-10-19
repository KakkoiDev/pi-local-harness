// Accessibility smoke check for a Playwright page. Copy with recipes/shared/a11y-smoke.js (the check itself).
import { readFileSync } from 'node:fs';

const CHECK = readFileSync(new URL('../../shared/a11y-smoke.js', import.meta.url), 'utf8');

/** Problems on the page as it is now: missing names, labels, alt, lang, one h1, tab order, duplicate ids. */
export const a11yProblems = (page) => page.evaluate(`(${CHECK.replace(/^\s*\/\/.*$/gm, '').trim()})()`);

/** Press Tab until `locator` has focus; return how many presses it took. Throws if it is never reached. */
export async function tabUntil(page, locator, limit = 30) {
  for (let presses = 1; presses <= limit; presses++) {
    await page.keyboard.press('Tab');
    if (await locator.evaluate((el) => el === document.activeElement)) return presses;
  }
  throw new Error(`${locator} was not reached with ${limit} Tab presses`);
}

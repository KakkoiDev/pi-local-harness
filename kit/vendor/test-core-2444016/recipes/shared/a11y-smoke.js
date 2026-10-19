// Accessibility smoke check, run inside the page: returns a list of problems (empty = passed).
// Used as is by recipes/python/a11y-smoke/a11y_smoke.py and recipes/js/a11y-smoke/a11y-smoke.js. Not a full audit:
// it catches what small models most often break (missing names, labels, alt, lang, headings, tab order, duplicate ids).
() => {
  const problems = [];
  const visible = (el) => el.checkVisibility ? el.checkVisibility() : el.offsetParent !== null;
  const text = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim();
  const describe = (el) => `<${el.tagName.toLowerCase()}${el.id ? ` id="${el.id}"` : ''}${el.name ? ` name="${el.name}"` : ''}>`;
  const labelledBy = (el) => (el.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean)
    .map((id) => document.getElementById(id)).filter(Boolean).map(text).join(' ').trim();
  const imageNames = (el) => [...el.querySelectorAll('img[alt], svg[aria-label]')]
    .map((img) => img.getAttribute('alt') || img.getAttribute('aria-label')).join(' ').trim();
  const name = (el) => (el.getAttribute('aria-label') || '').trim() || labelledBy(el) ||
    [...(el.labels || [])].map(text).join(' ').trim() || (['BUTTON', 'A', 'SUMMARY'].includes(el.tagName) ? text(el) || imageNames(el) : '') ||
    (el.getAttribute('title') || '').trim() || (el.tagName === 'INPUT' && ['submit', 'button', 'reset'].includes(el.type) ? el.value : '');

  if (!document.documentElement.lang) problems.push('<html> has no lang attribute');
  const h1 = [...document.querySelectorAll('h1')].filter(visible);
  if (h1.length !== 1) problems.push(`expected exactly one visible <h1>, found ${h1.length}`);
  const controls = 'button, a[href], input:not([type=hidden]), select, textarea, summary, [role=button], [role=link], [role=checkbox], [role=tab], [role=menuitem], [role=switch]';
  for (const el of document.querySelectorAll(controls)) {
    if (visible(el) && !name(el)) problems.push(`${describe(el)} has no accessible name (label, text or aria-label)`);
  }
  for (const img of document.querySelectorAll('img')) {
    if (!img.hasAttribute('alt')) problems.push(`${describe(img)} src="${img.getAttribute('src')}" has no alt (use alt="" if decorative)`);
  }
  for (const el of document.querySelectorAll('[tabindex]')) {
    if (Number(el.getAttribute('tabindex')) > 0) problems.push(`${describe(el)} has a positive tabindex; keep the page order`);
  }
  const seen = new Set();
  for (const el of document.querySelectorAll('[id]')) {
    if (seen.has(el.id)) problems.push(`id "${el.id}" is used more than once`);
    seen.add(el.id);
  }
  return problems;
}

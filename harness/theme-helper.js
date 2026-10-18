// Task 312: the theme panel's live link into the Preview. The Preview's proxy (harness/preview.py) adds this one script
// to the app's pages. It takes messages only from the workbench page that holds the Preview (the workbench's origin and
// the parent window), keeps only the theme's token names with plain values, and sets them on <html>; nothing else.
(() => {
  const ORIGINS = __ORIGINS__, TOKENS = new Set(__TOKENS__);
  const root = document.documentElement;
  let values = { light: {}, dark: {}, both: {} }, set = new Set(), heading = null;
  const plain = value => typeof value === 'string' && value.length <= 200 && !/[;{}<>\\]|url\(|\/\*/i.test(value);
  const dark = () => root.classList.contains('dark');
  function clean(map) {
    const kept = {};
    if (map && typeof map === 'object') for (const [token, value] of Object.entries(map)) if (TOKENS.has(token) && plain(value)) kept[token] = value;
    return kept;
  }
  function apply() {
    const chosen = { ...values.both, ...(dark() ? values.dark : values.light) };
    for (const token of set) if (!(token in chosen)) root.style.removeProperty('--' + token);
    for (const [token, value] of Object.entries(chosen)) root.style.setProperty('--' + token, value);
    set = new Set(Object.keys(chosen));
    // A heading font needs the one rule the saved theme block carries too (harness/theme.py HEADING_RULE).
    if (chosen['font-heading'] && !heading) { heading = document.createElement('style'); heading.textContent = ':where(h1, h2, h3, h4, h5, h6) { font-family: var(--font-heading); }'; document.head.append(heading); }
    else if (!chosen['font-heading'] && heading) { heading.remove(); heading = null; }
  }
  function tell() { if (parent !== window) for (const origin of ORIGINS) parent.postMessage({ type: 'pi-theme-ready', dark: dark() }, origin); }
  addEventListener('message', event => {
    if (parent === window || event.source !== parent || !ORIGINS.includes(event.origin)) return;
    const data = event.data;
    if (!data || data.type !== 'pi-theme') return;
    values = { light: clean(data.light), dark: clean(data.dark), both: clean(data.both) };
    apply();
  });
  new MutationObserver(() => { apply(); tell(); }).observe(root, { attributes: true, attributeFilter: ['class'] });
  tell();
})();

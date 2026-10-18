// js/infinite.mjs: automatic loading = clicking Load More when the sentinel shows (only for browse feeds)
export function autoLoad(sentinel) {
  let busy = false, loads = 0;
  new IntersectionObserver(async ([e]) => {
    const button = document.querySelector('#feed-more button');      // the block is replaced after each page
    if (!e.isIntersecting || busy || !button || loads >= 5) return;  // after 5 automatic pages, wait for a click
    busy = true; loads++; button.click(); setTimeout(() => (busy = false), 500);
  }, {rootMargin: '400px'}).observe(sentinel);
}

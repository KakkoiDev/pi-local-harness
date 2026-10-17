import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGuides, chooseGuides } from '../../harness/guides.mjs';

const guides = loadGuides(new URL('../../harness/guides/', import.meta.url));

test('every guide has triggers and stays short (it joins the system prompt)', () => {
  assert.ok(guides.length >= 4);
  // Its own words are short; the harness's folder, filled in for {harness} (task 290), depends on where it is installed.
  const harness = new URL('../../', import.meta.url).pathname.replace(/\/$/, '');
  for (const guide of guides) { assert.ok(guide.triggers.length, guide.name); assert.ok(guide.text.replaceAll(harness, '{harness}').length < 700, `${guide.name} is short`); }
});

test('a request gets the guides its words call for, at most two, most matches first (strategy 5)', () => {
  const names = text => chooseGuides(text, guides).map(guide => guide.name);
  assert.deepEqual(names("then click on see chat button to go back to the chat then the view is lifted up. there is white at the bottom of the screen"), ['page-layout']);
  assert.deepEqual(names('Rename area_rect to rectangle_area everywhere'), ['rename']);
  assert.deepEqual(names("I have a doubt that changing the thinking level actually changes anything"), ['doubt']);
  assert.deepEqual(names('Paging is broken: page 2 repeats an item'), ['bug'], '"page 2" is a page of results, not a web page');
  assert.deepEqual(names('Write a README'), []);
  assert.ok(names('bug: the page scroll is broken and the layout jumps, it fails on the phone width').length <= 2);
});

// Strategy 4 (local-model practice: a small tool set): every tool in front of a small model costs it attention and
// invites a wrong call. Pi's own tools stay; each harness tool is active only where it helps, chosen per request.
const PAGE = /\b(page|pages|view|screen|layout|scroll\w*|click\w*|button|css|html|browser|ui|width|px|phone|mobile|menu|window|display|render\w*|white|lifted|jumps?|gap|visible|hidden|style)\b|\.(css|html?|jsx|tsx|vue|svelte)\b/i;
const OURS = ['harness', 'task_box', 'browser', 'ask_choices', 'propose_plan', 'music','web_search','app_block'];

/** The harness tools a request gets. terminal: a terminal Pi session; tasks: the project keeps tasks/ and ROADMAP.md;
 * blocks: the request matched App Block cards (harness/blocks.mjs), so Pi may load one more by name. */
export function harnessTools(text, { terminal, tasks, auto=false, music=false, blocks=false }) {
  return [...(terminal || auto ? ['harness'] : []), ...['ask_choices','propose_plan','web_search'], ...(music || /\b(music|sound|sounds|audio|melody|track|chiptune|percussion|sfx|blips|loops?|tunes?|effects|jingles?|bleeps?)\b/i.test(String(text || '')) ? ['music'] : []), ...(PAGE.test(String(text || '')) ? ['browser'] : []), ...(blocks ? ['app_block'] : [])];
}

/** The active set: the current one without the harness's tools, plus the ones chosen that are registered. */
export function activeTools(current, chosen, registered = current) {
  return [...current.filter(name => !OURS.includes(name)), ...chosen.filter(name => registered.includes(name))];
}

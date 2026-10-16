// Strategy 4 (local-model practice: a small tool set): every tool in front of a small model costs it attention and
// invites a wrong call. Pi's own tools stay; each harness tool is active only where it helps, chosen per request.
const PAGE = /\b(page|pages|view|screen|layout|scroll\w*|click\w*|button|css|html|browser|ui|width|px|phone|mobile|menu|window|display|render\w*|white|lifted|jumps?|gap|visible|hidden|style)\b|\.(css|html?|jsx|tsx|vue|svelte)\b/i;
const OURS = ['harness', 'task_box', 'browser', 'music'];

/** The harness tools a request gets. terminal: a terminal Pi session; tasks: the project keeps tasks/ and ROADMAP.md. */
export function harnessTools(text, { terminal, tasks, music = false }) {
  return [...(terminal ? ['harness'] : []), ...(tasks ? ['task_box'] : []), ...(music || /\b(music|sound|sounds|audio|melody|track|chiptune|percussion|sfx|blips|loops?|tunes?|effects|jingles?|bleeps?)\b/i.test(String(text || '')) ? ['music'] : []), ...(PAGE.test(String(text || '')) ? ['browser'] : [])];
}

/** The active set: the current one without the harness's tools, plus the ones chosen that are registered. */
export function activeTools(current, chosen, registered = current) {
  return [...current.filter(name => !OURS.includes(name)), ...chosen.filter(name => registered.includes(name))];
}

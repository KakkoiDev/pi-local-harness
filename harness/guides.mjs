// Short guides that join the system prompt only when a request's words call for them (strategy 5, after OpenHands'
// keyword-triggered microagents): know-how where it applies, and a short base prompt everywhere else. A guide is
// harness/guides/<name>.md with a front matter line "triggers: word, word, two words".
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

export function loadGuides(folder = new URL('./guides/', import.meta.url)) {
  const path = folder instanceof URL ? fileURLToPath(folder) : folder;
  return readdirSync(path).filter(name => name.endsWith('.md')).sort().map(name => {
    const text = readFileSync(join(path, name), 'utf8'), match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    const triggers = (match?.[1].match(/^triggers:\s*(.*)$/m)?.[1] || '').split(',').map(word => word.trim().toLowerCase()).filter(Boolean);
    return { name: name.replace(/\.md$/, ''), triggers, text: (match?.[2] || text).trim() };
  });
}

/** The guides for a request: those with a trigger in its words, the most matched first, at most `max`. */
export function chooseGuides(text, guides, max = 2) {
  const words = ` ${String(text || '').toLowerCase().replace(/[^a-z0-9'\s]/g, ' ').replace(/\s+/g, ' ')} `;
  return guides.map(guide => ({ guide, hits: guide.triggers.filter(trigger => words.includes(` ${trigger} `)).length }))
    .filter(item => item.hits).sort((a, b) => b.hits - a.hits).slice(0, max).map(item => item.guide);
}

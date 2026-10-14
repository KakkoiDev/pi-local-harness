// Plan 184: incidents the extension meets (Gate failed, a recovery, a wake-up, an unverified end) as lines in
// <data>/reports.jsonl, the same format harness/reports.py writes. Never throws: a report must not break the work.
import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export function report(data, kind, detail, fields = {}) {
  const line = { time: new Date().toISOString(), kind, detail: String(detail).slice(0, 2000), ...Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined && value !== '')) };
  try { mkdirSync(data, { recursive: true }); appendFileSync(join(data, 'reports.jsonl'), `${JSON.stringify(line)}\n`); } catch {}
}

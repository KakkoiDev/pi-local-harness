export class ThoughtWatch {
  constructor() { this.lines = []; this.partial = ''; this.active = false; this.thinking = false; this.lastActivity = 0; }
  start(now = Date.now()) { this.lines = []; this.partial = ''; this.active = true; this.thinking = false; this.touch(now); }
  stop() { this.active = false; this.thinking = false; }
  touch(now = Date.now()) { this.lastActivity = now; }
  feed(delta) {
    this.partial += delta;
    const lines = this.partial.split('\n');
    this.partial = lines.pop();
    this.lines.push(...lines.map(line => line.trim()).filter(Boolean));
    this.lines = this.lines.slice(-100);
    return this.loop();
  }
  loop() {
    const seen = new Map();
    for (let i = 0; i <= this.lines.length - 3; i++) {
      const triple = this.lines.slice(i, i + 3);
      const key = JSON.stringify(triple);
      if (seen.has(key) && i - seen.get(key) >= 3) return triple;
      if (!seen.has(key)) seen.set(key, i);
    }
    return null;
  }
  hanging(now, timeout) { return this.active && now - this.lastActivity >= timeout; }
}

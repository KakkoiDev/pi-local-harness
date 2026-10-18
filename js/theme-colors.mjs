// Task 312: the colour arithmetic of the theme panel, with no page around it (tests/harness/theme-colors.test.mjs).
// Basecoat writes its colours as oklch(); a colour picker speaks #rrggbb; the contrast check is WCAG 2's ratio.

const clamp = value => Math.min(1, Math.max(0, value));
const number = (text, percent = 1) => text.endsWith('%') ? parseFloat(text) / 100 * percent : parseFloat(text);
const encode = value => (value <= 0.0031308 ? 12.92 * value : 1.055 * Math.pow(value, 1 / 2.4) - 0.055);
const decode = value => (value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4));

/** {r, g, b, a} in sRGB, 0–1, from #hex, rgb(), hsl() or oklch(); null for anything else. */
export function parseColour(text) {
  const value = String(text || '').trim().toLowerCase();
  let found = value.match(/^#([0-9a-f]{3,8})$/);
  if (found) {
    let hex = found[1]; if (hex.length === 3 || hex.length === 4) hex = [...hex].map(c => c + c).join('');
    if (hex.length !== 6 && hex.length !== 8) return null;
    const part = index => parseInt(hex.slice(index, index + 2), 16) / 255;
    return { r: part(0), g: part(2), b: part(4), a: hex.length === 8 ? part(6) : 1 };
  }
  found = value.match(/^(rgba?|hsla?|oklch)\(([^)]*)\)$/);
  if (!found) return value === 'transparent' ? { r: 0, g: 0, b: 0, a: 0 } : null;
  const [main, alpha] = found[2].split('/'), parts = main.trim().split(/[\s,]+/).filter(Boolean);
  if (parts.length < 3) return null;
  const a = alpha !== undefined ? clamp(number(alpha.trim())) : parts[3] !== undefined ? clamp(number(parts[3])) : 1;
  if (found[1].startsWith('rgb')) return { r: clamp(number(parts[0], 255) / 255), g: clamp(number(parts[1], 255) / 255), b: clamp(number(parts[2], 255) / 255), a };
  if (found[1].startsWith('hsl')) {
    const h = ((parseFloat(parts[0]) % 360) + 360) % 360, s = number(parts[1].endsWith('%') ? parts[1] : parts[1] + '%'), l = number(parts[2].endsWith('%') ? parts[2] : parts[2] + '%');
    const k = n => (n + h / 30) % 12, m = s * Math.min(l, 1 - l), f = n => l - m * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return { r: clamp(f(0)), g: clamp(f(8)), b: clamp(f(4)), a };
  }
  // oklch(L C H): to OKLab, then to linear sRGB (Björn Ottosson's matrices), then the sRGB curve.
  const L = number(parts[0]), C = number(parts[1], 0.4), H = (parseFloat(parts[2]) || 0) * Math.PI / 180;
  const A = C * Math.cos(H), B = C * Math.sin(H);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3, m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3, s = (L - 0.0894841775 * A - 1.2914855480 * B) ** 3;
  return {
    r: clamp(encode(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)),
    g: clamp(encode(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)),
    b: clamp(encode(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)), a,
  };
}

/** #rrggbb for a picker (alpha is dropped), or '' when the text is not a colour. */
export function toHex(text) {
  const colour = parseColour(text); if (!colour) return '';
  return '#' + [colour.r, colour.g, colour.b].map(value => Math.round(value * 255).toString(16).padStart(2, '0')).join('');
}

export function luminance(colour) {
  return 0.2126 * decode(colour.r) + 0.7152 * decode(colour.g) + 0.0722 * decode(colour.b);
}

/** WCAG 2 contrast ratio between two colours (text), or null when one is not a colour. A see-through colour is laid
 * over the other first. */
export function contrast(first, second) {
  const a = parseColour(first), b = parseColour(second); if (!a || !b) return null;
  const over = (top, under) => ({ r: top.r * top.a + under.r * (1 - top.a), g: top.g * top.a + under.g * (1 - top.a), b: top.b * top.a + under.b * (1 - top.a), a: 1 });
  const [x, y] = [luminance(over(a, b)), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

// -- round 12 (the designer's picker, ThemePanel card): HSV for the saturation field and hue strip, the oklch a hex maps
// to, and how far apart two colours look (OKLab), for the chart warning.

/** {h 0–360, s 0–1, v 0–1} from a colour's text, or null. */
export function toHsv(text) {
  const colour = parseColour(text); if (!colour) return null;
  const { r, g, b } = colour, max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: ((h * 60) + 360) % 360, s: max ? d / max : 0, v: max };
}

/** #rrggbb from hue (0–360), saturation and value (0–1). */
export function fromHsv(h, s, v) {
  const f = n => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
  return '#' + [f(5), f(3), f(1)].map(value => Math.round(clamp(value) * 255).toString(16).padStart(2, '0')).join('');
}

/** OKLab {L, a, b} of a colour (alpha dropped), or null. */
export function toOklab(text) {
  const colour = parseColour(text); if (!colour) return null;
  const [r, g, b] = [colour.r, colour.g, colour.b].map(decode);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return { L: 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, a: 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s, b: 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s };
}

/** “oklch(0.65 0.19 42)”: the oklch a colour maps to, rounded the way Basecoat writes it; '' when it is not a colour. */
export function toOklch(text) {
  const lab = toOklab(text); if (!lab) return '';
  const C = Math.hypot(lab.a, lab.b), H = C < 0.0005 ? 0 : (Math.atan2(lab.b, lab.a) * 180 / Math.PI + 360) % 360;
  const trim = (value, places) => String(Number(value.toFixed(places)));
  return `oklch(${trim(lab.L, 3)} ${trim(C, 3)} ${trim(H, 1)})`;
}

/** How far apart two colours look (OKLab distance; under about 0.1 is hard to tell apart in a chart), or null. */
export function distance(first, second) {
  const a = toOklab(first), b = toOklab(second); if (!a || !b) return null;
  return Math.hypot(a.L - b.L, a.a - b.a, a.b - b.b);
}

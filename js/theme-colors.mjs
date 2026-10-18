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

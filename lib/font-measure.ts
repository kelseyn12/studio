import { readFileSync } from "fs";

type FontMetrics = { units: number; advance: (code: number) => number };

const cache = new Map<string, FontMetrics>();

function u16(buf: Buffer, offset: number): number {
  return buf.readUInt16BE(offset);
}

function u32(buf: Buffer, offset: number): number {
  return buf.readUInt32BE(offset);
}

function tableOffset(buf: Buffer, tag: string): number {
  const count = u16(buf, 4);
  for (let index = 0; index < count; index += 1) {
    const at = 12 + index * 16;
    if (buf.toString("latin1", at, at + 4) === tag) return u32(buf, at + 8);
  }
  return -1;
}

function glyphOf(buf: Buffer, cmap: number, code: number): number {
  const count = u16(buf, cmap + 2);
  for (let index = 0; index < count; index += 1) {
    const rec = cmap + 4 + index * 8;
    const platform = u16(buf, rec);
    const encoding = u16(buf, rec + 2);
    const unicode = platform === 0 || (platform === 3 && (encoding === 1 || encoding === 10));
    if (!unicode) continue;
    const start = cmap + u32(buf, rec + 4);
    const format = u16(buf, start);
    if (format === 4 && code <= 0xffff) return glyphFormat4(buf, start, code);
    if (format === 12) return glyphFormat12(buf, start, code);
  }
  return 0;
}

function glyphFormat4(buf: Buffer, start: number, code: number): number {
  const segCount = u16(buf, start + 6) / 2;
  const endAt = start + 14;
  let seg = 0;
  while (seg < segCount && code > u16(buf, endAt + seg * 2)) seg += 1;
  if (seg >= segCount) return 0;
  const startAt = endAt + segCount * 2 + 2;
  const startCode = u16(buf, startAt + seg * 2);
  if (code < startCode) return 0;
  const deltaAt = startAt + segCount * 2;
  const rangeAt = deltaAt + segCount * 2;
  const delta = buf.readInt16BE(deltaAt + seg * 2);
  const range = u16(buf, rangeAt + seg * 2);
  if (range === 0) return (code + delta) & 0xffff;
  const glyphAt = rangeAt + seg * 2 + range + (code - startCode) * 2;
  const glyph = u16(buf, glyphAt);
  return glyph === 0 ? 0 : (glyph + delta) & 0xffff;
}

function glyphFormat12(buf: Buffer, start: number, code: number): number {
  const groups = u32(buf, start + 12);
  let lo = 0;
  let hi = groups - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const at = start + 16 + mid * 12;
    const from = u32(buf, at);
    const to = u32(buf, at + 4);
    if (code < from) hi = mid - 1;
    else if (code > to) lo = mid + 1;
    else return u32(buf, at + 8) + (code - from);
  }
  return 0;
}

function loadFont(file: string): FontMetrics {
  const cached = cache.get(file);
  if (cached) return cached;
  const buf = readFileSync(file);
  const head = tableOffset(buf, "head");
  const hhea = tableOffset(buf, "hhea");
  const hmtx = tableOffset(buf, "hmtx");
  const cmap = tableOffset(buf, "cmap");
  const units = u16(buf, head + 18);
  const metrics = u16(buf, hhea + 34);
  const lastAdvance = u16(buf, hmtx + (metrics - 1) * 4);
  const parsed: FontMetrics = {
    units,
    advance(code: number) {
      const glyph = glyphOf(buf, cmap, code);
      if (glyph <= 0) return Math.round(units * 0.55);
      if (glyph >= metrics) return lastAdvance;
      return u16(buf, hmtx + glyph * 4);
    },
  };
  cache.set(file, parsed);
  return parsed;
}

/** Pixel width of one line at this font size. Missing files fall back to a bold average. */
export function measureTextPx(file: string, text: string, fontSize: number): number {
  try {
    const font = loadFont(file);
    let units = 0;
    for (const char of text) units += font.advance(char.codePointAt(0) ?? 32);
    return Math.max(fontSize, Math.round((units * fontSize) / font.units));
  } catch {
    return Math.round(Math.max(1, text.length) * fontSize * 0.55);
  }
}

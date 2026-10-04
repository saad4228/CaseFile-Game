// Renders the tileable texture PNGs in public/textures. Pre-rendered images replace the
// SVG feTurbulence filters used before: those are re-rasterised on the CPU for every
// element size and were a large part of the paint cost. Run: node scripts/generate-textures.mjs
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

// ── tiny PNG encoder (RGBA, 8-bit) ─────────────────────────────────────────────
const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── deterministic noise helpers (all wrap around, so tiles are seamless) ─────────
let seed = 47;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const white = (w, h) => Float32Array.from({ length: w * h }, rand);
function blur(src, w, h, rx, ry) {
  let a = src;
  for (let pass = 0; pass < 2; pass++) {
    const b = new Float32Array(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let s = 0;
        for (let k = -rx; k <= rx; k++) s += a[y * w + ((x + k + w) % w)];
        b[y * w + x] = s / (2 * rx + 1);
      }
    const c = new Float32Array(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let s = 0;
        for (let k = -ry; k <= ry; k++) s += b[((y + k + h) % h) * w + x];
        c[y * w + x] = s / (2 * ry + 1);
      }
    a = c;
  }
  return a;
}
const normalize = (a) => {
  let lo = Infinity, hi = -Infinity;
  for (const v of a) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
  return a.map((v) => (v - lo) / (hi - lo || 1));
};
function write(name, w, h, pixel) {
  const out = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const [r, g, b, al] = pixel(i);
    out[i * 4] = r; out[i * 4 + 1] = g; out[i * 4 + 2] = b; out[i * 4 + 3] = Math.max(0, Math.min(255, Math.round(al)));
  }
  writeFileSync(new URL(`../public/textures/${name}`, import.meta.url), png(w, h, out));
  console.log("wrote", name);
}

// Film grain: fine luminance noise, light and dark specks on transparent.
{
  const n = white(128, 128);
  write("grain.png", 128, 128, (i) => (n[i] > 0.5 ? [255, 255, 255, (n[i] - 0.5) * 2 * 120] : [0, 0, 0, (0.5 - n[i]) * 2 * 150]));
}

// Paper fibre: short horizontal fibres, fine tooth and faint mottling; brown, low alpha,
// laid over the paper colour.
{
  const W = 256, H = 256;
  const fibres = normalize(blur(white(W, H), W, H, 7, 0));
  const tooth = white(W, H);
  const blotch = normalize(blur(white(W, H), W, H, 28, 28));
  write("paper.png", W, H, (i) => {
    const f = Math.pow(fibres[i], 4) * 46;
    const t = tooth[i] * 20;
    const b = blotch[i] * 26;
    return [74, 58, 34, f + t + b];
  });
}

// Plaster wall: gentle mottling and fine grit, cool grey; under the page atmosphere and the board.
{
  const W = 256, H = 256;
  const low = normalize(blur(white(W, H), W, H, 26, 26));
  const mid = normalize(blur(white(W, H), W, H, 3, 3));
  const fine = white(W, H);
  write("wall.png", W, H, (i) => {
    const v = low[i] * 0.35 + mid[i] * 0.35 + fine[i] * 0.3;
    return v > 0.5 ? [200, 214, 226, (v - 0.5) * 2 * 22] : [0, 0, 0, (0.5 - v) * 2 * 40];
  });
}

// Rubber-stamp ink: mostly solid with worn specks and patches, used as a mask.
{
  const W = 128, H = 128;
  const blotch = normalize(blur(white(W, H), W, H, 6, 6));
  const speck = white(W, H);
  write("ink.png", W, H, (i) => {
    const worn = blotch[i] < 0.22 || speck[i] < 0.12;
    return [0, 0, 0, worn ? 70 + speck[i] * 60 : 235 + speck[i] * 20];
  });
}

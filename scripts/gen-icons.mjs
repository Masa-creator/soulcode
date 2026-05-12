import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c;
}
function crc32(buf) {
  let crc = 0xffffffff;
  for (const b of buf) crc = CRC_TABLE[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const l = Buffer.allocUnsafe(4); l.writeUInt32BE(data.length);
  const c = Buffer.allocUnsafe(4); c.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([l, t, data, c]);
}
function makePNG(size, draw) {
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const stride = 1 + size * 3;
  const raw = Buffer.allocUnsafe(size * stride);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b] = draw(x, y, size);
      const i = y * stride + 1 + x * 3;
      raw[i] = r; raw[i + 1] = g; raw[i + 2] = b;
    }
  }
  return Buffer.concat([
    Buffer.from('\x89PNG\r\n\x1a\n', 'binary'),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Dark navy background + gold ring + simple shuttle silhouette
function draw(x, y, s) {
  const cx = s / 2, cy = s / 2;
  const dx = x - cx, dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const R = s * 0.44;

  // Outer gold ring
  if (dist >= R - s * 0.07 && dist <= R) return [245, 158, 11];
  // Background outside ring
  if (dist > R) return [15, 23, 42];

  // Inside: shuttle head (circle at bottom center)
  const hx = cx, hy = cy + s * 0.12, hr = s * 0.11;
  const hd = Math.sqrt((x - hx) ** 2 + (y - hy) ** 2);
  if (hd <= hr) return [245, 158, 11];

  // Feather base (trapezoid widening upward from head top)
  const featherBot = hy - hr;
  const featherTop = cy - s * 0.28;
  if (y >= featherTop && y <= featherBot) {
    const span = ((featherBot - y) / (featherBot - featherTop)) * s * 0.18 + s * 0.02;
    if (Math.abs(x - cx) <= span) {
      // Three feather lines
      const lw = Math.max(1, s * 0.014);
      if (Math.abs(x - cx) < lw || Math.abs(Math.abs(x - cx) - span * 0.6) < lw) {
        return [245, 158, 11];
      }
      return [30, 41, 59]; // feather fill (dark)
    }
  }

  return [30, 41, 59]; // inner bg
}

mkdirSync('public', { recursive: true });
for (const [size, name] of [[192, 'icon-192.png'], [512, 'icon-512.png'], [180, 'apple-touch-icon.png']]) {
  writeFileSync(`public/${name}`, makePNG(size, draw));
  console.log(`✓ public/${name}`);
}

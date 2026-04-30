/**
 * Generates a RPG-themed .ico file (sword silhouette) with multiple resolutions.
 * Produces 16x16, 32x32, 48x48, and 256x256 pixel images.
 * Output: quest-log/assets/quest-log.ico
 *
 * The ICO file uses embedded PNG images for each resolution.
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { deflateSync } from 'zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Color palette (RGBA) ──
const TRANSPARENT = [0, 0, 0, 0];
const BLADE_LIGHT = [192, 210, 225, 255];
const BLADE_MID = [150, 170, 195, 255];
const BLADE_DARK = [110, 130, 160, 255];
const BLADE_EDGE = [80, 100, 130, 255];
const GUARD_GOLD = [218, 165, 32, 255];
const GUARD_DARK = [170, 120, 20, 255];
const GRIP_BROWN = [101, 67, 33, 255];
const GRIP_DARK = [70, 45, 20, 255];
const POMMEL_GOLD = [200, 150, 30, 255];
const HIGHLIGHT = [230, 240, 255, 255];

/**
 * Draw a sword silhouette onto an RGBA pixel buffer.
 * The sword is drawn vertically centered, blade pointing up.
 */
function drawSword(size) {
  const pixels = new Array(size * size).fill(null).map(() => [...TRANSPARENT]);

  const set = (x, y, color) => {
    if (x >= 0 && x < size && y >= 0 && y < size) {
      pixels[y * size + x] = [...color];
    }
  };

  const cx = Math.floor(size / 2);

  if (size <= 16) {
    // ── 16x16: minimal sword ──
    // Blade (vertical line)
    for (let y = 1; y <= 9; y++) set(cx, y, BLADE_MID);
    set(cx, 1, HIGHLIGHT);
    set(cx, 2, BLADE_LIGHT);
    // Blade width
    for (let y = 3; y <= 7; y++) {
      set(cx - 1, y, BLADE_DARK);
      set(cx + 1, y, BLADE_DARK);
    }
    // Guard
    for (let x = cx - 3; x <= cx + 3; x++) set(x, 10, GUARD_GOLD);
    for (let x = cx - 2; x <= cx + 2; x++) set(x, 11, GUARD_DARK);
    // Grip
    set(cx, 12, GRIP_BROWN);
    set(cx, 13, GRIP_BROWN);
    // Pommel
    set(cx, 14, POMMEL_GOLD);
  } else if (size <= 32) {
    // ── 32x32: more detailed sword ──
    // Blade tip
    set(cx, 2, HIGHLIGHT);
    set(cx, 3, BLADE_LIGHT);
    set(cx - 1, 3, BLADE_LIGHT);
    set(cx + 1, 3, BLADE_LIGHT);
    // Blade body
    for (let y = 4; y <= 18; y++) {
      const w = y < 6 ? 1 : 2;
      for (let dx = -w; dx <= w; dx++) {
        const color = dx === 0 ? BLADE_LIGHT : (Math.abs(dx) === w ? BLADE_EDGE : BLADE_MID);
        set(cx + dx, y, color);
      }
    }
    // Highlight streak
    for (let y = 5; y <= 15; y++) set(cx - 1, y, HIGHLIGHT);
    // Guard
    for (let x = cx - 6; x <= cx + 6; x++) set(x, 19, GUARD_GOLD);
    for (let x = cx - 7; x <= cx + 7; x++) set(x, 20, GUARD_GOLD);
    for (let x = cx - 6; x <= cx + 6; x++) set(x, 21, GUARD_DARK);
    // Grip
    for (let y = 22; y <= 26; y++) {
      set(cx - 1, y, GRIP_DARK);
      set(cx, y, GRIP_BROWN);
      set(cx + 1, y, GRIP_DARK);
    }
    // Pommel
    for (let dx = -2; dx <= 2; dx++) set(cx + dx, 27, POMMEL_GOLD);
    for (let dx = -1; dx <= 1; dx++) set(cx + dx, 28, POMMEL_GOLD);
  } else if (size <= 48) {
    // ── 48x48: detailed sword ──
    // Blade tip
    set(cx, 3, HIGHLIGHT);
    for (let dx = -1; dx <= 1; dx++) set(cx + dx, 4, BLADE_LIGHT);
    for (let dx = -1; dx <= 1; dx++) set(cx + dx, 5, BLADE_LIGHT);
    // Blade body
    for (let y = 6; y <= 28; y++) {
      const w = y < 9 ? 2 : 3;
      for (let dx = -w; dx <= w; dx++) {
        let color;
        if (dx === 0) color = BLADE_LIGHT;
        else if (Math.abs(dx) === w) color = BLADE_EDGE;
        else if (Math.abs(dx) === w - 1) color = BLADE_DARK;
        else color = BLADE_MID;
        set(cx + dx, y, color);
      }
    }
    // Highlight streak
    for (let y = 7; y <= 25; y++) {
      set(cx - 1, y, HIGHLIGHT);
      set(cx - 2, y, BLADE_LIGHT);
    }
    // Guard
    for (let x = cx - 10; x <= cx + 10; x++) set(x, 29, GUARD_GOLD);
    for (let x = cx - 11; x <= cx + 11; x++) set(x, 30, GUARD_GOLD);
    for (let x = cx - 11; x <= cx + 11; x++) set(x, 31, GUARD_DARK);
    for (let x = cx - 10; x <= cx + 10; x++) set(x, 32, GUARD_DARK);
    // Grip
    for (let y = 33; y <= 40; y++) {
      for (let dx = -2; dx <= 2; dx++) {
        const color = Math.abs(dx) <= 1 ? GRIP_BROWN : GRIP_DARK;
        set(cx + dx, y, color);
      }
      // Grip wrapping pattern
      if (y % 2 === 0) {
        set(cx - 2, y, GUARD_DARK);
        set(cx + 2, y, GUARD_DARK);
      }
    }
    // Pommel
    for (let dx = -3; dx <= 3; dx++) set(cx + dx, 41, POMMEL_GOLD);
    for (let dx = -3; dx <= 3; dx++) set(cx + dx, 42, POMMEL_GOLD);
    for (let dx = -2; dx <= 2; dx++) set(cx + dx, 43, GUARD_DARK);
  } else {
    // ── 256x256: high-res sword ──
    const scale = size / 48;
    const sSet = (x, y, color) => {
      const sx = Math.round(x * scale);
      const sy = Math.round(y * scale);
      const sw = Math.max(1, Math.round(scale));
      const sh = Math.max(1, Math.round(scale));
      for (let dy = 0; dy < sh; dy++) {
        for (let dx = 0; dx < sw; dx++) {
          set(sx + dx, sy + dy, color);
        }
      }
    };

    // Blade tip
    sSet(cx / scale, 3, HIGHLIGHT);
    for (let dx = -1; dx <= 1; dx++) sSet(cx / scale + dx, 4, BLADE_LIGHT);
    for (let dx = -1; dx <= 1; dx++) sSet(cx / scale + dx, 5, BLADE_LIGHT);
    // Blade body
    for (let y = 6; y <= 28; y++) {
      const w = y < 9 ? 2 : 3;
      for (let dx = -w; dx <= w; dx++) {
        let color;
        if (dx === 0) color = BLADE_LIGHT;
        else if (Math.abs(dx) === w) color = BLADE_EDGE;
        else if (Math.abs(dx) === w - 1) color = BLADE_DARK;
        else color = BLADE_MID;
        sSet(cx / scale + dx, y, color);
      }
    }
    // Highlight streak
    for (let y = 7; y <= 25; y++) {
      sSet(cx / scale - 1, y, HIGHLIGHT);
      sSet(cx / scale - 2, y, BLADE_LIGHT);
    }
    // Guard
    for (let x = -10; x <= 10; x++) sSet(cx / scale + x, 29, GUARD_GOLD);
    for (let x = -11; x <= 11; x++) sSet(cx / scale + x, 30, GUARD_GOLD);
    for (let x = -11; x <= 11; x++) sSet(cx / scale + x, 31, GUARD_DARK);
    for (let x = -10; x <= 10; x++) sSet(cx / scale + x, 32, GUARD_DARK);
    // Grip
    for (let y = 33; y <= 40; y++) {
      for (let dx = -2; dx <= 2; dx++) {
        const color = Math.abs(dx) <= 1 ? GRIP_BROWN : GRIP_DARK;
        sSet(cx / scale + dx, y, color);
      }
      if (y % 2 === 0) {
        sSet(cx / scale - 2, y, GUARD_DARK);
        sSet(cx / scale + 2, y, GUARD_DARK);
      }
    }
    // Pommel
    for (let dx = -3; dx <= 3; dx++) sSet(cx / scale + dx, 41, POMMEL_GOLD);
    for (let dx = -3; dx <= 3; dx++) sSet(cx / scale + dx, 42, POMMEL_GOLD);
    for (let dx = -2; dx <= 2; dx++) sSet(cx / scale + dx, 43, GUARD_DARK);
  }

  return pixels;
}


// ── PNG encoding (minimal, uncompressed) ──

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const crcInput = Buffer.concat([typeBytes, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput), 0);

  return Buffer.concat([length, typeBytes, data, crc]);
}

function encodePNG(pixels, width, height) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // IDAT chunk - raw pixel data with filter bytes
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    rawData[rowOffset] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const px = pixels[y * width + x];
      const offset = rowOffset + 1 + x * 4;
      rawData[offset] = px[0];     // R
      rawData[offset + 1] = px[1]; // G
      rawData[offset + 2] = px[2]; // B
      rawData[offset + 3] = px[3]; // A
    }
  }

  const compressed = deflateSync(rawData);

  // IEND chunk
  const iend = Buffer.alloc(0);

  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', iend),
  ]);
}

// ── ICO file format ──

function encodeICO(pngBuffers, sizes) {
  // ICO header: 6 bytes
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);              // reserved
  header.writeUInt16LE(1, 2);              // type: 1 = ICO
  header.writeUInt16LE(sizes.length, 4);   // number of images

  // Directory entries: 16 bytes each
  const dirSize = sizes.length * 16;
  let dataOffset = 6 + dirSize;

  const entries = [];
  for (let i = 0; i < sizes.length; i++) {
    const entry = Buffer.alloc(16);
    entry[0] = sizes[i] >= 256 ? 0 : sizes[i]; // width (0 = 256)
    entry[1] = sizes[i] >= 256 ? 0 : sizes[i]; // height (0 = 256)
    entry[2] = 0;  // color palette
    entry[3] = 0;  // reserved
    entry.writeUInt16LE(1, 4);  // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(pngBuffers[i].length, 8);  // image size
    entry.writeUInt32LE(dataOffset, 12);            // data offset
    dataOffset += pngBuffers[i].length;
    entries.push(entry);
  }

  return Buffer.concat([header, ...entries, ...pngBuffers]);
}

// ── Main ──

function main() {
  const sizes = [16, 32, 48, 256];
  const pngBuffers = [];

  for (const size of sizes) {
    console.log(`Generating ${size}x${size} sword icon...`);
    const pixels = drawSword(size);
    const png = encodePNG(pixels, size, size);
    pngBuffers.push(png);
  }

  const ico = encodeICO(pngBuffers, sizes);

  const outputDir = join(__dirname, '..', 'assets');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = join(outputDir, 'quest-log.ico');
  writeFileSync(outputPath, ico);
  console.log(`\n✅ Icon generated successfully: ${outputPath}`);
  console.log(`   File size: ${ico.length} bytes`);
  console.log(`   Resolutions: ${sizes.map(s => `${s}x${s}`).join(', ')}`);
}

main();

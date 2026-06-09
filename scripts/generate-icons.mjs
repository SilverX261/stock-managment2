/**
 * Generates public/icons/icon-192.png and icon-512.png
 * using only Node.js built-ins (no canvas/sharp needed).
 * Creates solid dark-navy icons — replace with a proper logo if desired.
 */

import { deflateSync } from 'zlib'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'public', 'icons')
mkdirSync(OUT, { recursive: true })

// ── CRC32 (required by PNG spec) ─────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[i] = c
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = (c >>> 8) ^ CRC_TABLE[(c ^ b) & 0xff]
  return ((c ^ 0xffffffff) >>> 0)
}

function pngChunk(type, data) {
  const lenBuf = Buffer.alloc(4); lenBuf.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type, 'ascii')
  const crcVal = crc32(Buffer.concat([typeBuf, data]))
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crcVal)
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

/**
 * Create a solid-color RGB PNG.
 * size: pixel dimensions (square)
 * r,g,b: fill color
 */
function solidPNG(size, r, g, b) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8   // bit depth
  ihdr[9] = 2   // color type: RGB
  ihdr[10] = 0  // compression
  ihdr[11] = 0  // filter method
  ihdr[12] = 0  // interlace: none

  // One row: filter byte (0=None) + RGB × size pixels
  const row = Buffer.alloc(1 + size * 3)
  row[0] = 0
  for (let x = 0; x < size; x++) {
    row[1 + x * 3] = r
    row[2 + x * 3] = g
    row[3 + x * 3] = b
  }
  const rawData = Buffer.concat(Array.from({ length: size }, () => row))
  const compressed = deflateSync(rawData, { level: 6 })

  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

// Dark navy: #0f172a = rgb(15, 23, 42)
const [R, G, B] = [15, 23, 42]

writeFileSync(join(OUT, 'icon-192.png'), solidPNG(192, R, G, B))
writeFileSync(join(OUT, 'icon-512.png'), solidPNG(512, R, G, B))

console.log('✓ Generated public/icons/icon-192.png (192×192)')
console.log('✓ Generated public/icons/icon-512.png (512×512)')

/**
 * Generates the PWA icons in public/icons/ with no dependencies: the magnifier
 * glyph (same design as public/favicon.svg, on a 64x64 grid) is rasterized
 * from signed distance functions with anti-aliasing and encoded as PNG with
 * Node's built-in zlib.
 *
 * Run with `npm run icons` after changing the design; the PNGs are committed.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { crc32, deflateSync } from 'node:zlib'

const OUT_DIR = new URL('../public/icons/', import.meta.url)

const BACKGROUND = [0x4f, 0x46, 0xe5] // --color-accent
const GLYPH = [0xff, 0xff, 0xff]

const ICONS = [
  // "any" icons: rounded square, glyph at full size (like the favicon).
  { file: 'icon-192.png', size: 192, rounded: true, glyphScale: 1 },
  { file: 'icon-512.png', size: 512, rounded: true, glyphScale: 1 },
  // Maskable and Apple icons are cropped by the OS: fill the whole square and
  // keep the glyph inside the maskable safe zone (a circle of 40% radius).
  { file: 'icon-maskable-512.png', size: 512, rounded: false, glyphScale: 0.8 },
  { file: 'apple-touch-icon.png', size: 180, rounded: false, glyphScale: 0.8 },
]

// --- Shapes, in the 64x64 design grid -------------------------------------

function roundedSquareDistance(x, y) {
  const radius = 14
  const qx = Math.abs(x - 32) - (32 - radius)
  const qy = Math.abs(y - 32) - (32 - radius)
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius
}

function segmentDistance(x, y, ax, ay, bx, by) {
  const [dx, dy] = [bx - ax, by - ay]
  const t = Math.min(Math.max(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy), 0), 1)
  return Math.hypot(x - (ax + t * dx), y - (ay + t * dy))
}

function glyphDistance(x, y) {
  const ring = Math.abs(Math.hypot(x - 28, y - 28) - 13) - 3 // circle r=13, stroke 6
  const handle = segmentDistance(x, y, 38, 38, 50, 50) - 3.5 // stroke 7, round caps
  return Math.min(ring, handle)
}

/** Fraction of a pixel covered by a shape, from its signed distance in pixels. */
function coverage(distanceInPixels) {
  return Math.min(Math.max(0.5 - distanceInPixels, 0), 1)
}

// --- Rendering ---------------------------------------------------------------

function renderIcon({ size, rounded, glyphScale }) {
  const unitsPerPixel = 64 / size
  const glyphCenter = 32.75 // center of the glyph's bounding box
  const rows = []

  for (let py = 0; py < size; py++) {
    const row = Buffer.alloc(1 + size * 4) // leading 0 = PNG "no filter"
    for (let px = 0; px < size; px++) {
      const x = (px + 0.5) * unitsPerPixel
      const y = (py + 0.5) * unitsPerPixel

      const background = rounded ? coverage(roundedSquareDistance(x, y) / unitsPerPixel) : 1
      // Shrink the glyph around the icon center by sampling a scaled-up grid.
      const gx = (x - 32) / glyphScale + glyphCenter
      const gy = (y - 32) / glyphScale + glyphCenter
      const glyph = coverage(glyphDistance(gx, gy) / (unitsPerPixel / glyphScale))

      const offset = 1 + px * 4
      for (let channel = 0; channel < 3; channel++) {
        row[offset + channel] = Math.round(
          BACKGROUND[channel] + (GLYPH[channel] - BACKGROUND[channel]) * glyph,
        )
      }
      row[offset + 3] = Math.round(255 * background)
    }
    rows.push(row)
  }

  return encodePng(size, size, Buffer.concat(rows))
}

// --- PNG encoding ------------------------------------------------------------

function pngChunk(type, data) {
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const checksum = Buffer.alloc(4)
  checksum.writeUInt32BE(crc32(typeAndData))
  return Buffer.concat([length, typeAndData, checksum])
}

function encodePng(width, height, filteredRows) {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8 // bit depth
  header[9] = 6 // color type: RGBA
  // bytes 10-12: compression, filter and interlace methods, all 0

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), // PNG signature
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(filteredRows, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync(OUT_DIR, { recursive: true })
for (const icon of ICONS) {
  writeFileSync(new URL(icon.file, OUT_DIR), renderIcon(icon))
  console.log(`Wrote public/icons/${icon.file} (${icon.size}x${icon.size})`)
}

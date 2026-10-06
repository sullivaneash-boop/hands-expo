/**
 * Builds the favicon / app icons from the brand mark. Re-run whenever icon-mark.svg changes:
 *   npm run build:icons
 * Input:  public/assets/brand/icon-mark.svg
 * Output: favicon.svg (copy), favicon-32.png, icon-512.png (transparent),
 *         apple-touch-icon.png (180×180, solid --thermal-black, icon at ~80% with even padding).
 */
import { copyFile, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const BRAND = join(dirname(fileURLToPath(import.meta.url)), '../public/assets/brand');
const SRC = join(BRAND, 'icon-mark.svg');
/** --thermal-black (src/index.css). iOS renders transparent touch icons badly, so this one is opaque. */
const THERMAL_BLACK = '#1A1A1A';
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

const svg = await readFile(SRC);

/** Rasterize the SVG at 2× the target, then downscale, for clean edges at small sizes. */
async function renderPng(size) {
  const density = Math.max(72, Math.ceil((72 * size * 2) / 512)); // icon-mark viewBox is 512×512
  return sharp(svg, { density })
    .resize(size, size, { fit: 'contain', background: TRANSPARENT })
    .png()
    .toBuffer();
}

async function transparentIcon(size, name) {
  await sharp(await renderPng(size)).toFile(join(BRAND, name));
  console.log(`  ${name} ${size}×${size} transparent`);
}

async function appleTouchIcon() {
  const size = 180;
  const inner = Math.round(size * 0.8); // ~80% → 18px even padding
  await sharp({ create: { width: size, height: size, channels: 3, background: THERMAL_BLACK } })
    .composite([{ input: await renderPng(inner), gravity: 'center' }])
    .removeAlpha()
    .png()
    .toFile(join(BRAND, 'apple-touch-icon.png'));
  console.log(`  apple-touch-icon.png ${size}×${size} on ${THERMAL_BLACK}, icon ${inner}px`);
}

console.log('build:icons from icon-mark.svg');
await copyFile(SRC, join(BRAND, 'favicon.svg'));
console.log('  favicon.svg (copy)');
await transparentIcon(32, 'favicon-32.png');
await transparentIcon(512, 'icon-512.png');
await appleTouchIcon();

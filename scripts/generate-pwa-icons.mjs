import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';

const src = 'C:/Users/fiks/.gemini/antigravity/brain/e696b7b3-40f3-4cdf-8140-d5991c1be72c/opsflow_app_icon_1779471832233.png';
const dest = './public';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

for (const size of sizes) {
  await sharp(src).resize(size, size).png().toFile(`${dest}/icon-${size}x${size}.png`);
  console.log(`created icon-${size}x${size}.png`);
}

// Maskable icon with safe-zone padding (~10%)
const pad = Math.round(512 * 0.1);
await sharp(src)
  .resize(512 - pad * 2, 512 - pad * 2)
  .extend({
    top: pad, bottom: pad, left: pad, right: pad,
    background: { r: 15, g: 23, b: 42, alpha: 1 }
  })
  .resize(512, 512)
  .png()
  .toFile(`${dest}/icon-maskable-512x512.png`);
console.log('created icon-maskable-512x512.png');

console.log('All PWA icons generated!');

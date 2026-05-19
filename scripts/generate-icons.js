const sharp = require('sharp');
const path = require('path');

const absoluteSvgPath = path.resolve(__dirname, '../src/app/icon.svg');
const dest192 = path.resolve(__dirname, '../public/icon-192x192.png');
const dest512 = path.resolve(__dirname, '../public/icon-512x512.png');

async function generate() {
  try {
    console.log('Reading SVG from:', absoluteSvgPath);
    
    console.log('Generating 192x192 PWA icon...');
    await sharp(absoluteSvgPath)
      .resize(192, 192)
      .png()
      .toFile(dest192);
    console.log('192x192 PWA icon generated at:', dest192);

    console.log('Generating 512x512 PWA icon...');
    await sharp(absoluteSvgPath)
      .resize(512, 512)
      .png()
      .toFile(dest512);
    console.log('512x512 PWA icon generated at:', dest512);
    
    console.log('Successfully generated PWA PNG icons!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generate();

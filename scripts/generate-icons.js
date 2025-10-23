#!/usr/bin/env node

/**
 * Icon Generation Script for PWA
 *
 * This script generates PNG icons from the source SVG for the PWA manifest.
 *
 * To use:
 * 1. Install sharp: npm install --save-dev sharp
 * 2. Run: node scripts/generate-icons.js
 *
 * Alternatively, you can use online tools like:
 * - https://realfavicongenerator.net/
 * - https://www.pwabuilder.com/imageGenerator
 */

const fs = require('fs');
const path = require('path');

const ICON_SIZES = [192, 512];
const SOURCE_SVG = path.join(__dirname, '../public/icon.svg');
const PUBLIC_DIR = path.join(__dirname, '../public');

async function generateIcons() {
  try {
    // Check if sharp is installed
    const sharp = require('sharp');

    const svgBuffer = fs.readFileSync(SOURCE_SVG);

    for (const size of ICON_SIZES) {
      const outputPath = path.join(PUBLIC_DIR, `icon-${size}.png`);

      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);

      console.log(`✓ Generated ${outputPath}`);
    }

    console.log('\n✅ All icons generated successfully!');
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('❌ Sharp is not installed. Please run: npm install --save-dev sharp');
      console.error('\nAlternatively, use an online tool to convert icon.svg to PNG:');
      console.error('  - https://realfavicongenerator.net/');
      console.error('  - https://www.pwabuilder.com/imageGenerator');
      process.exit(1);
    } else {
      console.error('Error generating icons:', error);
      process.exit(1);
    }
  }
}

generateIcons();

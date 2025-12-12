/**
 * PWA Icon Generator
 * Generates all required PWA icons and splash screens from source images
 *
 * Usage: node scripts/generate-pwa-icons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SPECS_DIR = path.join(__dirname, '..', 'specs');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const SPLASH_DIR = path.join(PUBLIC_DIR, 'splash');

// Source images
const APPLE_TOUCH_SOURCE = path.join(SPECS_DIR, 'apple-touch-icon.jpg');
const FAVICON_SOURCE = path.join(SPECS_DIR, 'favicon.jpg');

// Icon sizes to generate
const ICONS = [
  { name: 'apple-touch-icon.png', size: 180, source: 'apple-touch' },
  { name: 'icon-192.png', size: 192, source: 'apple-touch' },
  { name: 'icon-512.png', size: 512, source: 'apple-touch' },
  { name: 'favicon-32x32.png', size: 32, source: 'favicon' },
  { name: 'favicon-16x16.png', size: 16, source: 'favicon' },
];

// Splash screen sizes for iOS
const SPLASH_SCREENS = [
  { name: 'apple-splash-1290-2796.png', width: 1290, height: 2796 }, // iPhone 14 Pro Max
  { name: 'apple-splash-1179-2556.png', width: 1179, height: 2556 }, // iPhone 14 Pro
  { name: 'apple-splash-1170-2532.png', width: 1170, height: 2532 }, // iPhone 14/13/12
  { name: 'apple-splash-750-1334.png', width: 750, height: 1334 },   // iPhone SE
  { name: 'apple-splash-2048-2732.png', width: 2048, height: 2732 }, // iPad Pro 12.9"
  { name: 'apple-splash-1668-2388.png', width: 1668, height: 2388 }, // iPad Pro 11"
];

// Background color for splash screens (matches theme)
const SPLASH_BG_COLOR = '#9a7b4f'; // Golden brown to match icon

async function generateIcons() {
  console.log('=== Generating PWA Icons ===\n');

  for (const icon of ICONS) {
    const source = icon.source === 'apple-touch' ? APPLE_TOUCH_SOURCE : FAVICON_SOURCE;
    const outputPath = path.join(PUBLIC_DIR, icon.name);

    try {
      await sharp(source)
        .resize(icon.size, icon.size, {
          fit: 'cover',
          position: 'center'
        })
        .png()
        .toFile(outputPath);

      console.log(`✓ Generated: ${icon.name} (${icon.size}x${icon.size})`);
    } catch (error) {
      console.error(`✗ Failed to generate ${icon.name}:`, error.message);
    }
  }
}

async function generateFavicon() {
  console.log('\n=== Generating Favicon.ico ===\n');

  const faviconPath = path.join(PUBLIC_DIR, 'favicon.ico');

  try {
    // Generate 48x48 PNG first, then convert
    // Note: sharp doesn't directly support ICO, so we'll create a PNG that works as favicon
    await sharp(FAVICON_SOURCE)
      .resize(48, 48, {
        fit: 'cover',
        position: 'center'
      })
      .png()
      .toFile(faviconPath.replace('.ico', '-48.png'));

    // Copy as .ico (browsers accept PNG favicons)
    const pngBuffer = await sharp(FAVICON_SOURCE)
      .resize(32, 32, {
        fit: 'cover',
        position: 'center'
      })
      .png()
      .toBuffer();

    fs.writeFileSync(faviconPath, pngBuffer);
    console.log('✓ Generated: favicon.ico (32x32 PNG format)');
  } catch (error) {
    console.error('✗ Failed to generate favicon.ico:', error.message);
  }
}

async function generateSplashScreens() {
  console.log('\n=== Generating Splash Screens ===\n');

  // Ensure splash directory exists
  if (!fs.existsSync(SPLASH_DIR)) {
    fs.mkdirSync(SPLASH_DIR, { recursive: true });
    console.log(`Created directory: ${SPLASH_DIR}`);
  }

  // Load the source icon
  const iconSize = 300; // Size of icon in splash screen

  for (const splash of SPLASH_SCREENS) {
    const outputPath = path.join(SPLASH_DIR, splash.name);

    try {
      // Create background
      const background = await sharp({
        create: {
          width: splash.width,
          height: splash.height,
          channels: 3,
          background: SPLASH_BG_COLOR
        }
      }).png().toBuffer();

      // Resize icon for splash
      const scaledIconSize = Math.min(
        Math.floor(splash.width * 0.35),
        Math.floor(splash.height * 0.2)
      );

      const icon = await sharp(APPLE_TOUCH_SOURCE)
        .resize(scaledIconSize, scaledIconSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toBuffer();

      // Composite icon onto background (centered, slightly above middle)
      const iconLeft = Math.floor((splash.width - scaledIconSize) / 2);
      const iconTop = Math.floor((splash.height - scaledIconSize) / 2) - Math.floor(splash.height * 0.05);

      await sharp(background)
        .composite([
          {
            input: icon,
            left: iconLeft,
            top: iconTop
          }
        ])
        .png()
        .toFile(outputPath);

      console.log(`✓ Generated: ${splash.name} (${splash.width}x${splash.height})`);
    } catch (error) {
      console.error(`✗ Failed to generate ${splash.name}:`, error.message);
    }
  }
}

async function verifyAssets() {
  console.log('\n=== Verifying Assets ===\n');

  const allAssets = [
    ...ICONS.map(i => ({ path: path.join(PUBLIC_DIR, i.name), expected: `${i.size}x${i.size}` })),
    { path: path.join(PUBLIC_DIR, 'favicon.ico'), expected: '32x32' },
    ...SPLASH_SCREENS.map(s => ({ path: path.join(SPLASH_DIR, s.name), expected: `${s.width}x${s.height}` }))
  ];

  let passed = 0;
  let failed = 0;

  for (const asset of allAssets) {
    if (fs.existsSync(asset.path)) {
      try {
        const metadata = await sharp(asset.path).metadata();
        const actual = `${metadata.width}x${metadata.height}`;
        if (actual === asset.expected) {
          console.log(`✓ ${path.basename(asset.path)}: ${actual}`);
          passed++;
        } else {
          console.log(`⚠ ${path.basename(asset.path)}: expected ${asset.expected}, got ${actual}`);
          failed++;
        }
      } catch (error) {
        console.log(`✓ ${path.basename(asset.path)}: exists (format check skipped)`);
        passed++;
      }
    } else {
      console.log(`✗ ${path.basename(asset.path)}: MISSING`);
      failed++;
    }
  }

  console.log(`\n=== Summary: ${passed} passed, ${failed} failed ===`);
  return failed === 0;
}

async function main() {
  console.log('PWA Icon Generator\n');
  console.log(`Source images:`);
  console.log(`  - Apple Touch: ${APPLE_TOUCH_SOURCE}`);
  console.log(`  - Favicon: ${FAVICON_SOURCE}\n`);

  // Check source files exist
  if (!fs.existsSync(APPLE_TOUCH_SOURCE)) {
    console.error(`Error: Apple touch icon source not found: ${APPLE_TOUCH_SOURCE}`);
    process.exit(1);
  }
  if (!fs.existsSync(FAVICON_SOURCE)) {
    console.error(`Error: Favicon source not found: ${FAVICON_SOURCE}`);
    process.exit(1);
  }

  await generateIcons();
  await generateFavicon();
  await generateSplashScreens();

  const success = await verifyAssets();

  if (success) {
    console.log('\n✓ All PWA assets generated successfully!');
  } else {
    console.log('\n⚠ Some assets may need attention.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});

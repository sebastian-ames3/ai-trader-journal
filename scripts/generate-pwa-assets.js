/**
 * PWA Asset Generator
 * Generates splash screens and App Store screenshots using Playwright
 *
 * Usage: node scripts/generate-pwa-assets.js
 * Requires: Dev server running on localhost:3000
 */

const { chromium } = require('playwright');
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const SPLASH_SCREENS = [
  { name: 'apple-splash-1290-2796', width: 1290, height: 2796 }, // iPhone 14 Pro Max
  { name: 'apple-splash-1179-2556', width: 1179, height: 2556 }, // iPhone 14 Pro
  { name: 'apple-splash-1170-2532', width: 1170, height: 2532 }, // iPhone 14/13/12
  { name: 'apple-splash-750-1334', width: 750, height: 1334 },   // iPhone SE
  { name: 'apple-splash-2048-2732', width: 2048, height: 2732 }, // iPad Pro 12.9"
  { name: 'apple-splash-1668-2388', width: 1668, height: 2388 }, // iPad Pro 11"
];

const SCREENSHOTS = [
  { name: 'dashboard-mobile', url: '/', width: 390, height: 844, form_factor: 'narrow' },
  { name: 'journal-mobile', url: '/journal', width: 390, height: 844, form_factor: 'narrow' },
  { name: 'entry-form-mobile', url: '/?action=new', width: 390, height: 844, form_factor: 'narrow' },
  { name: 'insights-mobile', url: '/insights', width: 390, height: 844, form_factor: 'narrow' },
  { name: 'dashboard-desktop', url: '/', width: 1280, height: 720, form_factor: 'wide' },
];

async function generateSplashScreen(config, outputDir) {
  // Use canvas to create a simple branded splash screen
  // In production, you would use actual brand assets
  try {
    const canvas = createCanvas(config.width, config.height);
    const ctx = canvas.getContext('2d');

    // Background gradient (dark theme)
    const gradient = ctx.createLinearGradient(0, 0, 0, config.height);
    gradient.addColorStop(0, '#171717');
    gradient.addColorStop(1, '#0a0a0a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, config.width, config.height);

    // App name text
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.floor(config.width * 0.06)}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('AI Trader Journal', config.width / 2, config.height / 2 - 40);

    // Tagline
    ctx.fillStyle = '#737373';
    ctx.font = `${Math.floor(config.width * 0.03)}px Inter, system-ui, sans-serif`;
    ctx.fillText('Trading Psychology Insights', config.width / 2, config.height / 2 + 40);

    // Save
    const buffer = canvas.toBuffer('image/png');
    const filePath = path.join(outputDir, `${config.name}.png`);
    fs.writeFileSync(filePath, buffer);
    console.log(`Generated: ${config.name}.png`);
  } catch (error) {
    console.log(`Skipping splash screen ${config.name} (canvas not available): ${error.message}`);
  }
}

async function generateScreenshots(baseUrl, outputDir) {
  const browser = await chromium.launch();

  for (const config of SCREENSHOTS) {
    try {
      const context = await browser.newContext({
        viewport: { width: config.width, height: config.height },
        deviceScaleFactor: config.form_factor === 'narrow' ? 3 : 2,
      });
      const page = await context.newPage();

      await page.goto(`${baseUrl}${config.url}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Wait for dynamic content
      await page.waitForTimeout(2000);

      const filePath = path.join(outputDir, `${config.name}.png`);
      await page.screenshot({ path: filePath });
      console.log(`Generated: ${config.name}.png`);

      await context.close();
    } catch (error) {
      console.error(`Error generating ${config.name}: ${error.message}`);
    }
  }

  await browser.close();
}

async function main() {
  const publicDir = path.join(__dirname, '..', 'public');
  const splashDir = path.join(publicDir, 'splash');
  const screenshotDir = path.join(publicDir, 'screenshots');

  // Ensure directories exist
  if (!fs.existsSync(splashDir)) fs.mkdirSync(splashDir, { recursive: true });
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  console.log('=== Generating PWA Assets ===\n');
  console.log(`Base URL: ${baseUrl}\n`);

  // Generate splash screens (using canvas if available)
  console.log('--- Splash Screens ---');
  for (const config of SPLASH_SCREENS) {
    await generateSplashScreen(config, splashDir);
  }

  // Generate screenshots
  console.log('\n--- App Screenshots ---');
  await generateScreenshots(baseUrl, screenshotDir);

  console.log('\n=== Done ===');
  console.log('Note: For production splash screens, replace with branded assets.');
}

main().catch(console.error);

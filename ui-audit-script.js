const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const MOBILE_VIEWPORT = { width: 390, height: 844 }; // iPhone 14 Pro

async function runUIAudit() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: MOBILE_VIEWPORT,
    deviceScaleFactor: 3,
  });
  const page = await context.newPage();

  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, 'ui-audit-screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('Starting UI Audit...\n');

  try {
    // Page 1: Homepage/Dashboard
    console.log('1. Capturing Homepage/Dashboard...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(screenshotsDir, '01-homepage.png'),
      fullPage: true
    });

    // Check for entries - if empty, note it
    const hasEntries = await page.locator('[data-testid="entry-card"], .entry-card, article').count();
    console.log(`   - Found ${hasEntries} entries on homepage`);

    // Page 2: New Entry page
    console.log('2. Capturing New Entry page...');
    const newEntryButton = page.locator('button:has-text("New Entry"), a:has-text("New Entry"), [aria-label*="new entry" i]').first();
    if (await newEntryButton.count() > 0) {
      await newEntryButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(screenshotsDir, '02-new-entry.png'),
        fullPage: true
      });
      await page.goBack();
    } else {
      // Try direct navigation
      await page.goto('http://localhost:3000/entries/new', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(screenshotsDir, '02-new-entry.png'),
        fullPage: true
      });
    }

    // Page 3: Entry List/History
    console.log('3. Capturing Entry List/History...');
    await page.goto('http://localhost:3000/entries', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(screenshotsDir, '03-entry-list.png'),
      fullPage: true
    });

    // Page 4: Weekly Insights
    console.log('4. Capturing Weekly Insights page...');
    await page.goto('http://localhost:3000/insights', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(screenshotsDir, '04-insights.png'),
      fullPage: true
    });

    // Page 5: Individual Entry (if exists)
    console.log('5. Attempting to capture individual entry...');
    await page.goto('http://localhost:3000/entries', { waitUntil: 'networkidle' });
    const firstEntry = page.locator('[data-testid="entry-card"], .entry-card, article a').first();
    if (await firstEntry.count() > 0) {
      await firstEntry.click();
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(screenshotsDir, '05-entry-detail.png'),
        fullPage: true
      });
    }

    // Capture FAB if exists
    console.log('6. Checking for FAB (Floating Action Button)...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    const fab = page.locator('[class*="fab" i], [class*="floating" i], button[class*="fixed"]');
    if (await fab.count() > 0) {
      console.log('   - FAB found');
    }

    // Test touch target sizes
    console.log('\n7. Analyzing touch target sizes...');
    const buttons = await page.locator('button, a[role="button"]').all();
    let smallTargets = 0;
    for (const button of buttons) {
      const box = await button.boundingBox();
      if (box && (box.width < 44 || box.height < 44)) {
        smallTargets++;
      }
    }
    console.log(`   - Found ${smallTargets} elements smaller than 44x44px`);

    // Check for horizontal scroll
    console.log('\n8. Checking for horizontal scroll...');
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = MOBILE_VIEWPORT.width;
    if (bodyWidth > viewportWidth) {
      console.log(`   - WARNING: Horizontal scroll detected (${bodyWidth}px > ${viewportWidth}px)`);
    } else {
      console.log('   - No horizontal scroll issues');
    }

    // Check console errors
    console.log('\n9. Checking console errors...');
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    if (errors.length > 0) {
      console.log(`   - Found ${errors.length} console errors`);
    } else {
      console.log('   - No console errors');
    }

    console.log('\n✓ UI Audit Complete!');
    console.log(`Screenshots saved to: ${screenshotsDir}`);

  } catch (error) {
    console.error('Error during audit:', error);
  } finally {
    await browser.close();
  }
}

runUIAudit();

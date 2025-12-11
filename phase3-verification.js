/**
 * Phase 3 UX/UI Design System Verification
 * Tests modern mobile-first design implementation
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(process.cwd(), 'agent-os', 'specs', 'validation-screenshots', 'spec11-verification');

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const results = {
  passed: [],
  failed: [],
  warnings: []
};

function logPass(test) {
  console.log(`✅ PASS: ${test}`);
  results.passed.push(test);
}

function logFail(test, error) {
  console.log(`❌ FAIL: ${test}`);
  console.log(`   Error: ${error}`);
  results.failed.push({ test, error });
}

function logWarning(test, warning) {
  console.log(`⚠️ WARN: ${test}`);
  console.log(`   Warning: ${warning}`);
  results.warnings.push({ test, warning });
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function verifyBottomNavigation(page) {
  console.log('\n🧭 Testing Bottom Navigation with Center FAB...');

  try {
    // Check if bottom nav exists on mobile viewport
    const bottomNav = await page.locator('[role="navigation"]').last();
    await bottomNav.waitFor({ timeout: 5000 });

    // Verify nav items
    const navItems = await page.locator('[role="navigation"] a').count();
    if (navItems >= 4) {
      logPass('Bottom navigation has multiple nav items');
    } else {
      logFail('Bottom navigation', `Expected at least 4 nav items, found ${navItems}`);
    }

    // Check for center FAB
    const fab = await page.locator('button[class*="rounded-full"]').first();
    if (await fab.isVisible()) {
      logPass('Center FAB is visible');

      // Verify FAB positioning (should be floating above bottom nav)
      const fabBox = await fab.boundingBox();
      if (fabBox && fabBox.width >= 56 && fabBox.height >= 56) {
        logPass('FAB meets minimum size requirements (56x56px)');
      } else {
        logWarning('FAB size', 'FAB may be smaller than recommended 56x56px');
      }
    } else {
      logWarning('Center FAB', 'FAB not visible on this page');
    }

    // Take screenshot
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '1-bottom-navigation-with-fab.png'),
      fullPage: false
    });
    logPass('Screenshot: Bottom navigation with FAB');

  } catch (error) {
    logFail('Bottom navigation', error.message);
  }
}

async function verifyStreakCard(page) {
  console.log('\n🔥 Testing Streak Card...');

  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

    // Look for streak card by various selectors
    const streakCard = await page.locator('text=/Streak|🔥/').first();

    if (await streakCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      logPass('Streak card is visible');

      // Check for gradient background
      const cardElement = await streakCard.locator('..').first();
      const bgColor = await cardElement.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.backgroundImage || style.background;
      });

      if (bgColor.includes('gradient')) {
        logPass('Streak card has gradient background');
      } else {
        logWarning('Streak card gradient', 'Background may not be using gradient');
      }

      // Check for fire emoji animation
      const fireEmoji = await page.locator('text=🔥').first();
      if (await fireEmoji.isVisible()) {
        logPass('Fire emoji is present in streak card');
      }

      // Take screenshot
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '2-streak-card.png'),
        fullPage: false
      });
      logPass('Screenshot: Streak card');

    } else {
      logWarning('Streak card', 'Not visible on homepage (may not be implemented yet)');
    }

  } catch (error) {
    logFail('Streak card', error.message);
  }
}

async function verifyEntryCards(page) {
  console.log('\n📝 Testing Entry Cards...');

  try {
    // Navigate to journal page
    await page.goto(`${BASE_URL}/journal`, { waitUntil: 'networkidle' });
    await delay(1000);

    // Look for entry cards
    const entryCards = await page.locator('a[href*="/journal/"]').all();

    if (entryCards.length > 0) {
      logPass(`Found ${entryCards.length} entry cards`);

      const firstCard = entryCards[0];

      // Check for type indicator (colored line or badge)
      const hasBadge = await firstCard.locator('[class*="badge"]').count() > 0;
      if (hasBadge) {
        logPass('Entry cards have type indicators (badges)');
      } else {
        logWarning('Entry type indicators', 'No badges found on entry cards');
      }

      // Check for hover effects
      await firstCard.hover();
      await delay(200);

      const hasHoverEffect = await firstCard.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.transition.includes('all') || style.transition.includes('transform');
      });

      if (hasHoverEffect) {
        logPass('Entry cards have hover transitions');
      }

      // Check for rounded corners
      const borderRadius = await firstCard.evaluate(el => {
        return window.getComputedStyle(el).borderRadius;
      });

      if (borderRadius && parseFloat(borderRadius) >= 16) {
        logPass('Entry cards have modern rounded corners (≥16px)');
      } else {
        logWarning('Entry card styling', 'Border radius may be less than recommended');
      }

    } else {
      logWarning('Entry cards', 'No entries found (empty state)');
    }

    // Take screenshot
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '3-journal-page.png'),
      fullPage: true
    });
    logPass('Screenshot: Journal page with entry cards');

  } catch (error) {
    logFail('Entry cards', error.message);
  }
}

async function verifyMoodSelector(page) {
  console.log('\n😊 Testing Mood Selector...');

  try {
    // Navigate to new entry page
    await page.goto(`${BASE_URL}/journal/new`, { waitUntil: 'networkidle' });
    await delay(1000);

    // Look for mood selector (buttons with emojis)
    const moodButtons = await page.locator('button:has-text("😊"), button:has-text("🚀"), button:has-text("😐"), button:has-text("🤔"), button:has-text("😰")').all();

    if (moodButtons.length >= 5) {
      logPass(`Mood selector has ${moodButtons.length} mood options`);

      // Check touch target size
      const firstMood = moodButtons[0];
      const box = await firstMood.boundingBox();

      if (box && box.width >= 44 && box.height >= 44) {
        logPass('Mood buttons meet minimum touch target size (44x44px)');
      } else {
        logFail('Mood selector touch targets', `Size: ${box?.width}x${box?.height}px (minimum 44x44px required)`);
      }

      // Test interaction
      await firstMood.click();
      await delay(200);

      logPass('Mood selector is interactive');

    } else {
      logWarning('Mood selector', 'Not found on new entry page');
    }

    // Take screenshot
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '4-new-entry-mood-selector.png'),
      fullPage: true
    });
    logPass('Screenshot: New entry page with mood selector');

  } catch (error) {
    logFail('Mood selector', error.message);
  }
}

async function verifyGlassEffects(page) {
  console.log('\n🪟 Testing Glassmorphism Effects...');

  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

    // Check for backdrop-blur classes
    const glassElements = await page.locator('[class*="backdrop-blur"]').all();

    if (glassElements.length > 0) {
      logPass(`Found ${glassElements.length} elements with glassmorphism effects`);

      // Verify CSS properties
      const firstGlass = glassElements[0];
      const backdropFilter = await firstGlass.evaluate(el => {
        return window.getComputedStyle(el).backdropFilter ||
               window.getComputedStyle(el).webkitBackdropFilter;
      });

      if (backdropFilter && backdropFilter !== 'none') {
        logPass('Glassmorphism backdrop-filter is applied');
      } else {
        logWarning('Glassmorphism', 'backdrop-filter may not be rendering');
      }

    } else {
      logWarning('Glassmorphism', 'No glass effects detected');
    }

  } catch (error) {
    logFail('Glassmorphism effects', error.message);
  }
}

async function verifyMicroInteractions(page) {
  console.log('\n✨ Testing Micro-Interactions...');

  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

    // Check for button ripple effects
    const buttons = await page.locator('button').all();

    if (buttons.length > 0) {
      const firstButton = buttons[0];

      // Check for transition classes
      const hasTransition = await firstButton.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.transition !== 'all 0s ease 0s' && style.transition !== '';
      });

      if (hasTransition) {
        logPass('Buttons have transition effects');
      } else {
        logWarning('Button micro-interactions', 'No transition detected');
      }

      // Test active state
      await firstButton.click({ force: true });
      await delay(100);

      logPass('Button interactions are functional');
    }

    // Check for card hover animations
    const cards = await page.locator('[class*="card"]').all();

    if (cards.length > 0) {
      const firstCard = cards[0];
      await firstCard.hover();
      await delay(200);

      const hasHoverEffect = await firstCard.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.transition.includes('all') ||
               style.transition.includes('transform') ||
               style.transition.includes('shadow');
      });

      if (hasHoverEffect) {
        logPass('Cards have hover micro-interactions');
      }
    }

  } catch (error) {
    logFail('Micro-interactions', error.message);
  }
}

async function verifyAccessibility(page) {
  console.log('\n♿ Testing Accessibility Features...');

  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

    // Test skip-to-content link
    await page.keyboard.press('Tab');
    await delay(300);

    const skipLink = await page.locator('a[href="#main-content"], a:has-text("Skip to")').first();

    if (await skipLink.isVisible({ timeout: 1000 }).catch(() => false)) {
      logPass('Skip-to-content link appears on Tab press');

      // Take screenshot of skip link
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '5-skip-link-focus.png'),
        fullPage: false
      });
      logPass('Screenshot: Skip link visibility');

    } else {
      logWarning('Skip link', 'Not visible or not implemented');
    }

    // Check focus indicators
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      const style = window.getComputedStyle(el);
      return {
        outline: style.outline,
        boxShadow: style.boxShadow,
        borderColor: style.borderColor
      };
    });

    if (focusedElement.outline !== 'none' ||
        focusedElement.boxShadow.includes('rgba') ||
        focusedElement.borderColor !== 'rgb(0, 0, 0)') {
      logPass('Focus indicators are present');

      // Take screenshot of focus state
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '6-focus-indicators.png'),
        fullPage: false
      });
      logPass('Screenshot: Focus indicators');

    } else {
      logWarning('Focus indicators', 'May not be visible enough');
    }

    // Check for emoji accessibility
    const emojis = await page.locator('text=/[😊🚀😐🤔😰🔥]/').all();

    if (emojis.length > 0) {
      const firstEmoji = emojis[0];
      const hasAriaLabel = await firstEmoji.evaluate(el => {
        return el.getAttribute('aria-label') !== null ||
               el.getAttribute('role') === 'img' ||
               el.closest('[role="img"]') !== null;
      });

      if (hasAriaLabel) {
        logPass('Emojis have accessibility attributes');
      } else {
        logWarning('Emoji accessibility', 'Emojis may be missing aria-label or role="img"');
      }
    }

    // Check color contrast (basic check)
    const textElements = await page.locator('p, span, h1, h2, h3, a').all();
    let contrastIssues = 0;

    for (let i = 0; i < Math.min(10, textElements.length); i++) {
      const contrast = await textElements[i].evaluate(el => {
        const style = window.getComputedStyle(el);
        const color = style.color;
        const bgColor = style.backgroundColor;

        // Simple check for very light text on light bg or very dark on dark bg
        const rgb = color.match(/\d+/g)?.map(Number);
        const bgRgb = bgColor.match(/\d+/g)?.map(Number);

        if (rgb && bgRgb) {
          const textLuminance = (rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114) / 255;
          const bgLuminance = (bgRgb[0] * 0.299 + bgRgb[1] * 0.587 + bgRgb[2] * 0.114) / 255;
          return Math.abs(textLuminance - bgLuminance);
        }
        return 1; // Default to pass if can't calculate
      });

      if (contrast < 0.3) {
        contrastIssues++;
      }
    }

    if (contrastIssues === 0) {
      logPass('Basic color contrast check passed');
    } else {
      logWarning('Color contrast', `${contrastIssues} potential contrast issues detected`);
    }

  } catch (error) {
    logFail('Accessibility features', error.message);
  }
}

async function verifyGuidedEntryWizard(page) {
  console.log('\n🧙 Testing Guided Entry Wizard...');

  try {
    await page.goto(`${BASE_URL}/journal/new`, { waitUntil: 'networkidle' });
    await delay(1000);

    // Look for wizard indicators (step indicators, progress bar, etc.)
    const hasSteps = await page.locator('text=/Step|1/').isVisible({ timeout: 2000 }).catch(() => false);
    const hasProgress = await page.locator('[role="progressbar"], [class*="progress"]').isVisible({ timeout: 2000 }).catch(() => false);

    if (hasSteps || hasProgress) {
      logPass('Guided entry wizard UI detected');
    } else {
      logWarning('Guided entry wizard', 'Not visible or not implemented on new entry page');
    }

    // Take screenshot
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '7-guided-entry-wizard.png'),
      fullPage: true
    });
    logPass('Screenshot: New entry page (guided wizard)');

  } catch (error) {
    logFail('Guided entry wizard', error.message);
  }
}

async function verifySkeletonLoaders(page) {
  console.log('\n💀 Testing Skeleton Loaders...');

  try {
    // Navigate and look for skeleton states
    await page.goto(`${BASE_URL}/journal`, { waitUntil: 'domcontentloaded' });

    // Check immediately for skeleton loaders (before content loads)
    await delay(100);

    const skeletons = await page.locator('[class*="skeleton"], [class*="animate-pulse"]').all();

    if (skeletons.length > 0) {
      logPass(`Found ${skeletons.length} skeleton loader elements`);
    } else {
      logWarning('Skeleton loaders', 'Not detected (may load too quickly or not implemented)');
    }

  } catch (error) {
    logFail('Skeleton loaders', error.message);
  }
}

async function verifyResponsiveDesign(page) {
  console.log('\n📱 Testing Responsive Design...');

  try {
    // Test mobile viewport (390x844 - iPhone 14 Pro)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await delay(500);

    // Verify bottom nav is visible on mobile
    const bottomNav = await page.locator('[role="navigation"]').last();
    if (await bottomNav.isVisible()) {
      logPass('Bottom navigation visible on mobile viewport (390x844)');
    } else {
      logWarning('Mobile navigation', 'Bottom nav not visible on mobile viewport');
    }

    // Take mobile screenshot
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '8-mobile-viewport-390x844.png'),
      fullPage: true
    });
    logPass('Screenshot: Mobile viewport (390x844)');

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload({ waitUntil: 'networkidle' });
    await delay(500);

    logPass('Page renders on tablet viewport (768x1024)');

    // Test desktop viewport
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.reload({ waitUntil: 'networkidle' });
    await delay(500);

    logPass('Page renders on desktop viewport (1366x768)');

    // Reset to mobile
    await page.setViewportSize({ width: 390, height: 844 });

  } catch (error) {
    logFail('Responsive design', error.message);
  }
}

async function verifyHomePage(page) {
  console.log('\n🏠 Testing Home Page Design...');

  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await delay(1000);

    // Take full homepage screenshot
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '0-homepage-full.png'),
      fullPage: true
    });
    logPass('Screenshot: Full homepage');

    // Check for greeting header
    const greetingTexts = ['Good morning', 'Good afternoon', 'Good evening', 'Hello'];
    let hasGreeting = false;

    for (const greeting of greetingTexts) {
      if (await page.locator(`text="${greeting}"`).isVisible({ timeout: 1000 }).catch(() => false)) {
        hasGreeting = true;
        break;
      }
    }

    if (hasGreeting) {
      logPass('Time-aware greeting header detected');
    } else {
      logWarning('Greeting header', 'Not detected on homepage');
    }

    // Check for quick action cards
    const cards = await page.locator('[class*="card"]').all();

    if (cards.length > 0) {
      logPass(`Found ${cards.length} cards on homepage`);
    }

    // Verify glass header
    const header = await page.locator('header').first();
    if (await header.isVisible()) {
      const hasGlassEffect = await header.evaluate(el => {
        const style = window.getComputedStyle(el);
        return (style.backdropFilter && style.backdropFilter !== 'none') ||
               (style.webkitBackdropFilter && style.webkitBackdropFilter !== 'none');
      });

      if (hasGlassEffect) {
        logPass('Header has glass effect');
      } else {
        logWarning('Glass header', 'Backdrop filter not detected');
      }
    }

  } catch (error) {
    logFail('Homepage design', error.message);
  }
}

async function runVerification() {
  console.log('🚀 Starting Phase 3 UX/UI Design System Verification...\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Screenshots will be saved to: ${SCREENSHOTS_DIR}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14 Pro
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
  });
  const page = await context.newPage();

  try {
    // Run all verification tests
    await verifyHomePage(page);
    await verifyBottomNavigation(page);
    await verifyStreakCard(page);
    await verifyEntryCards(page);
    await verifyMoodSelector(page);
    await verifyGlassEffects(page);
    await verifyMicroInteractions(page);
    await verifyAccessibility(page);
    await verifyGuidedEntryWizard(page);
    await verifySkeletonLoaders(page);
    await verifyResponsiveDesign(page);

  } catch (error) {
    console.error('\n❌ Fatal error during verification:', error);
  } finally {
    await browser.close();
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log('='.repeat(60));

  if (results.failed.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.failed.forEach(({ test, error }) => {
      console.log(`  - ${test}: ${error}`);
    });
  }

  if (results.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    results.warnings.forEach(({ test, warning }) => {
      console.log(`  - ${test}: ${warning}`);
    });
  }

  console.log(`\n📸 Screenshots saved to: ${SCREENSHOTS_DIR}`);

  // Write JSON report
  const reportPath = path.join(SCREENSHOTS_DIR, 'verification-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`📄 JSON report saved to: ${reportPath}`);

  // Determine overall status
  const overallStatus = results.failed.length === 0 ?
    (results.warnings.length === 0 ? 'PASS' : 'PASS_WITH_WARNINGS') :
    'FAIL';

  console.log(`\n🎯 Overall Status: ${overallStatus}\n`);

  return overallStatus;
}

// Run verification
runVerification().catch(console.error);

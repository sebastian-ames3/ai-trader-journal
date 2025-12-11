6const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function runMobileVerification() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();

  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, 'agent-os', 'mobile-verification-screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const results = {
    dashboard: {
      url: 'http://localhost:3000',
      passes: [],
      failures: [],
      consoleErrors: [],
      grade: 'A'
    },
    newEntry: {
      url: 'http://localhost:3000/journal/new',
      passes: [],
      failures: [],
      consoleErrors: [],
      grade: 'A'
    }
  };

  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const currentPage = page.url().includes('/journal/new') ? 'newEntry' : 'dashboard';
      results[currentPage].consoleErrors.push(msg.text());
    }
  });

  // Test Dashboard (Page 1)
  console.log('\n🔍 Testing Dashboard...');
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Let page settle

    // Take screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, 'dashboard-mobile.png'),
      fullPage: true
    });

    // Check for horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    if (hasHorizontalScroll) {
      results.dashboard.failures.push('Horizontal scroll detected');
      results.dashboard.grade = 'C';
    } else {
      results.dashboard.passes.push('No horizontal scroll');
    }

    // Check touch targets (buttons, links, interactive elements)
    const touchTargets = await page.evaluate(() => {
      const elements = document.querySelectorAll('button, a, [role="button"], input, select, textarea');
      const small = [];

      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
          small.push({
            tag: el.tagName,
            text: el.textContent?.substring(0, 30) || el.getAttribute('aria-label') || 'unknown',
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          });
        }
      });

      return small;
    });

    if (touchTargets.length > 0) {
      results.dashboard.failures.push(`Touch targets < 44px found: ${touchTargets.length} elements`);
      touchTargets.slice(0, 3).forEach(t => {
        results.dashboard.failures.push(`  - ${t.tag} "${t.text}" (${t.width}x${t.height}px)`);
      });
      if (results.dashboard.grade === 'A') results.dashboard.grade = 'B';
    } else {
      results.dashboard.passes.push('All touch targets >= 44x44px');
    }

    // Check for overlapping elements
    const hasOverlap = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('div, button, a, p, h1, h2, h3'));
      for (let i = 0; i < elements.length; i++) {
        const rect1 = elements[i].getBoundingClientRect();
        if (rect1.width === 0 || rect1.height === 0) continue;

        for (let j = i + 1; j < elements.length; j++) {
          const rect2 = elements[j].getBoundingClientRect();
          if (rect2.width === 0 || rect2.height === 0) continue;

          // Check if elements overlap (simplified check)
          if (rect1.left < rect2.right && rect1.right > rect2.left &&
              rect1.top < rect2.bottom && rect1.bottom > rect2.top) {
            // Check if one contains the other (allowed)
            const contains = (elements[i].contains(elements[j]) || elements[j].contains(elements[i]));
            if (!contains) {
              return true;
            }
          }
        }
      }
      return false;
    });

    if (hasOverlap) {
      results.dashboard.failures.push('Overlapping elements detected');
      if (results.dashboard.grade === 'A') results.dashboard.grade = 'B';
    } else {
      results.dashboard.passes.push('No overlapping elements');
    }

    // Check for bottom navigation
    const hasBottomNav = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      if (!nav) return false;
      const rect = nav.getBoundingClientRect();
      return rect.bottom >= window.innerHeight - 100; // Within 100px of bottom
    });

    if (hasBottomNav) {
      results.dashboard.passes.push('Bottom navigation visible');
    } else {
      results.dashboard.failures.push('Bottom navigation not found or not at bottom');
      if (results.dashboard.grade === 'A') results.dashboard.grade = 'B';
    }

    // Check text wrapping (no text overflow)
    const hasTextOverflow = await page.evaluate(() => {
      const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div');
      for (const el of textElements) {
        const style = window.getComputedStyle(el);
        if (el.scrollWidth > el.clientWidth && style.overflow === 'visible') {
          return true;
        }
      }
      return false;
    });

    if (hasTextOverflow) {
      results.dashboard.failures.push('Text overflow detected (text not wrapping properly)');
      if (results.dashboard.grade === 'A') results.dashboard.grade = 'B';
    } else {
      results.dashboard.passes.push('Text wraps properly');
    }

  } catch (error) {
    results.dashboard.failures.push(`Error testing dashboard: ${error.message}`);
    results.dashboard.grade = 'C';
  }

  // Test New Entry Form (Page 2)
  console.log('\n🔍 Testing New Entry Form...');
  try {
    await page.goto('http://localhost:3000/journal/new', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, 'new-entry-mobile.png'),
      fullPage: true
    });

    // Check for horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    if (hasHorizontalScroll) {
      results.newEntry.failures.push('Horizontal scroll detected');
      results.newEntry.grade = 'C';
    } else {
      results.newEntry.passes.push('No horizontal scroll');
    }

    // Check touch targets
    const touchTargets = await page.evaluate(() => {
      const elements = document.querySelectorAll('button, a, [role="button"], input, select, textarea');
      const small = [];

      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
          small.push({
            tag: el.tagName,
            text: el.textContent?.substring(0, 30) || el.getAttribute('aria-label') || el.getAttribute('placeholder') || 'unknown',
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          });
        }
      });

      return small;
    });

    if (touchTargets.length > 0) {
      results.newEntry.failures.push(`Touch targets < 44px found: ${touchTargets.length} elements`);
      touchTargets.slice(0, 3).forEach(t => {
        results.newEntry.failures.push(`  - ${t.tag} "${t.text}" (${t.width}x${t.height}px)`);
      });
      if (results.newEntry.grade === 'A') results.newEntry.grade = 'B';
    } else {
      results.newEntry.passes.push('All touch targets >= 44x44px');
    }

    // Check text wrapping
    const hasTextOverflow = await page.evaluate(() => {
      const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, label');
      for (const el of textElements) {
        const style = window.getComputedStyle(el);
        if (el.scrollWidth > el.clientWidth && style.overflow === 'visible') {
          return true;
        }
      }
      return false;
    });

    if (hasTextOverflow) {
      results.newEntry.failures.push('Text overflow detected');
      if (results.newEntry.grade === 'A') results.newEntry.grade = 'B';
    } else {
      results.newEntry.passes.push('Text wraps properly');
    }

    // Check overlapping
    const hasOverlap = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('div, button, a, p, h1, h2, h3, label'));
      for (let i = 0; i < elements.length; i++) {
        const rect1 = elements[i].getBoundingClientRect();
        if (rect1.width === 0 || rect1.height === 0) continue;

        for (let j = i + 1; j < elements.length; j++) {
          const rect2 = elements[j].getBoundingClientRect();
          if (rect2.width === 0 || rect2.height === 0) continue;

          if (rect1.left < rect2.right && rect1.right > rect2.left &&
              rect1.top < rect2.bottom && rect1.bottom > rect2.top) {
            const contains = (elements[i].contains(elements[j]) || elements[j].contains(elements[i]));
            if (!contains) {
              return true;
            }
          }
        }
      }
      return false;
    });

    if (hasOverlap) {
      results.newEntry.failures.push('Overlapping elements detected');
      if (results.newEntry.grade === 'A') results.newEntry.grade = 'B';
    } else {
      results.newEntry.passes.push('No overlapping elements');
    }

    // Check for bottom navigation
    const hasBottomNav = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      if (!nav) return false;
      const rect = nav.getBoundingClientRect();
      return rect.bottom >= window.innerHeight - 100;
    });

    if (hasBottomNav) {
      results.newEntry.passes.push('Bottom navigation visible');
    } else {
      results.newEntry.failures.push('Bottom navigation not found or not at bottom');
      if (results.newEntry.grade === 'A') results.newEntry.grade = 'B';
    }

    // Check textarea minimum height
    const textareaHeight = await page.evaluate(() => {
      const textarea = document.querySelector('textarea');
      if (!textarea) return 0;
      return textarea.getBoundingClientRect().height;
    });

    if (textareaHeight >= 120) {
      results.newEntry.passes.push(`Textarea height adequate (${Math.round(textareaHeight)}px)`);
    } else if (textareaHeight > 0) {
      results.newEntry.failures.push(`Textarea height too small (${Math.round(textareaHeight)}px, should be >= 120px)`);
      if (results.newEntry.grade === 'A') results.newEntry.grade = 'B';
    }

  } catch (error) {
    results.newEntry.failures.push(`Error testing new entry: ${error.message}`);
    results.newEntry.grade = 'C';
  }

  await browser.close();

  // Print results
  console.log('\n\n📱 Mobile Check Results (390x844)\n');

  console.log(`Page: ${results.dashboard.url}\n`);
  console.log('✅ PASSES:');
  results.dashboard.passes.forEach(p => console.log(`- ${p}`));
  console.log('\n❌ FAILURES:');
  if (results.dashboard.failures.length === 0) {
    console.log('- None');
  } else {
    results.dashboard.failures.forEach(f => console.log(`- ${f}`));
  }
  console.log('\n🔴 Console Errors:');
  if (results.dashboard.consoleErrors.length === 0) {
    console.log('- None');
  } else {
    results.dashboard.consoleErrors.forEach(e => console.log(`- ${e}`));
  }
  console.log(`\nGrade: ${results.dashboard.grade} - ${getGradeJustification(results.dashboard)}\n`);
  console.log('─'.repeat(60));

  console.log(`\nPage: ${results.newEntry.url}\n`);
  console.log('✅ PASSES:');
  results.newEntry.passes.forEach(p => console.log(`- ${p}`));
  console.log('\n❌ FAILURES:');
  if (results.newEntry.failures.length === 0) {
    console.log('- None');
  } else {
    results.newEntry.failures.forEach(f => console.log(`- ${f}`));
  }
  console.log('\n🔴 Console Errors:');
  if (results.newEntry.consoleErrors.length === 0) {
    console.log('- None');
  } else {
    results.newEntry.consoleErrors.forEach(e => console.log(`- ${e}`));
  }
  console.log(`\nGrade: ${results.newEntry.grade} - ${getGradeJustification(results.newEntry)}\n`);

  console.log(`\n📸 Screenshots saved to: ${screenshotsDir}\n`);

  // Save JSON report
  const reportPath = path.join(screenshotsDir, 'verification-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`📄 JSON report saved to: ${reportPath}\n`);
}

function getGradeJustification(pageResults) {
  if (pageResults.grade === 'A') {
    return 'All checks passed, excellent mobile UX';
  } else if (pageResults.grade === 'B') {
    return 'Minor issues found, generally good mobile UX';
  } else {
    return 'Significant issues found, needs improvement';
  }
}

runMobileVerification().catch(console.error);

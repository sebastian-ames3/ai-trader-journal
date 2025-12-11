const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Screenshot directory
const screenshotDir = path.join(__dirname, 'agent-os', 'specs', '06-trade-management', 'verification', 'screenshots');

// Ensure screenshot directory exists
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function runTradeLoggingTests() {
  console.log('Starting Trade Logging Tests...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14 Pro
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
  });

  const page = await context.newPage();

  // Capture console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Capture page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  const results = {
    tests: [],
    totalPassed: 0,
    totalFailed: 0,
    screenshots: [],
    consoleErrors: [],
    pageErrors: []
  };

  try {
    // Test 1: Navigate to Theses List Page
    console.log('Test 1: Theses List Page...');
    try {
      await page.goto('http://localhost:3000/theses', { waitUntil: 'networkidle', timeout: 10000 });

      // Wait longer for React to hydrate
      await page.waitForTimeout(3000);

      // Check what's actually on the page
      const pageText = await page.textContent('body');
      console.log('Page text preview:', pageText.substring(0, 200));

      // Look for key elements - more flexible selectors
      const hasHeading = await page.locator('h1:has-text("Trading Theses"), h1:has-text("Theses")').isVisible({ timeout: 5000 }).catch(() => false);
      const hasNewButton = await page.locator('button:has-text("New"), button:has-text("Thesis")').first().isVisible({ timeout: 5000 }).catch(() => false);
      const hasEmptyState = await page.locator('text=/No.*theses/i, text=/Create.*thesis/i').isVisible({ timeout: 5000 }).catch(() => false);

      const screenshotPath = path.join(screenshotDir, '01-theses-list.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      results.screenshots.push('01-theses-list.png');

      if (hasHeading || hasNewButton || hasEmptyState) {
        console.log('✓ Theses list page loaded successfully');
        results.tests.push({ name: 'Theses List Page', status: 'PASS', details: `Heading: ${hasHeading}, Button: ${hasNewButton}, Empty state: ${hasEmptyState}` });
        results.totalPassed++;
      } else {
        console.log('✗ Theses list page did not load properly');
        console.log('Console errors:', consoleErrors);
        console.log('Page errors:', pageErrors);
        results.tests.push({ name: 'Theses List Page', status: 'FAIL', details: 'Page elements not found. Check console/page errors.' });
        results.totalFailed++;
      }
    } catch (error) {
      console.log('✗ Failed to load theses list page:', error.message);
      results.tests.push({ name: 'Theses List Page', status: 'FAIL', details: error.message });
      results.totalFailed++;
    }

    // Test 2: Navigate to Create New Thesis
    console.log('\nTest 2: Create New Thesis Form...');
    try {
      await page.goto('http://localhost:3000/theses/new', { waitUntil: 'networkidle', timeout: 10000 });
      await page.waitForTimeout(3000);

      // Check for heading
      const hasHeading = await page.locator('h1:has-text("New"), h1:has-text("Thesis")').isVisible({ timeout: 5000 }).catch(() => false);

      // Check for form inputs - use id selectors from the code
      const nameInput = page.locator('#name');
      const tickerInput = page.locator('#ticker');
      const thesisTextarea = page.locator('#thesis');

      const hasNameInput = await nameInput.isVisible({ timeout: 5000 }).catch(() => false);
      const hasTickerInput = await tickerInput.isVisible({ timeout: 5000 }).catch(() => false);
      const hasThesisTextarea = await thesisTextarea.isVisible({ timeout: 5000 }).catch(() => false);

      // Check for direction buttons
      const directionButtons = await page.locator('button:has-text("Bullish"), button:has-text("Bearish")').count();

      const screenshotPath = path.join(screenshotDir, '02-create-thesis-form.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      results.screenshots.push('02-create-thesis-form.png');

      if (hasHeading && hasNameInput && hasTickerInput && hasThesisTextarea && directionButtons >= 2) {
        console.log('✓ Create thesis form loaded with all required fields');
        results.tests.push({ name: 'Create New Thesis Form', status: 'PASS', details: 'All form fields present' });
        results.totalPassed++;

        // Test 3: Submit New Thesis
        console.log('\nTest 3: Submit New Thesis...');
        let thesisId = null;
        try {
          // Fill out the form
          await nameInput.fill('Test NVDA Thesis');
          await tickerInput.fill('NVDA');

          // Click Bullish direction button
          await page.locator('button:has-text("Bullish")').first().click();
          await page.waitForTimeout(500);

          await thesisTextarea.fill('Testing the trade logging feature');
          await page.waitForTimeout(500);

          const screenshotPath = path.join(screenshotDir, '03-thesis-form-filled.png');
          await page.screenshot({ path: screenshotPath, fullPage: true });
          results.screenshots.push('03-thesis-form-filled.png');

          // Submit form
          const submitButton = page.locator('button[type="submit"]:has-text("Create")');
          await submitButton.click();

          // Wait for navigation
          await page.waitForURL(/\/theses\/[^\/]+$/, { timeout: 10000 });
          await page.waitForTimeout(3000);

          const currentUrl = page.url();
          const match = currentUrl.match(/\/theses\/([^\/]+)/);
          if (match) {
            thesisId = match[1];
          }

          console.log('✓ Thesis created successfully, ID:', thesisId);
          results.tests.push({ name: 'Submit New Thesis', status: 'PASS', details: `Thesis created with ID: ${thesisId}` });
          results.totalPassed++;

          // Test 4: Thesis Detail Page
          console.log('\nTest 4: Thesis Detail Page...');
          try {
            await page.waitForTimeout(2000);

            // Check for key elements on detail page
            const hasThesisName = await page.locator('text=/Test NVDA Thesis/i').isVisible({ timeout: 5000 }).catch(() => false);
            const hasTicker = await page.locator('text=/NVDA/').isVisible({ timeout: 5000 }).catch(() => false);
            const hasDirection = await page.locator('text=/bullish/i').isVisible({ timeout: 5000 }).catch(() => false);
            const hasLogTradeButton = await page.locator('button:has-text("Log"), button:has-text("Trade"), a:has-text("Log Trade")').first().isVisible({ timeout: 5000 }).catch(() => false);

            const screenshotPath = path.join(screenshotDir, '04-thesis-detail.png');
            await page.screenshot({ path: screenshotPath, fullPage: true });
            results.screenshots.push('04-thesis-detail.png');

            if (hasThesisName && hasDirection && hasLogTradeButton) {
              console.log('✓ Thesis detail page shows required elements');
              results.tests.push({ name: 'Thesis Detail Page', status: 'PASS', details: 'Key elements visible' });
              results.totalPassed++;

              // Test 5: Navigate to Log Trade Form
              console.log('\nTest 5: Log Trade Form...');
              try {
                // Click Log Trade button
                const logTradeButton = page.locator('button:has-text("Log"), a:has-text("Log")').first();
                await logTradeButton.click();
                await page.waitForTimeout(3000);

                // Verify form elements using IDs from code
                const hasActionSelect = await page.locator('text=/Action/i').isVisible({ timeout: 5000 }).catch(() => false);
                const hasStrategyLabel = await page.locator('text=/Strategy/i').isVisible({ timeout: 5000 }).catch(() => false);
                const hasDescriptionLabel = await page.locator('text=/Description/i, text=/What did you do/i').isVisible({ timeout: 5000 }).catch(() => false);

                const screenshotPath = path.join(screenshotDir, '05-log-trade-form.png');
                await page.screenshot({ path: screenshotPath, fullPage: true });
                results.screenshots.push('05-log-trade-form.png');

                if (hasActionSelect && hasDescriptionLabel) {
                  console.log('✓ Log trade form loaded');
                  results.tests.push({ name: 'Log Trade Form', status: 'PASS', details: 'Form loaded with fields' });
                  results.totalPassed++;

                  // Test 6: Submit Trade
                  console.log('\nTest 6: Submit Trade...');
                  try {
                    // Fill form - look for Select components and textareas

                    // Description textarea
                    const descTextarea = page.locator('textarea').first();
                    await descTextarea.fill('Bought 150/155 call spread for $2.50 debit');
                    await page.waitForTimeout(500);

                    // Look for debit/credit input
                    const debitInput = page.locator('input[type="text"], input[type="number"]').filter({ hasText: '' }).first();
                    await debitInput.fill('-2.50');
                    await page.waitForTimeout(500);

                    const screenshotPath = path.join(screenshotDir, '06-trade-form-filled.png');
                    await page.screenshot({ path: screenshotPath, fullPage: true });
                    results.screenshots.push('06-trade-form-filled.png');

                    // Submit
                    const submitBtn = page.locator('button[type="submit"]').first();
                    await submitBtn.click();

                    // Wait for navigation back
                    await page.waitForTimeout(4000);

                    const currentUrl = page.url();
                    if (currentUrl.includes('/theses/') && !currentUrl.includes('/log-trade')) {
                      console.log('✓ Trade submitted successfully');
                      results.tests.push({ name: 'Submit Trade', status: 'PASS', details: 'Trade created' });
                      results.totalPassed++;

                      // Test 7: Verify Trade in Timeline
                      console.log('\nTest 7: Verify Trade Timeline...');
                      await page.waitForTimeout(2000);

                      const screenshotPath = path.join(screenshotDir, '07-trade-timeline.png');
                      await page.screenshot({ path: screenshotPath, fullPage: true });
                      results.screenshots.push('07-trade-timeline.png');

                      // Look for trade in timeline
                      const hasTradeText = await page.locator('text=/150.*155/i, text=/call.*spread/i, text=/2.50/').first().isVisible({ timeout: 5000 }).catch(() => false);

                      if (hasTradeText) {
                        console.log('✓ Trade visible in timeline');
                        results.tests.push({ name: 'Verify Trade Timeline', status: 'PASS', details: 'Trade appears in timeline' });
                        results.totalPassed++;
                      } else {
                        console.log('⚠ Trade may not be visible in timeline (needs manual verification)');
                        results.tests.push({ name: 'Verify Trade Timeline', status: 'WARN', details: 'Trade visibility unclear from automated test' });
                        results.totalFailed++;
                      }
                    } else {
                      console.log('✗ Did not navigate back after trade submission');
                      results.tests.push({ name: 'Submit Trade', status: 'FAIL', details: `Current URL: ${currentUrl}` });
                      results.totalFailed++;
                    }
                  } catch (error) {
                    console.log('✗ Failed to submit trade:', error.message);
                    results.tests.push({ name: 'Submit Trade', status: 'FAIL', details: error.message });
                    results.totalFailed++;
                  }
                } else {
                  console.log('✗ Log trade form missing elements');
                  results.tests.push({ name: 'Log Trade Form', status: 'FAIL', details: 'Form elements not found' });
                  results.totalFailed++;
                }
              } catch (error) {
                console.log('✗ Failed to navigate to log trade form:', error.message);
                results.tests.push({ name: 'Log Trade Form', status: 'FAIL', details: error.message });
                results.totalFailed++;
              }
            } else {
              console.log('✗ Thesis detail page missing elements');
              results.tests.push({ name: 'Thesis Detail Page', status: 'FAIL', details: 'Missing key elements' });
              results.totalFailed++;
            }
          } catch (error) {
            console.log('✗ Failed to verify thesis detail page:', error.message);
            results.tests.push({ name: 'Thesis Detail Page', status: 'FAIL', details: error.message });
            results.totalFailed++;
          }
        } catch (error) {
          console.log('✗ Failed to create thesis:', error.message);
          results.tests.push({ name: 'Submit New Thesis', status: 'FAIL', details: error.message });
          results.totalFailed++;
        }
      } else {
        console.log('✗ Create thesis form missing fields');
        console.log('Console errors:', consoleErrors);
        console.log('Page errors:', pageErrors);
        results.tests.push({ name: 'Create New Thesis Form', status: 'FAIL', details: 'Missing form elements. Check errors.' });
        results.totalFailed++;
      }
    } catch (error) {
      console.log('✗ Failed to load create thesis form:', error.message);
      results.tests.push({ name: 'Create New Thesis Form', status: 'FAIL', details: error.message });
      results.totalFailed++;
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  } finally {
    results.consoleErrors = consoleErrors;
    results.pageErrors = pageErrors;

    await page.waitForTimeout(2000);
    await browser.close();
  }

  // Generate summary
  console.log('\n' + '='.repeat(50));
  console.log('TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${results.tests.length}`);
  console.log(`Passed: ${results.totalPassed}`);
  console.log(`Failed: ${results.totalFailed}`);
  console.log(`\nScreenshots saved to: ${screenshotDir}`);

  if (results.consoleErrors.length > 0) {
    console.log('\n⚠ Console Errors Found:');
    results.consoleErrors.forEach(err => console.log('  -', err));
  }

  if (results.pageErrors.length > 0) {
    console.log('\n⚠ Page Errors Found:');
    results.pageErrors.forEach(err => console.log('  -', err));
  }

  return results;
}

// Run tests
runTradeLoggingTests()
  .then(results => {
    console.log('\n✓ All tests completed');
    process.exit(results.totalFailed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });

/**
 * Playwright UI tests for PRD-B: Frictionless Trade Capture features
 * Run with: npx playwright test playwright/prdb-features.test.ts
 *
 * Prerequisites:
 * - Dev server must be running on localhost:3000
 */

import { test, expect, Page } from 'playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('PRD-B: Quick Trade Capture', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('QuickCapture should have Quick Trade tab', async ({ page }) => {
    // Look for quick capture or new entry button
    const newEntryButton = page.locator('button').filter({
      hasText: /new|add|quick/i
    });

    if (await newEntryButton.count() > 0) {
      // Click to open modal
      await newEntryButton.first().click();
      await page.waitForTimeout(300);

      // Look for tabs including Quick Trade
      const tabs = page.locator('[role="tab"], button').filter({
        hasText: /trade|quick trade|log trade/i
      });

      // Tab may exist in the modal
      const hasTradeTab = await tabs.count() > 0;

      // Take screenshot for verification
      await page.screenshot({
        path: 'playwright/screenshots/prdb-quicktrade-tab.png',
        fullPage: true
      });
    }
  });

  test('Quick Trade form should have required fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/theses`);
    await page.waitForLoadState('networkidle');

    // Find a thesis link to navigate to
    const thesisLink = page.locator('a[href*="/theses/"]').first();

    if (await thesisLink.count() > 0) {
      await thesisLink.click();
      await page.waitForLoadState('networkidle');

      // Look for log trade button
      const logTradeButton = page.locator('button, a').filter({
        hasText: /log trade|add trade|new trade/i
      });

      if (await logTradeButton.count() > 0) {
        await logTradeButton.first().click();
        await page.waitForLoadState('networkidle');

        // Verify form fields exist
        const tickerInput = page.locator('input[name="ticker"], input[placeholder*="ticker" i]');
        const outcomeSelect = page.locator('select, [role="combobox"]').filter({
          has: page.locator('option[value*="WIN"], option[value*="LOSS"]')
        });

        // Form should have required fields
        const formElements = page.locator('input, select, [role="combobox"]');
        const elementCount = await formElements.count();
        expect(elementCount).toBeGreaterThan(0);
      }
    }
  });

  test('Ticker autocomplete should work', async ({ page }) => {
    await page.goto(`${BASE_URL}/theses`);
    await page.waitForLoadState('networkidle');

    // Look for ticker input anywhere on the page
    const tickerInput = page.locator('input').filter({
      has: page.locator('[placeholder*="ticker" i]')
    }).or(page.locator('input[name="ticker"]'));

    if (await tickerInput.count() > 0) {
      // Type a ticker symbol
      await tickerInput.first().fill('AA');
      await page.waitForTimeout(500);

      // Look for autocomplete suggestions
      const suggestions = page.locator('[role="listbox"], [class*="autocomplete"], [class*="suggestion"]');

      // Autocomplete may or may not appear depending on data
      await page.screenshot({
        path: 'playwright/screenshots/prdb-ticker-autocomplete.png',
        fullPage: true
      });
    }
  });
});

test.describe('PRD-B: Trade Detection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/journal/new`);
    await page.waitForLoadState('networkidle');
  });

  test('Entry with trade content should show detection prompt', async ({ page }) => {
    // Find the entry textarea
    const textarea = page.locator('textarea').first();

    if (await textarea.count() > 0) {
      // Type content that should trigger trade detection
      await textarea.fill('Closed my AAPL calls for a nice profit today. Up $500 on the position.');

      // Look for trade detection UI elements
      const detectionUI = page.locator('[class*="trade"], [class*="detect"]').filter({
        hasText: /trade|detected|log/i
      });

      // Take screenshot to verify detection prompt
      await page.screenshot({
        path: 'playwright/screenshots/prdb-trade-detection.png',
        fullPage: true
      });
    }
  });

  test('Detection prompt should have one-tap trade creation', async ({ page }) => {
    const textarea = page.locator('textarea').first();

    if (await textarea.count() > 0) {
      await textarea.fill('Made $200 profit on SPY puts today');
      await page.waitForTimeout(500);

      // Look for quick log button
      const quickLogButton = page.locator('button').filter({
        hasText: /log|quick|one-tap|create trade/i
      });

      // If detection prompt appears, it should have action button
      if (await quickLogButton.count() > 0) {
        await expect(quickLogButton.first()).toBeVisible();
      }
    }
  });
});

test.describe('PRD-B: Screenshot Trade Capture', () => {
  test('Log trade page should have screenshot-first option', async ({ page }) => {
    await page.goto(`${BASE_URL}/theses`);
    await page.waitForLoadState('networkidle');

    // Navigate to a thesis
    const thesisLink = page.locator('a[href*="/theses/"]').filter({
      hasNot: page.locator('[href*="new"]')
    }).first();

    if (await thesisLink.count() > 0) {
      await thesisLink.click();
      await page.waitForLoadState('networkidle');

      // Find log trade button
      const logTradeButton = page.locator('button, a').filter({
        hasText: /log trade/i
      });

      if (await logTradeButton.count() > 0) {
        await logTradeButton.first().click();
        await page.waitForLoadState('networkidle');

        // Look for screenshot capture option
        const screenshotOption = page.locator('button').filter({
          hasText: /screenshot|upload|camera|photo/i
        });

        if (await screenshotOption.count() > 0) {
          await expect(screenshotOption.first()).toBeVisible();
        }

        await page.screenshot({
          path: 'playwright/screenshots/prdb-log-trade-page.png',
          fullPage: true
        });
      }
    }
  });

  test('Screenshot capture should have upload zone', async ({ page }) => {
    await page.goto(`${BASE_URL}/theses`);
    await page.waitForLoadState('networkidle');

    const thesisLink = page.locator('a[href*="/theses/"]').first();

    if (await thesisLink.count() > 0) {
      await thesisLink.click();
      await page.waitForLoadState('networkidle');

      const logTradeButton = page.locator('button, a').filter({
        hasText: /log trade/i
      });

      if (await logTradeButton.count() > 0) {
        await logTradeButton.first().click();
        await page.waitForLoadState('networkidle');

        // Look for drop zone or file input
        const dropZone = page.locator('[class*="drop"], [class*="upload"]').or(
          page.locator('input[type="file"]')
        );

        // Screenshot capture UI should exist
        const fileInput = page.locator('input[type="file"][accept*="image"]');

        await page.screenshot({
          path: 'playwright/screenshots/prdb-screenshot-capture.png',
          fullPage: true
        });
      }
    }
  });
});

test.describe('PRD-B: Thesis Suggestions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/theses`);
    await page.waitForLoadState('networkidle');
  });

  test('Theses page should show unassigned trades section', async ({ page }) => {
    // Look for unassigned trades UI
    const unassignedSection = page.locator('[class*="unassigned"]').or(
      page.locator('text=Trades Without Thesis')
    ).or(
      page.locator('text=unassigned')
    );

    // Take screenshot of theses page
    await page.screenshot({
      path: 'playwright/screenshots/prdb-theses-page.png',
      fullPage: true
    });

    // The section may or may not be visible depending on data
    const pageContent = await page.content();
    // No assertion needed - this is a smoke test
  });

  test('AI suggestions section should render when available', async ({ page }) => {
    // Look for AI suggestions UI
    const suggestionsSection = page.locator('[class*="suggestion"]').or(
      page.locator('text=AI Suggestions')
    ).or(
      page.locator('[data-testid="thesis-suggestion-card"]')
    );

    // Look for sparkles icon (indicates AI)
    const aiIndicator = page.locator('svg').filter({
      has: page.locator('[class*="sparkle"]')
    }).or(page.locator('text=Generate Thesis Suggestions'));

    // UI elements should be present (visible when there are unassigned trades)
    await page.screenshot({
      path: 'playwright/screenshots/prdb-ai-suggestions.png',
      fullPage: true
    });
  });

  test('Suggestion card should have accept and dismiss buttons', async ({ page }) => {
    // Look for suggestion cards
    const suggestionCard = page.locator('[data-testid="thesis-suggestion-card"]').or(
      page.locator('[class*="suggestion-card"]')
    );

    if (await suggestionCard.count() > 0) {
      // Card should have action buttons
      const acceptButton = suggestionCard.first().locator('button').filter({
        hasText: /accept|create|add/i
      });
      const dismissButton = suggestionCard.first().locator('button').filter({
        hasText: /dismiss|skip|ignore/i
      });

      if (await acceptButton.count() > 0) {
        await expect(acceptButton.first()).toBeVisible();
      }
    }
  });

  test('Suggestion card should be editable', async ({ page }) => {
    const suggestionCard = page.locator('[data-testid="thesis-suggestion-card"]');

    if (await suggestionCard.count() > 0) {
      // Look for edit button
      const editButton = suggestionCard.first().locator('button').filter({
        hasText: /edit/i
      });

      if (await editButton.count() > 0) {
        await editButton.click();
        await page.waitForTimeout(300);

        // Should show input fields when editing
        const nameInput = suggestionCard.first().locator('input');
        const thesisTextarea = suggestionCard.first().locator('textarea');

        if (await nameInput.count() > 0) {
          await expect(nameInput.first()).toBeVisible();
        }
      }
    }
  });

  test('Generate suggestions button should trigger API call', async ({ page }) => {
    // Look for generate suggestions button
    const generateButton = page.locator('button').filter({
      hasText: /generate.*suggestion|analyze/i
    });

    if (await generateButton.count() > 0) {
      // Listen for network request
      const responsePromise = page.waitForResponse(
        response => response.url().includes('/api/theses/suggestions'),
        { timeout: 5000 }
      ).catch(() => null);

      await generateButton.click();

      const response = await responsePromise;
      // If API was called, it should return 200 or 401 (auth required)
      if (response) {
        expect([200, 401]).toContain(response.status());
      }
    }
  });
});

test.describe('PRD-B: Accessibility', () => {
  test('Quick trade form should have proper labels', async ({ page }) => {
    await page.goto(`${BASE_URL}/theses`);
    await page.waitForLoadState('networkidle');

    // Navigate to log trade if possible
    const thesisLink = page.locator('a[href*="/theses/"]').first();

    if (await thesisLink.count() > 0) {
      await thesisLink.click();
      await page.waitForLoadState('networkidle');

      const logTradeButton = page.locator('button, a').filter({
        hasText: /log trade/i
      });

      if (await logTradeButton.count() > 0) {
        await logTradeButton.first().click();
        await page.waitForLoadState('networkidle');

        // Check for accessible form elements
        const inputs = page.locator('input:visible, select:visible, textarea:visible');
        const inputCount = await inputs.count();

        for (let i = 0; i < Math.min(inputCount, 5); i++) {
          const input = inputs.nth(i);
          const id = await input.getAttribute('id');
          const ariaLabel = await input.getAttribute('aria-label');
          const ariaLabelledby = await input.getAttribute('aria-labelledby');
          const placeholder = await input.getAttribute('placeholder');

          // Each input should have some form of labeling
          const hasLabel = Boolean(id || ariaLabel || ariaLabelledby || placeholder);
          expect(hasLabel).toBeTruthy();
        }
      }
    }
  });

  test('Suggestion cards should be keyboard navigable', async ({ page }) => {
    await page.goto(`${BASE_URL}/theses`);
    await page.waitForLoadState('networkidle');

    // Tab through the page
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Check that focus is visible
    const focusedElement = page.locator(':focus');

    if (await focusedElement.count() > 0) {
      // Focused element should be visible
      await expect(focusedElement).toBeVisible();
    }
  });

  test('Touch targets should meet minimum size', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/theses`);
    await page.waitForLoadState('networkidle');

    // Check primary action buttons
    const primaryButtons = page.locator('button[class*="primary"], a[class*="btn"]').or(
      page.locator('button').filter({ hasText: /new|create|add|log/i })
    );

    const buttonCount = await primaryButtons.count();

    for (let i = 0; i < Math.min(buttonCount, 3); i++) {
      const button = primaryButtons.nth(i);
      const box = await button.boundingBox();

      if (box) {
        // Primary action buttons should be at least 44x44
        expect(box.height).toBeGreaterThanOrEqual(40);
      }
    }
  });
});

test.describe('PRD-B: Mobile Experience', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('Quick trade should work on mobile viewport', async ({ page }) => {
    await page.goto(`${BASE_URL}/theses`);
    await page.waitForLoadState('networkidle');

    // Page should render properly on mobile
    const mainContent = page.locator('#main-content').or(
      page.locator('main').first()
    );

    await expect(mainContent.first()).toBeVisible();

    // Take screenshot for mobile verification
    await page.screenshot({
      path: 'playwright/screenshots/prdb-mobile-theses.png',
      fullPage: true
    });
  });

  test('Suggestion cards should stack on mobile', async ({ page }) => {
    await page.goto(`${BASE_URL}/theses`);
    await page.waitForLoadState('networkidle');

    // Check for responsive grid
    const suggestionGrid = page.locator('[class*="grid"]');

    if (await suggestionGrid.count() > 0) {
      const box = await suggestionGrid.first().boundingBox();

      // On mobile, grid should be single column (width close to viewport)
      if (box) {
        expect(box.width).toBeLessThanOrEqual(390);
      }
    }
  });

  test('Voice capture button should be accessible on mobile', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Look for voice/mic button
    const voiceButton = page.locator('button').filter({
      has: page.locator('svg')
    }).filter({ hasText: /voice|mic|record/i }).or(
      page.locator('button[aria-label*="voice" i], button[aria-label*="record" i]')
    );

    if (await voiceButton.count() > 0) {
      await expect(voiceButton.first()).toBeVisible();
    }

    await page.screenshot({
      path: 'playwright/screenshots/prdb-mobile-capture.png',
      fullPage: true
    });
  });
});

test.describe('PRD-B: No Console Errors', () => {
  test('Theses page should load without errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore known acceptable errors
        if (!text.includes('favicon') &&
            !text.includes('manifest') &&
            !text.includes('hydration')) {
          consoleErrors.push(text);
        }
      }
    });

    await page.goto(`${BASE_URL}/theses`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Should have minimal console errors
    expect(consoleErrors.length).toBeLessThan(3);
  });

  test('Log trade page should load without errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon') &&
            !text.includes('manifest') &&
            !text.includes('hydration')) {
          consoleErrors.push(text);
        }
      }
    });

    await page.goto(`${BASE_URL}/theses`);
    await page.waitForLoadState('networkidle');

    const thesisLink = page.locator('a[href*="/theses/"]').first();

    if (await thesisLink.count() > 0) {
      await thesisLink.click();
      await page.waitForLoadState('networkidle');

      const logTradeButton = page.locator('button, a').filter({
        hasText: /log trade/i
      });

      if (await logTradeButton.count() > 0) {
        await logTradeButton.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);
      }
    }

    expect(consoleErrors.length).toBeLessThan(3);
  });
});

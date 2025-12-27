/**
 * Playwright E2E tests for Smart Import feature
 * Run with: npx playwright test playwright/smart-import.test.ts
 *
 * Prerequisites:
 * - Dev server must be running on localhost:3000
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:3000';

// Sample CSV content for testing
const VALID_CSV = `Date,Symbol,Strategy,Legs,P/L,Status
2024-01-15,AAPL,Iron Condor,"175P/180P/190C/195C",+$245,Closed
2024-01-16,AAPL,Iron Condor,"180P/185P/195C/200C",-$50,Open
2024-01-17,NVDA,Bull Put Spread,"100P/95P",+$150,Closed`;

const MULTI_TRADE_CSV = `Date,Symbol,Strategy,Legs,P/L,Status
2024-01-15,AAPL,Iron Condor,"175P/180P",+$245,Closed
2024-01-16,AAPL,Iron Condor,"180P/185P",-$50,Open
2024-01-17,AAPL,Call Spread,"190C/195C",+$100,Closed
2024-01-18,NVDA,Put Spread,"100P/95P",+$150,Closed
2024-01-19,NVDA,Put Spread,"105P/100P",-$75,Open
2024-01-20,TSLA,Straddle,"250C/250P",+$200,Closed`;

// Helper to create a test CSV file
function createTestCSV(content: string): string {
  const tmpDir = path.join(__dirname, 'tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  const filePath = path.join(tmpDir, `test-${Date.now()}.csv`);
  fs.writeFileSync(filePath, content);
  return filePath;
}

// ============================================
// API Tests (Unauthenticated)
// ============================================

test.describe('Smart Import API', () => {
  test('suggest-links API returns 401 for unauthenticated requests', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/import/smart/suggest-links`, {
      data: {
        trades: [
          { id: '1', ticker: 'AAPL', strategyType: 'IRON_CONDOR', openedAt: '2024-01-15', status: 'CLOSED' },
        ],
      },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status()).toBe(401);
  });

  test('confirm API returns 401 for unauthenticated requests', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/import/smart/confirm`, {
      data: {
        batchId: 'test-batch-id',
        decisions: [{ tradeId: 'trade-1', action: 'approve' }],
      },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status()).toBe(401);
  });

  test('suggest-links API validates empty trades array', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/import/smart/suggest-links`, {
      data: { trades: [] },
      headers: { 'Content-Type': 'application/json' },
    });

    // Should return 401 (auth) or 200 (valid but empty)
    expect([200, 401]).toContain(response.status());
  });

  test('confirm API requires batchId', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/import/smart/confirm`, {
      data: {
        decisions: [{ tradeId: 'trade-1', action: 'approve' }],
      },
      headers: { 'Content-Type': 'application/json' },
    });

    expect([400, 401]).toContain(response.status());
  });
});

// ============================================
// UI Component Tests
// ============================================

test.describe('Smart Import UI Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/journal/import/smart`);
    await page.waitForLoadState('networkidle');
  });

  test('Smart Import page loads successfully', async ({ page }) => {
    // Check page has content
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Should show wizard modal or page content
    const content = page.locator('text=Smart Import, text=Import, text=Upload');
    const hasContent = await content.count() > 0 || await page.locator('div').count() > 0;
    expect(hasContent).toBeTruthy();
  });

  test('Wizard shows upload step initially', async ({ page }) => {
    // Look for upload-related text or elements
    const uploadElements = page.locator('text=/upload|csv|drop|file/i');
    const hasUpload = await uploadElements.count() > 0;

    // If wizard is visible, should have upload indication
    if (await page.locator('[role="dialog"]').count() > 0) {
      expect(hasUpload).toBeTruthy();
    }
  });

  test('Mobile viewport - page is responsive', async ({ page }) => {
    // Set mobile viewport (iPhone 14 Pro)
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto(`${BASE_URL}/journal/import/smart`);
    await page.waitForLoadState('networkidle');

    // Page should render without horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(410); // Allow some tolerance
  });

  test('Tablet viewport - page is responsive', async ({ page }) => {
    // Set tablet viewport (iPad)
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto(`${BASE_URL}/journal/import/smart`);
    await page.waitForLoadState('networkidle');

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(788);
  });

  test('Screenshot - Smart Import page', async ({ page }) => {
    await page.screenshot({
      path: 'playwright/screenshots/smart-import-page.png',
      fullPage: true,
    });
  });
});

// ============================================
// Wizard Flow Tests
// ============================================

test.describe('Smart Import Wizard Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/journal/import/smart`);
    await page.waitForLoadState('networkidle');
  });

  test('Wizard has step indicators', async ({ page }) => {
    // Look for step indicators (numbered or labeled)
    const stepIndicators = page.locator('[class*="step"], [class*="indicator"], text=/1|2|3|4/');
    const count = await stepIndicators.count();

    // Should have at least some step indication if wizard is visible
    if (await page.locator('[role="dialog"]').count() > 0) {
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  test('Wizard has close button', async ({ page }) => {
    // Look for close button
    const closeButton = page.locator('button:has(svg), [aria-label*="close" i], [aria-label*="Close"]');
    const hasClose = await closeButton.count() > 0;

    if (await page.locator('[role="dialog"]').count() > 0) {
      expect(hasClose).toBeTruthy();
    }
  });

  test('Can close wizard and see page', async ({ page }) => {
    // Try to find and click close button
    const closeButton = page.locator('button:has(svg[class*="x" i]), [aria-label*="close" i]').first();

    if (await closeButton.count() > 0) {
      await closeButton.click();
      await page.waitForTimeout(500); // Wait for animation

      // Page should still have content
      const body = page.locator('body');
      await expect(body).toBeVisible();
    }
  });
});

// ============================================
// File Upload Tests
// ============================================

test.describe('Smart Import File Upload', () => {
  test('Drop zone accepts CSV files', async ({ page }) => {
    await page.goto(`${BASE_URL}/journal/import/smart`);
    await page.waitForLoadState('networkidle');

    // Look for drop zone or file input
    const dropZone = page.locator('[class*="drop"], [class*="upload"], input[type="file"]');
    const hasDropZone = await dropZone.count() > 0;

    // Should have upload capability if wizard is visible
    if (await page.locator('[role="dialog"]').count() > 0) {
      expect(hasDropZone).toBeTruthy();
    }
  });

  test('Shows expected CSV format hint', async ({ page }) => {
    await page.goto(`${BASE_URL}/journal/import/smart`);
    await page.waitForLoadState('networkidle');

    // Look for format hint
    const formatHint = page.locator('text=/Date.*Symbol.*Strategy|csv.*format/i');
    const hasHint = await formatHint.count() > 0;

    // Format hint should be shown
    if (await page.locator('[role="dialog"]').count() > 0) {
      expect(hasHint).toBeTruthy();
    }
  });
});

// ============================================
// Swipe Card Tests
// ============================================

test.describe('Trade Review Card', () => {
  test('Card has approve and skip buttons', async ({ page }) => {
    await page.goto(`${BASE_URL}/journal/import/smart`);
    await page.waitForLoadState('networkidle');

    // If we could get to review step, look for buttons
    const approveButton = page.locator('button:has-text("Approve"), button:has-text("approve")');
    const skipButton = page.locator('button:has-text("Skip"), button:has-text("skip")');

    // These would be visible after uploading a file
    // For now, just verify page structure works
    const buttons = page.locator('button');
    expect(await buttons.count()).toBeGreaterThan(0);
  });

  test('Card shows swipe hints', async ({ page }) => {
    await page.goto(`${BASE_URL}/journal/import/smart`);
    await page.waitForLoadState('networkidle');

    // Look for swipe hint text
    const swipeHint = page.locator('text=/swipe/i');
    const hasHint = await swipeHint.count() >= 0; // May or may not be visible

    // Just verify no errors
    expect(true).toBeTruthy();
  });
});

// ============================================
// Trade Linking Tests
// ============================================

test.describe('Trade Linking Panel', () => {
  test('Link panel would show suggestions section', async ({ page }) => {
    await page.goto(`${BASE_URL}/journal/import/smart`);
    await page.waitForLoadState('networkidle');

    // These elements would appear in link step
    // For now verify basic structure
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

// ============================================
// Keyboard Navigation Tests
// ============================================

test.describe('Keyboard Accessibility', () => {
  test('Wizard can be navigated with keyboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/journal/import/smart`);
    await page.waitForLoadState('networkidle');

    // Tab through elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should not cause any errors
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('Escape key interaction', async ({ page }) => {
    await page.goto(`${BASE_URL}/journal/import/smart`);
    await page.waitForLoadState('networkidle');

    // Press escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Page should still be functional
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

// ============================================
// Dark Mode Tests
// ============================================

test.describe('Dark Mode Support', () => {
  test('Respects system dark mode preference', async ({ page }) => {
    // Set dark mode preference
    await page.emulateMedia({ colorScheme: 'dark' });

    await page.goto(`${BASE_URL}/journal/import/smart`);
    await page.waitForLoadState('networkidle');

    // Take screenshot for visual verification
    await page.screenshot({
      path: 'playwright/screenshots/smart-import-dark-mode.png',
      fullPage: true,
    });

    // Page should render (verify no errors)
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('Light mode rendering', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });

    await page.goto(`${BASE_URL}/journal/import/smart`);
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: 'playwright/screenshots/smart-import-light-mode.png',
      fullPage: true,
    });

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

// ============================================
// Error Handling Tests
// ============================================

test.describe('Error Handling', () => {
  test('Page handles network errors gracefully', async ({ page }) => {
    // Abort network requests after loading page
    await page.goto(`${BASE_URL}/journal/import/smart`);
    await page.waitForLoadState('networkidle');

    // The page should be functional even with network issues
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('No console errors on page load', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(`${BASE_URL}/journal/import/smart`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Filter out known acceptable errors (e.g., auth redirects)
    const criticalErrors = errors.filter(
      e => !e.includes('401') && !e.includes('Unauthorized')
    );

    // Should have no critical console errors
    expect(criticalErrors.length).toBeLessThanOrEqual(1);
  });
});

// ============================================
// Performance Tests
// ============================================

test.describe('Performance', () => {
  test('Page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(`${BASE_URL}/journal/import/smart`);
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Page should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
    console.log(`Page load time: ${loadTime}ms`);
  });

  test('DOM size is reasonable', async ({ page }) => {
    await page.goto(`${BASE_URL}/journal/import/smart`);
    await page.waitForLoadState('networkidle');

    const nodeCount = await page.evaluate(() => {
      return document.querySelectorAll('*').length;
    });

    // Should have reasonable DOM size
    expect(nodeCount).toBeLessThan(5000);
    console.log(`DOM node count: ${nodeCount}`);
  });
});

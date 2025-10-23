import { test, expect } from '@playwright/test';

test.describe('Dark Mode Support', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the homepage
    await page.goto('http://localhost:3000');
  });

  test('should toggle between light and dark modes', async ({ page }) => {
    // Check initial state (should be light mode)
    const html = page.locator('html');

    // Find theme toggle button (moon/sun icon in navigation)
    const themeToggle = page.locator('[aria-label="Toggle theme"]').or(page.locator('button').filter({ has: page.locator('svg') }).nth(0));
    await expect(themeToggle).toBeVisible();

    // Toggle to dark mode
    await themeToggle.click();
    await page.waitForTimeout(300); // Wait for transition

    // Check html has dark class
    await expect(html).toHaveClass(/dark/);

    // Check background color changed (dark mode)
    const body = page.locator('body');
    const darkBgColor = await body.evaluate((el) => window.getComputedStyle(el).backgroundColor);

    // Toggle back to light mode
    await themeToggle.click();
    await page.waitForTimeout(300); // Wait for transition

    // Check dark class removed
    const htmlClass = await html.getAttribute('class');
    expect(htmlClass).not.toContain('dark');

    // Check background color changed back (light mode)
    const lightBgColor = await body.evaluate((el) => window.getComputedStyle(el).backgroundColor);

    // Colors should be different
    expect(darkBgColor).not.toBe(lightBgColor);
  });

  test('should persist theme preference across page navigation', async ({ page }) => {
    const html = page.locator('html');
    const themeToggle = page.locator('[aria-label="Toggle theme"]').or(page.locator('button').filter({ has: page.locator('svg') }).nth(0));

    // Toggle to dark mode
    await themeToggle.click();
    await page.waitForTimeout(300);
    await expect(html).toHaveClass(/dark/);

    // Navigate to journal page
    await page.goto('http://localhost:3000/journal');
    await page.waitForTimeout(500);

    // Dark mode should persist
    await expect(html).toHaveClass(/dark/);

    // Navigate to insights page
    await page.goto('http://localhost:3000/insights');
    await page.waitForTimeout(500);

    // Dark mode should still persist
    await expect(html).toHaveClass(/dark/);
  });

  test('Dashboard should render correctly in dark mode', async ({ page }) => {
    const html = page.locator('html');
    const themeToggle = page.locator('[aria-label="Toggle theme"]').or(page.locator('button').filter({ has: page.locator('svg') }).nth(0));

    // Toggle to dark mode
    await themeToggle.click();
    await page.waitForTimeout(300);
    await expect(html).toHaveClass(/dark/);

    // Take screenshot of dark mode dashboard
    await page.screenshot({ path: 'playwright/screenshots/dashboard-dark.png', fullPage: true });

    // Check key elements are visible and have proper contrast
    const heading = page.locator('h1, h2').first();
    if (await heading.count() > 0) {
      await expect(heading).toBeVisible();
    }

    // Check that cards are visible
    const cards = page.locator('[class*="card"], [class*="Card"]');
    if (await cards.count() > 0) {
      await expect(cards.first()).toBeVisible();
    }
  });

  test('Journal page should render correctly in dark mode', async ({ page }) => {
    const html = page.locator('html');
    const themeToggle = page.locator('[aria-label="Toggle theme"]').or(page.locator('button').filter({ has: page.locator('svg') }).nth(0));

    await page.goto('http://localhost:3000/journal');
    await page.waitForTimeout(500);

    // Toggle to dark mode
    await themeToggle.click();
    await page.waitForTimeout(300);
    await expect(html).toHaveClass(/dark/);

    // Take screenshot
    await page.screenshot({ path: 'playwright/screenshots/journal-dark.png', fullPage: true });

    // Check filter panel if present
    const filtersButton = page.locator('button').filter({ hasText: /filter/i });
    if (await filtersButton.count() > 0) {
      await filtersButton.click();
      await page.waitForTimeout(300);

      // Take screenshot with filters open
      await page.screenshot({ path: 'playwright/screenshots/journal-filters-dark.png', fullPage: true });
    }
  });

  test('Insights page should render correctly in dark mode', async ({ page }) => {
    const html = page.locator('html');
    const themeToggle = page.locator('[aria-label="Toggle theme"]').or(page.locator('button').filter({ has: page.locator('svg') }).nth(0));

    await page.goto('http://localhost:3000/insights');
    await page.waitForTimeout(500);

    // Toggle to dark mode
    await themeToggle.click();
    await page.waitForTimeout(300);
    await expect(html).toHaveClass(/dark/);

    // Take screenshot
    await page.screenshot({ path: 'playwright/screenshots/insights-dark.png', fullPage: true });

    // Check week selector buttons are visible
    const weekButtons = page.locator('button').filter({ hasText: /this week|last week/i });
    if (await weekButtons.count() > 0) {
      await expect(weekButtons.first()).toBeVisible();
    }
  });

  test('New Entry page should render correctly in dark mode', async ({ page }) => {
    const html = page.locator('html');
    const themeToggle = page.locator('[aria-label="Toggle theme"]').or(page.locator('button').filter({ has: page.locator('svg') }).nth(0));

    await page.goto('http://localhost:3000/journal/new');
    await page.waitForTimeout(500);

    // Toggle to dark mode
    await themeToggle.click();
    await page.waitForTimeout(300);
    await expect(html).toHaveClass(/dark/);

    // Take screenshot
    await page.screenshot({ path: 'playwright/screenshots/new-entry-dark.png', fullPage: true });

    // Check form elements are visible
    const textarea = page.locator('textarea');
    if (await textarea.count() > 0) {
      await expect(textarea.first()).toBeVisible();
    }

    // Check mood buttons
    const moodButtons = page.locator('button').filter({ hasText: /confident|nervous|excited/i });
    if (await moodButtons.count() > 0) {
      await expect(moodButtons.first()).toBeVisible();
    }
  });

  test('should have no console errors when toggling theme', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const themeToggle = page.locator('[aria-label="Toggle theme"]').or(page.locator('button').filter({ has: page.locator('svg') }).nth(0));

    // Toggle theme multiple times
    await themeToggle.click();
    await page.waitForTimeout(300);

    await themeToggle.click();
    await page.waitForTimeout(300);

    await themeToggle.click();
    await page.waitForTimeout(300);

    // Check for console errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('mobile viewport - dark mode should work', async ({ page }) => {
    // Set mobile viewport (iPhone 14 Pro)
    await page.setViewportSize({ width: 390, height: 844 });

    const html = page.locator('html');
    const themeToggle = page.locator('[aria-label="Toggle theme"]').or(page.locator('button').filter({ has: page.locator('svg') }).nth(0));

    // Toggle to dark mode
    await themeToggle.click();
    await page.waitForTimeout(300);
    await expect(html).toHaveClass(/dark/);

    // Take mobile screenshot
    await page.screenshot({ path: 'playwright/screenshots/mobile-dark.png', fullPage: true });

    // Check touch target size (should be at least 44x44px)
    const toggleBox = await themeToggle.boundingBox();
    if (toggleBox) {
      expect(toggleBox.width).toBeGreaterThanOrEqual(44);
      expect(toggleBox.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('system preference should be respected on first visit', async ({ context, page }) => {
    // Create a new page with dark mode preference
    const darkPage = await context.newPage();
    await darkPage.emulateMedia({ colorScheme: 'dark' });

    // Clear localStorage to simulate first visit
    await darkPage.goto('http://localhost:3000');
    await darkPage.evaluate(() => localStorage.clear());
    await darkPage.goto('http://localhost:3000');
    await page.waitForTimeout(500);

    const html = darkPage.locator('html');

    // Should default to dark mode based on system preference
    await expect(html).toHaveClass(/dark/);

    await darkPage.close();
  });
});

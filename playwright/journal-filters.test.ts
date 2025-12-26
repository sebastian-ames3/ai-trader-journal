import { test, expect } from '@playwright/test';

/**
 * Journal Filters UI Tests
 *
 * These tests verify the fix for the client-side crash when clicking the "Filters" button.
 * The issue was caused by Radix UI Select components using empty string "" as values,
 * which creates an inconsistent state and crashes when the filter panel renders.
 *
 * Fix: Changed Select components to use "_all" as a sentinel value instead of "".
 *
 * Prerequisites:
 * 1. Dev server must be running (npm run dev)
 * 2. User must be authenticated (tests require login)
 * 3. Database connection must be active
 *
 * Manual Verification Steps (if E2E tests can't run):
 * 1. Start the dev server: npm run dev
 * 2. Log in to the application
 * 3. Navigate to /journal
 * 4. Click the "Filters" button
 * 5. Verify the filter panel opens WITHOUT a client-side crash
 * 6. Click each dropdown (Type, Mood, Conviction, Sentiment)
 * 7. Verify dropdowns open and show options correctly
 * 8. Select an option and verify it applies
 * 9. Select "All [type]" option and verify it clears the filter
 */

test.describe('Journal Filters', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the journal page
    // Note: These tests require authentication. If redirected to login,
    // tests will fail. Run manually with authenticated session.
    await page.goto('http://localhost:3000/journal');
    await page.waitForTimeout(500);
  });

  test('should open filters panel without crashing', async ({ page }) => {
    // Listen for page errors (client-side exceptions)
    const pageErrors: Error[] = [];
    page.on('pageerror', (error) => {
      pageErrors.push(error);
    });

    // Find and click the Filters button
    const filtersButton = page.locator('button').filter({ hasText: /Filters/i });
    await expect(filtersButton).toBeVisible();
    await filtersButton.click();

    // Wait for the filter panel to open
    await page.waitForTimeout(500);

    // Verify no page errors occurred
    expect(pageErrors).toHaveLength(0);

    // Verify the filter panel is visible (check for a label in the advanced filters)
    const typeLabel = page.locator('label').filter({ hasText: /Type/i });
    await expect(typeLabel).toBeVisible();
  });

  test('should display all filter dropdowns correctly', async ({ page }) => {
    // Click the Filters button
    const filtersButton = page.locator('button').filter({ hasText: /Filters/i });
    await filtersButton.click();
    await page.waitForTimeout(300);

    // Verify all filter sections are visible
    const typeLabel = page.locator('label').filter({ hasText: /^Type$/i });
    const moodLabel = page.locator('label').filter({ hasText: /Mood/i });
    const convictionLabel = page.locator('label').filter({ hasText: /Conviction/i });
    const sentimentLabel = page.locator('label').filter({ hasText: /Sentiment/i });

    await expect(typeLabel).toBeVisible();
    await expect(moodLabel).toBeVisible();
    await expect(convictionLabel).toBeVisible();
    await expect(sentimentLabel).toBeVisible();
  });

  test('should open Type dropdown without crashing', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (error) => {
      pageErrors.push(error);
    });

    // Click the Filters button
    const filtersButton = page.locator('button').filter({ hasText: /Filters/i });
    await filtersButton.click();
    await page.waitForTimeout(300);

    // Click the Type dropdown trigger
    const typeSelect = page.locator('button[role="combobox"]').first();
    await typeSelect.click();
    await page.waitForTimeout(300);

    // Verify dropdown options are visible
    const allTypesOption = page.locator('[role="option"]').filter({ hasText: /All types/i });
    await expect(allTypesOption).toBeVisible();

    // Verify no errors
    expect(pageErrors).toHaveLength(0);
  });

  test('should select a filter option and update state', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (error) => {
      pageErrors.push(error);
    });

    // Click the Filters button
    const filtersButton = page.locator('button').filter({ hasText: /Filters/i });
    await filtersButton.click();
    await page.waitForTimeout(300);

    // Click the Type dropdown
    const typeSelect = page.locator('button[role="combobox"]').first();
    await typeSelect.click();
    await page.waitForTimeout(300);

    // Select "Reflection" option
    const reflectionOption = page.locator('[role="option"]').filter({ hasText: /Reflection/i });
    await reflectionOption.click();
    await page.waitForTimeout(300);

    // Verify the selection was applied (dropdown should now show "Reflection")
    await expect(typeSelect).toContainText('Reflection');

    // Verify no errors
    expect(pageErrors).toHaveLength(0);
  });

  test('should clear filter selection by choosing All option', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (error) => {
      pageErrors.push(error);
    });

    // Click the Filters button
    const filtersButton = page.locator('button').filter({ hasText: /Filters/i });
    await filtersButton.click();
    await page.waitForTimeout(300);

    // Click the Type dropdown and select an option
    const typeSelect = page.locator('button[role="combobox"]').first();
    await typeSelect.click();
    await page.waitForTimeout(300);

    const tradeOption = page.locator('[role="option"]').filter({ hasText: /^Trade$/i });
    await tradeOption.click();
    await page.waitForTimeout(300);

    // Now clear by selecting "All types"
    await typeSelect.click();
    await page.waitForTimeout(300);

    const allTypesOption = page.locator('[role="option"]').filter({ hasText: /All types/i });
    await allTypesOption.click();
    await page.waitForTimeout(300);

    // Verify "All types" is shown (default state)
    await expect(typeSelect).toContainText('All types');

    // Verify no errors
    expect(pageErrors).toHaveLength(0);
  });

  test('should toggle biases filter chips without crashing', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (error) => {
      pageErrors.push(error);
    });

    // Click the Filters button
    const filtersButton = page.locator('button').filter({ hasText: /Filters/i });
    await filtersButton.click();
    await page.waitForTimeout(300);

    // Find a bias chip (e.g., "FOMO")
    const fomoChip = page.locator('[class*="Badge"]').filter({ hasText: /FOMO/i });
    if (await fomoChip.count() > 0) {
      await fomoChip.click();
      await page.waitForTimeout(200);

      // Verify no errors after clicking bias chip
      expect(pageErrors).toHaveLength(0);
    }
  });

  test('should handle rapid filter button toggling without crashing', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (error) => {
      pageErrors.push(error);
    });

    const filtersButton = page.locator('button').filter({ hasText: /Filters/i });

    // Rapidly toggle filters panel
    for (let i = 0; i < 5; i++) {
      await filtersButton.click();
      await page.waitForTimeout(100);
    }

    await page.waitForTimeout(300);

    // Verify no errors
    expect(pageErrors).toHaveLength(0);
  });

  test('mobile viewport - filters should work correctly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });

    const pageErrors: Error[] = [];
    page.on('pageerror', (error) => {
      pageErrors.push(error);
    });

    // Click the Filters button
    const filtersButton = page.locator('button').filter({ hasText: /Filters/i });
    await expect(filtersButton).toBeVisible();
    await filtersButton.click();
    await page.waitForTimeout(500);

    // Verify filter panel opened
    const typeLabel = page.locator('label').filter({ hasText: /Type/i });
    await expect(typeLabel).toBeVisible();

    // Verify no errors
    expect(pageErrors).toHaveLength(0);
  });
});

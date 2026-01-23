import { test, expect } from '@playwright/test';

test.describe('Search Functionality', () => {
  test('should allow a user to search for venues', async ({ page }) => {
    await page.goto('/');

    // Fill the location input
    await page.getByPlaceholder('City, State, or Zip Code').fill('Austin, TX');

    // Click the "Show Advanced Filters" button
    await page.getByRole('button', { name: 'Show Advanced Filters' }).click();
    await page.waitForLoadState('domcontentloaded');

    // Fill the date input
    await page.locator('input#date').fill('2025-12-25');

    // Select a type from the dropdown
    await page.locator('select#type').selectOption('music');

    // Click the search button
    await page.getByRole('button', { name: 'Search Now' }).click();

    // Verify that at least one search result card is displayed
    await expect(page.locator('.bg-white.rounded-xl.shadow-lg.overflow-hidden')).toBeVisible();
  });
});

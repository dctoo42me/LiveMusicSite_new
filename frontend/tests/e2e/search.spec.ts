import { test, expect } from '@playwright/test';

test.describe('Search Functionality', () => {
  test('should allow a user to search for venues', async ({ page }) => {
        await page.goto('/');
        
        // Fill the location input
        await page.getByRole('textbox', { name: 'Location' }).fill('Austin, TX');
        // Click the "More Search Options" button
    await page.getByRole('button', { name: 'More Search Options' }).click();

    // Fill the date inputs
    await page.getByLabel('From Date').fill('2025-12-25');
    await page.getByLabel('To Date').fill('2025-12-31');

    // Select a type from the dropdown - using Mui Select logic might need a click then MenuItem select
    // But let's see if label/id works first
    await page.getByLabel('Type', { exact: true }).click();
    await page.getByRole('option', { name: 'Music Only' }).click();

    // Click the search button
    await page.getByRole('button', { name: 'Search', exact: true }).click();

    // Verify that at least one search result card is displayed
    await expect(page.getByTestId('search-results').locator('.MuiCard-root').first()).toBeVisible();
  });
});

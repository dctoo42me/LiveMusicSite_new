import { test, expect } from '@playwright/test';

test.describe('Meals Page', () => {
  test('should display the Meal Options heading and content', async ({ page }) => {
    await page.goto('/meals');

    // Assert that the "Meal Options" heading is visible
    await expect(page.getByRole('heading', { name: 'Meal Options' })).toBeVisible();

    // Assert that a part of the descriptive text is visible
    await expect(page.getByText('This page will feature venues with notable meal options.')).toBeVisible();
    
    // Assert that the page title is correct
    await expect(page).toHaveTitle(/Meal Options/);
  });
});

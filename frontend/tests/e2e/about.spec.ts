import { test, expect } from '@playwright/test';

test.describe('About Page', () => {
  test('should display the About Us heading and content', async ({ page }) => {
    await page.goto('/about');

    // Assert that the "About Us" heading is visible
    await expect(page.getByRole('heading', { name: 'About Us' })).toBeVisible();

    // Assert that a part of the descriptive text is visible
    await expect(page.getByText('Welcome to Forks & Feedback, your curated guide to the intersection of great food and live entertainment. We go beyond simple listings to provide a comprehensive discovery platform for your next unforgettable outing.')).toBeVisible();
    
    // Assert that the page title is correct
    await expect(page).toHaveTitle(/About Us/);
  });
});

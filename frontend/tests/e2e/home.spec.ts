import { test, expect } from '@playwright/test';

test('homepage has a header', async ({ page }) => {
  await page.goto('/');

  // Check for the main heading text
  await expect(page.locator('header')).toBeVisible();
  
  // Use a more specific locator to avoid strict mode violations
  const heading = page.getByRole('link', { name: 'Forks & Feedback' });
  await expect(heading).toBeVisible();
});

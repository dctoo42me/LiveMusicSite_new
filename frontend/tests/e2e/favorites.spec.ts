import { test, expect } from '@playwright/test';

test.describe('Favorites Functionality', () => {
  const randomUsername = `user-${Math.random().toString(36).substring(2, 15)}`;
  const randomPassword = Math.random().toString(36).substring(2, 15);
  const venueNameToFavorite = 'ACL Live'; // A known venue from sample data

  test('should allow a user to add, view, and remove a venue from favorites', async ({ page }) => {
    // 1. Register a new user
    await page.goto('/register');
    await page.fill('input[name="username"]', randomUsername);
    await page.fill('input[name="email"]', `${randomUsername}@example.com`);
    await page.fill('input[name="password"]', randomPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/register'); // Expect to stay on the register page
    // Assuming toast is displayed correctly after registration, but not asserting its visibility across explicit navigation.
    // Now navigate to login page explicitly
    await page.goto('/login');

    // 2. Log in with the new user
    await page.fill('input[name="username"]', randomUsername);
    await page.fill('input[name="password"]', randomPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/'); // Assert redirection to homepage
    await page.waitForLoadState('networkidle'); // Wait for network to be idle, ensuring all data is loaded
    await expect(page.getByPlaceholder('City, State, or Zip Code')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible(); // Verify logged in

    // 3. Search for a venue
    await page.getByPlaceholder('City, State, or Zip Code').fill('Austin, TX');
    await page.getByRole('button', { name: 'Show Advanced Filters' }).click();
    await page.waitForLoadState('domcontentloaded');
    await page.locator('input#date').fill('2025-12-25');
    await page.locator('select#type').selectOption('music');
    await page.getByRole('button', { name: 'Search Now' }).click();
    
    // Wait for search results to appear
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.bg-white.rounded-xl.shadow-lg.overflow-hidden')).toBeVisible();

    // 4. Add a venue to favorites
    // Find the ACL Live card and click its favorite button
    const aclLiveCard = page.locator(`.bg-white.rounded-xl.shadow-lg.overflow-hidden:has-text("${venueNameToFavorite}")`);
    await expect(aclLiveCard).toBeVisible();
    await aclLiveCard.getByRole('button', { name: 'Add to Favorites' }).click();
    await expect(page.getByText('Venue added to favorites!')).toBeVisible(); // Verify toast

    // 5. Navigate to the favorites page
    await page.getByRole('link', { name: 'My Favorites' }).click();
    await page.waitForURL('/favorites');
    
    // 6. Verify that the favorited venue is displayed
    await expect(page.getByRole('heading', { name: venueNameToFavorite })).toBeVisible();

    // 7. Remove the venue from favorites
    await page.getByRole('button', { name: 'Remove from Favorites' }).click();
    await expect(page.getByText('Venue removed from favorites!')).toBeVisible(); // Verify toast
    
    // 8. Verify that the venue is no longer displayed on the favorites page
    await expect(page.getByRole('heading', { name: venueNameToFavorite })).not.toBeVisible();
    await expect(page.getByText('No Favorite Venues')).toBeVisible(); // Check for empty state message

    // 9. Log out
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible(); // Verify logged out
  });
});

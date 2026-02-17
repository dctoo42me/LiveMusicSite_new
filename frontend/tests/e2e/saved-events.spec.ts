import { test, expect } from '@playwright/test';

test.describe('Saved Events Functionality', () => {
  const randomUsername = `user-${Math.random().toString(36).substring(2, 15)}`;
  const randomEmail = `${randomUsername}@example.com`;
  const randomPassword = Math.random().toString(36).substring(2, 15);
  const venueNameToSearch = 'ACL Live'; // A known venue from sample data

  test('should allow a user to save, view, and remove an event from their schedule', async ({ page }) => {
    // 1. Register a new user
    await page.goto('/register');
    await page.fill('input[name="username"]', randomUsername);
    await page.fill('input[name="email"]', randomEmail);
    await page.fill('input[name="password"]', randomPassword);
    await page.click('button[type="submit"]');
    
    // After registration, should be redirected to login
    await expect(page).toHaveURL('/login');

    // 2. Log in with the new user
    await page.fill('input[name="email"]', randomEmail);
    await page.fill('input[name="password"]', randomPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/'); 
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();

    // 3. Search for a venue to get to its details page
    await page.getByRole('textbox', { name: 'Location' }).fill('Austin, TX');
    await page.getByRole('button', { name: 'More Search Options' }).click(); // Add this line
    await page.getByLabel('From Date').fill('2025-12-25'); // Add this line
    await page.getByLabel('To Date').fill('2025-12-31'); // Add this line
    await page.getByLabel('Type', { exact: true }).click(); // Add this line
    await page.getByRole('option', { name: 'Music Only' }).click(); // Add this line
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    
    // Add robust waits for search results
    await page.waitForLoadState('networkidle'); // Wait for all network activity to cease
    await page.waitForSelector('.MuiCard-root'); // Wait for any venue card to appear in the DOM

    // Wait for search results
    const venueCard = page.getByTestId('search-results').locator(`.MuiCard-root:has-text("${venueNameToSearch}")`).first();
    await venueCard.scrollIntoViewIfNeeded(); // Scroll the card into view if it's not already
    console.log('Venue Card Text Content:', await venueCard.textContent()); // Debugging
    await expect(venueCard).toBeVisible({ timeout: 10000 }); // Ensure the card is visible with extended timeout
    
    // 4. Go to Venue Details
    const detailsButton = venueCard.getByText('Details'); // More direct way to find the button by its text
    await expect(detailsButton).toBeVisible({ timeout: 10000 }); // Ensure the button is visible, with extended timeout
    await expect(detailsButton).toBeEnabled(); // Ensure the button is enabled
    await detailsButton.click();
    await expect(page).toHaveURL(/\/venues\/\d+/);
    await expect(page.getByRole('heading', { name: venueNameToSearch })).toBeVisible();

    // 5. Save an event
    // Find the first save button in the Upcoming Events list
    const saveEventButton = page.locator('button[aria-label="save event"]').first();
    await expect(saveEventButton).toBeVisible();
    await saveEventButton.click();
    await expect(page.getByText('Event saved to your schedule!')).toBeVisible();

    // 6. Navigate to My Schedule
    await page.getByRole('link', { name: 'My Schedule' }).click();
    await page.waitForURL('/saved-events');
    
    // 7. Verify the event is in the schedule
    await expect(page.getByRole('heading', { name: venueNameToSearch })).toBeVisible();

    // 8. Remove the event from schedule
    await page.locator('button:has(svg[data-testid="DeleteIcon"])').first().click();
    await expect(page.getByText('Event removed from your schedule.')).toBeVisible();
    
    // 9. Verify it's gone
    await expect(page.getByRole('heading', { name: venueNameToSearch })).not.toBeVisible();
    await expect(page.getByText('Your schedule is empty.')).toBeVisible();
  });
});

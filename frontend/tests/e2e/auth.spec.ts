import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  const randomUsername = `user-${Math.random().toString(36).substring(2, 15)}`;
  const randomPassword = Math.random().toString(36).substring(2, 15);

  test('should allow a user to register, log in, and log out', async ({ page }) => {
    // Registration
    await page.goto('/register');
    await page.fill('input[name="username"]', randomUsername);
    await page.fill('input[name="email"]', `${randomUsername}@example.com`);
    await page.fill('input[name="password"]', randomPassword);
    await page.click('button[type="submit"]');
    
    // After registration, the user should be redirected to the login page
    await expect(page).toHaveURL('/login'); 

    // Login
    await page.fill('input[name="email"]', `${randomUsername}@example.com`);
    await page.fill('input[name="password"]', randomPassword);
    await page.click('button[type="submit"]');
    
    // Wait for success toast
    await expect(page.getByText('Login successful!')).toBeVisible();
    
    // After login, wait for the URL to be the homepage
    await page.waitForURL('/', { timeout: 10000 }); // Explicitly wait for the homepage URL
    await page.waitForLoadState('networkidle'); // Wait for network to be idle, ensuring all data is loaded
    await expect(page.getByPlaceholder('City, State, or Zip Code')).toBeVisible(); // Assert a main content element is visible
    
    // The header should now show a "Logout" button
    const logoutButton = page.getByRole('button', { name: 'Logout' });
    await expect(logoutButton).toBeVisible();
    
    // Logout
    await logoutButton.click();
    
    // After logout, the user should see the "Login" button again
    const loginButton = page.getByRole('link', { name: 'Login' });
    await expect(loginButton).toBeVisible();
  });
});

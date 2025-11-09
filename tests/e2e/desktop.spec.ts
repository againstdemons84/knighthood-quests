import { test, expect } from '@playwright/test';

// Desktop-specific tests - device configuration is handled by project config
test.describe('Desktop App Loading', () => {

  test('should load the intro page successfully on desktop', async ({ page }) => {
    // Navigate to the application
    await page.goto('/knighthood-quests');
    
    // Wait for the intro page to load
    await expect(page.locator('h1').getByText('Assault on the Castle')).toBeVisible();
    
    // Check that the intro page content is present
    await expect(page.getByText(/Launch your siege on the fortress/i)).toBeVisible();
    
    // Check that the intro button is present
    await expect(page.getByRole('button', { name: /Begin Your Assault on the Castle/i })).toBeVisible();
  });

  test('should navigate from intro to main planning page on desktop', async ({ page }) => {
    await page.goto('/knighthood-quests');
    
    // Wait for the intro page to load
    await expect(page.locator('h1').getByText('Assault on the Castle')).toBeVisible();
    
    // Click the button to proceed to the main interface
    await page.getByRole('button', { name: /Begin Your Assault on the Castle/i }).click();
    
    // Wait for the main planning interface to load
    await expect(page.getByRole('heading', { name: /Plan Your Assault on the Castle/i })).toBeVisible();
    
    // On desktop, look for the longer header text that includes "KNIGHTHOOD"
    await expect(page.getByText(/Assault on the Castle of in the pursuit of KNIGHTHOOD/i)).toBeVisible({ timeout: 10000 });
    
    // Wait for the page to fully load by checking for workout loading or content
    await expect(page.getByText(/Arsenal of SUFFERING/i)).toBeVisible({ timeout: 10000 });
  });

  test('should display workout selection interface on desktop', async ({ page }) => {
    await page.goto('/knighthood-quests');
    
    // Navigate past intro page
    await expect(page.locator('h1').getByText('Assault on the Castle')).toBeVisible();
    await page.getByRole('button', { name: /Begin Your Assault on the Castle/i }).click();
    
    // Wait for main interface
    await expect(page.getByRole('heading', { name: /Plan Your Assault on the Castle/i })).toBeVisible();
    
    // Wait for workout data to load - look for search input or workout list
    await page.waitForSelector('input[placeholder*="Search"], [data-testid*="workout"], table, .workout-row', { timeout: 15000 });
    
    // Now we should see some workout interface elements
    const hasSearch = await page.locator('input[placeholder*="Search"]').count() > 0;
    const hasWorkoutElements = await page.locator('[data-testid*="workout"], table, .workout-row').count() > 0;
    
    expect(hasSearch || hasWorkoutElements).toBe(true);
  });
});
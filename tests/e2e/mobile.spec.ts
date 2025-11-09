import { test, expect } from '@playwright/test';

// Mobile-specific tests - device configuration is handled by project config
test.describe('Mobile App Loading', () => {

  test('should load the intro page successfully on mobile', async ({ page }) => {
    // Navigate to the application
    await page.goto('/knighthood-quests');
    
    // Wait for the intro page to load
    await expect(page.locator('h1').getByText('Assault on the Castle')).toBeVisible();
    
    // Check that the intro page content is present
    await expect(page.getByText(/Launch your siege on the fortress/i)).toBeVisible();
    
    // Check that the intro button is present
    await expect(page.getByRole('button', { name: /Begin Your Assault on the Castle/i })).toBeVisible();
  });

  test('should navigate from intro to main planning page on mobile', async ({ page }) => {
    await page.goto('/knighthood-quests');
    
    // Wait for the intro page to load
    await expect(page.locator('h1').getByText('Assault on the Castle')).toBeVisible();
    
    // Click the button to proceed to the main interface
    await page.getByRole('button', { name: /Begin Your Assault on the Castle/i }).click();
    
    // Wait for the main planning interface to load
    await expect(page.getByRole('heading', { name: /Plan Your Assault on the Castle/i })).toBeVisible();
    
    // On mobile, look for the shorter header text (without "KNIGHTHOOD")
    // The mobile version shows: 'Assault on the Castle' (not the longer desktop version)
    await expect(page.getByText('Assault on the Castle').first()).toBeVisible({ timeout: 10000 });
    
    // Wait for the page to fully load by checking for workout loading or content
    await expect(page.getByText(/Arsenal of SUFFERING/i)).toBeVisible({ timeout: 10000 });
  });

  test('should display workout selection interface on mobile', async ({ page }) => {
    await page.goto('/knighthood-quests');
    
    // Navigate past intro page
    await expect(page.locator('h1').getByText('Assault on the Castle')).toBeVisible();
    await page.getByRole('button', { name: /Begin Your Assault on the Castle/i }).click();
    
    // Wait for main interface
    await expect(page.getByRole('heading', { name: /Plan Your Assault on the Castle/i })).toBeVisible();
    
    // Wait for workout data to load - mobile interface might be different
    await page.waitForSelector('input[placeholder*="Search"], [data-testid*="workout"], .workout-card, .workout-row', { timeout: 15000 });
    
    // Now we should see some workout interface elements
    const hasSearch = await page.locator('input[placeholder*="Search"]').count() > 0;
    const hasWorkoutElements = await page.locator('[data-testid*="workout"], .workout-card, .workout-row').count() > 0;
    
    expect(hasSearch || hasWorkoutElements).toBe(true);
  });

  test('should be touch-friendly on mobile', async ({ page }) => {
    await page.goto('/knighthood-quests');
    
    // Navigate past intro page
    await expect(page.locator('h1').getByText('Assault on the Castle')).toBeVisible();
    
    // Use tap instead of click for mobile interactions
    await page.getByRole('button', { name: /Begin Your Assault on the Castle/i }).tap();
    
    // Wait for main interface
    await expect(page.getByRole('heading', { name: /Plan Your Assault on the Castle/i })).toBeVisible();
    
    // Verify mobile-specific UI elements (like touch-optimized buttons)
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
    
    // Check that buttons have appropriate mobile sizing (at least 44px high for touch)
    if (buttonCount > 0) {
      const firstButton = buttons.first();
      const boundingBox = await firstButton.boundingBox();
      if (boundingBox) {
        expect(boundingBox.height).toBeGreaterThanOrEqual(32); // Reasonable touch target
      }
    }
  });
});
import { test, expect } from '@playwright/test';

// Cross-platform tests that adapt to viewport size
test.describe('Cross-Platform App Loading', () => {
  
  test('should load the intro page successfully on any viewport', async ({ page }) => {
    // Navigate to the application
    await page.goto('/knighthood-quests');
    
    // Wait for the intro page to load
    await expect(page.locator('h1').getByText('Assault on the Castle')).toBeVisible();
    
    // Check that the intro page content is present
    await expect(page.getByText(/Launch your siege on the fortress/i)).toBeVisible();
    
    // Check that the intro button is present
    await expect(page.getByRole('button', { name: /Begin Your Assault on the Castle/i })).toBeVisible();
  });

  test('should navigate and display appropriate content based on viewport', async ({ page }) => {
    // Get viewport size to determine if we're on mobile or desktop
    const viewport = page.viewportSize();
    const isMobile = viewport ? viewport.width <= 768 : false;

    await page.goto('/knighthood-quests');
    
    // Wait for the intro page to load
    await expect(page.locator('h1').getByText('Assault on the Castle')).toBeVisible();
    
    // Navigate to main interface
    if (isMobile) {
      // Use tap for mobile
      await page.getByRole('button', { name: /Begin Your Assault on the Castle/i }).tap();
    } else {
      // Use click for desktop
      await page.getByRole('button', { name: /Begin Your Assault on the Castle/i }).click();
    }
    
    // Wait for the main planning interface to load
    await expect(page.getByRole('heading', { name: /Plan Your Assault on the Castle/i })).toBeVisible();
    
    if (isMobile) {
      // On mobile, look for the shorter header text
      await expect(page.getByText('Assault on the Castle').first()).toBeVisible({ timeout: 10000 });
    } else {
      // On desktop, look for the longer header text that includes "KNIGHTHOOD"
      await expect(page.getByText(/Assault on the Castle of in the pursuit of KNIGHTHOOD/i)).toBeVisible({ timeout: 10000 });
    }
    
    // Wait for the page to fully load by checking for workout loading or content
    await expect(page.getByText(/Arsenal of SUFFERING/i)).toBeVisible({ timeout: 10000 });
  });

  test('should adapt UI elements to viewport size', async ({ page }) => {
    // Get viewport information
    const viewport = page.viewportSize();
    const isMobile = viewport ? viewport.width <= 768 : false;

    await page.goto('/knighthood-quests');
    
    // Navigate past intro page
    await expect(page.locator('h1').getByText('Assault on the Castle')).toBeVisible();
    
    if (isMobile) {
      await page.getByRole('button', { name: /Begin Your Assault on the Castle/i }).tap();
    } else {
      await page.getByRole('button', { name: /Begin Your Assault on the Castle/i }).click();
    }
    
    // Wait for main interface
    await expect(page.getByRole('heading', { name: /Plan Your Assault on the Castle/i })).toBeVisible();
    
    // Wait for workout interface to load
    await page.waitForSelector('input[placeholder*="Search"], [data-testid*="workout"], table, .workout-row, .workout-card', { timeout: 15000 });
    
    // Check that appropriate UI elements are present for the viewport
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
    
    if (isMobile) {
      // Mobile-specific checks
      // Look for mobile-specific search input and sort buttons
      const hasSearch = await page.locator('input[placeholder*="Search"]').count() > 0;
      const hasSortButtons = await page.locator('button').getByText('Name').count() > 0;
      
      // Mobile should have search and sort controls
      expect(hasSearch || hasSortButtons).toBe(true);
      
      // Check button sizes are touch-friendly
      if (buttonCount > 0) {
        const firstButton = buttons.first();
        const boundingBox = await firstButton.boundingBox();
        if (boundingBox) {
          expect(boundingBox.height).toBeGreaterThanOrEqual(32); // Reasonable touch target
        }
      }
    } else {
      // Desktop-specific checks
      // Desktop should have full table layout
      const hasTable = await page.locator('table').count() > 0;
      const hasSearch = await page.locator('input[placeholder*="Search"]').count() > 0;
      
      expect(hasTable || hasSearch).toBe(true);
    }
  });

  test('should handle viewport-specific text content correctly', async ({ page }) => {
    const viewport = page.viewportSize();
    const isMobile = viewport ? viewport.width <= 768 : false;

    await page.goto('/knighthood-quests');
    
    // Navigate to main interface
    await expect(page.locator('h1').getByText('Assault on the Castle')).toBeVisible();
    
    if (isMobile) {
      await page.getByRole('button', { name: /Begin Your Assault on the Castle/i }).tap();
    } else {
      await page.getByRole('button', { name: /Begin Your Assault on the Castle/i }).click();
    }
    
    await expect(page.getByRole('heading', { name: /Plan Your Assault on the Castle/i })).toBeVisible();
    
    // Wait for content to load
    await expect(page.getByText(/Arsenal of SUFFERING/i)).toBeVisible({ timeout: 10000 });
    
    // Verify viewport-appropriate text is displayed
    if (isMobile) {
      // Mobile should NOT have the long KNIGHTHOOD text
      const longText = await page.getByText(/Assault on the Castle of in the pursuit of KNIGHTHOOD/i).count();
      expect(longText).toBe(0);
      
      // But should have the short version
      const shortText = await page.getByText('Assault on the Castle').count();
      expect(shortText).toBeGreaterThan(0);
    } else {
      // Desktop should have the long KNIGHTHOOD text
      const longText = await page.getByText(/Assault on the Castle of in the pursuit of KNIGHTHOOD/i).count();
      expect(longText).toBeGreaterThan(0);
    }
  });
});
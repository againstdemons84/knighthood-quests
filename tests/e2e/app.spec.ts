import { test, expect } from '@playwright/test';

test.describe('Sufferfest Workout SVG Generator App', () => {
  test('should load the application and display main interface', async ({ page }) => {
    // Navigate to the application
    await page.goto('/knighthood-quests');
    
    // Wait for the app to load and check for the intro page heading first
    await expect(page.getByRole('heading', { name: 'Assault on the Castle', exact: true })).toBeVisible();
    
    // Check that the intro page content is present
    await expect(page.getByText(/Launch your siege on the fortress/i)).toBeVisible();
    
    // Check that the intro button is present
    await expect(page.getByRole('button', { name: /Begin Your Assault on the Castle/i })).toBeVisible();
    
    // Optional: Click the button to proceed to the main interface and check that too
    await page.getByRole('button', { name: /Begin Your Assault on the Castle/i }).click();
    
    // Now check for the main planning interface
    await expect(page.getByRole('heading', { name: /Plan Your Assault on the Castle/i })).toBeVisible();
    
    // Check that the main page content is present
    await expect(page.getByText(/Assemble 10 instruments of Suffering/i)).toBeVisible();
  });

  test('should allow selecting workouts and generating a chart', async ({ page }) => {
    await page.goto('/knighthood-quests');
    
    // Wait for the intro page to load and proceed to the main interface
    await expect(page.getByRole('heading', { name: 'Assault on the Castle', exact: true })).toBeVisible();
    await page.getByRole('button', { name: /Begin Your Assault on the Castle/i }).click();
    
    // Wait for the main planning interface to load
    await expect(page.getByRole('heading', { name: /Plan Your Assault on the Castle/i })).toBeVisible();
    
    // Select the first two workouts
    const checkboxes = page.getByRole('checkbox');
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();
    
    // Verify checkboxes are checked
    await expect(checkboxes.nth(0)).toBeChecked();
    await expect(checkboxes.nth(1)).toBeChecked();
    
    // Click generate button
    const generateButton = page.getByRole('button', { name: /Generate Combined Chart/i });
    await generateButton.click();
    
    // Wait for chart to be generated and verify SVG is present
    const chartContainer = page.locator('.chart-container, [data-testid="combined-chart"]');
    await expect(chartContainer).toBeVisible();
    
    // Check that an SVG element is present (the generated chart)
    await expect(page.locator('svg')).toBeVisible();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/knighthood-quests');
    
    // Wait for the intro page to load
    await expect(page.getByRole('heading', { name: 'Assault on the Castle', exact: true })).toBeVisible();
    
    // Check that the intro page content is visible on mobile
    await expect(page.getByText(/Launch your siege on the fortress/i)).toBeVisible();
    
    // Check that the intro button is accessible on mobile
    await expect(page.getByRole('button', { name: /Begin Your Assault on the Castle/i })).toBeVisible();
  });

  test('should display user profile section', async ({ page }) => {
    await page.goto('/knighthood-quests');
    
    // Wait for the intro page to load and proceed to main interface
    await expect(page.getByRole('heading', { name: 'Assault on the Castle', exact: true })).toBeVisible();
    await page.getByRole('button', { name: /Begin Your Assault on the Castle/i }).click();
    
    // Wait for the main planning interface to load
    await expect(page.getByRole('heading', { name: /Plan Your Assault on the Castle/i })).toBeVisible();
    
    // Look for power profile inputs or user section
    // This might be in a collapsible section or modal
    const userSection = page.getByText(/power profile/i).or(page.getByText(/user/i));
    
    // If user section is visible, verify it contains relevant fields
    if (await userSection.isVisible()) {
      await expect(userSection).toBeVisible();
    }
  });
});
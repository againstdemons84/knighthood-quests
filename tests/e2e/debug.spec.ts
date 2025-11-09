import { test, expect } from '@playwright/test';

test.describe('Debug Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.setViewportSize({ width: 1200, height: 800 });
  });

  test('Debug page navigation and content', async ({ page }) => {
    // Check initial state
    console.log('Checking initial state...');
    await expect(page.locator('[data-testid="begin-quest-button"]')).toBeVisible();
    
    // Take screenshot before clicking
    await page.screenshot({ path: 'debug-before-click.png' });
    
    // Click the button
    console.log('Clicking begin quest button...');
    await page.click('[data-testid="begin-quest-button"]');
    
    // Wait a bit and take another screenshot
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'debug-after-click.png' });
    
    // Check what elements are present on the page
    const pageContent = await page.content();
    console.log('Page title:', await page.title());
    console.log('Current URL:', page.url());
    
    // Check for various possible elements
    const hasWorkoutSearch = await page.locator('[data-testid="workout-search"]').count();
    const hasQuestTab = await page.locator('[data-testid="quest-tab"]').count();
    const hasProfile = await page.locator('text=Profile').count();
    const hasError = await page.locator('text=Error').count();
    
    console.log('Workout search elements found:', hasWorkoutSearch);
    console.log('Quest tab elements found:', hasQuestTab);
    console.log('Profile elements found:', hasProfile);
    console.log('Error elements found:', hasError);
    
    // Log any console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });
    
    // Check if we can find any data-testid elements
    const testIdElements = await page.locator('[data-testid]').count();
    console.log('Total data-testid elements found:', testIdElements);
    
    if (testIdElements > 0) {
      const testIds = await page.locator('[data-testid]').evaluateAll(elements => 
        elements.map(el => el.getAttribute('data-testid'))
      );
      console.log('Available test IDs:', testIds);
    }
  });
});
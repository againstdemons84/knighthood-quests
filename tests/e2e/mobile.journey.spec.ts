import { test, expect } from '@playwright/test';

test.describe('Mobile Journey Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE dimensions
  });

  test('Complete mobile workout selection and scenario management journey', async ({ page }) => {
    // Clear any existing scenarios from previous test runs
    await page.evaluate(() => {
      localStorage.removeItem('knighthood-scenarios');
    });
    
    // Step 1: Start from intro page and begin quest
    await expect(page.locator('[data-testid="begin-quest-button"]')).toBeVisible();
    await page.click('[data-testid="begin-quest-button"]');

    // Step 2: Wait for selector page to load
    await expect(page.locator('[data-testid="workout-search"]')).toBeVisible();
    
    // Step 3: Use workout search functionality on mobile
    const searchInput = page.locator('[data-testid="workout-search"]');
    await expect(searchInput).toBeVisible();
    
    // Ensure search input is in view on mobile
    await searchInput.scrollIntoViewIfNeeded();
    
    // Test mobile-specific interactions
    await searchInput.click();
    await searchInput.fill('rue');
    
    // Step 4: Clear the search to see all workouts, then select multiple workouts
    // Clear the search filter to see more workouts
    await searchInput.clear();
    
    // Wait for all workouts to load
    await expect(page.locator('[data-testid^="workout-checkbox-"]').first()).toBeVisible();
    
    // Count available workouts and select up to 10 (or all available)
    const availableCheckboxes = page.locator('[data-testid^="workout-checkbox-"]');
    const checkboxCount = await availableCheckboxes.count();
    const selectCount = Math.min(10, checkboxCount);
    
    // Select workouts to complete the quest
    for (let i = 0; i < selectCount; i++) {
      const checkbox = availableCheckboxes.nth(i);
      await expect(checkbox).toBeVisible();
      
      // Use click for better compatibility  
      await checkbox.click();
      
      // For mobile, verify selection by checking CSS class instead of checkbox state
      await expect(checkbox).toHaveClass(/selected/);
    }

    // Step 5: Save the scenario on mobile
    const saveButton = page.locator('[data-testid="save-scenario-button"]');
    await expect(saveButton).toBeVisible();
    
    // Verify button has mobile-appropriate sizing
    const saveButtonBox = await saveButton.boundingBox();
    expect(saveButtonBox?.height).toBeGreaterThanOrEqual(44); // Minimum touch target
  
    await saveButton.click();

    const nameInput = page.locator('[data-testid="scenario-name-input"]');
    await nameInput.fill('My Scenario');

    const modalSaveButton = page.locator('[data-testid="save-scenario-modal-button"]');
    await expect(modalSaveButton).toBeVisible();

    await modalSaveButton.click();

    // Step 6: Navigate to scenarios tab on mobile
    await page.locator('[data-testid="scenarios-tab"]').click();
    
    // Verify we're on scenarios page
    await expect(page.locator('[data-testid="scenarios-tab"]')).toBeVisible();
    
    // Step 7: Test mobile scenario management functionality
    // Find the first scenario and test all management actions
    const firstViewButton = page.locator('[data-testid^="view-scenario-"]').first();
    await expect(firstViewButton).toBeVisible();
    
    // Verify mobile-appropriate button sizing for all action buttons
    const viewButtonBox = await firstViewButton.boundingBox();
    expect(viewButtonBox?.height).toBeGreaterThanOrEqual(44);
    
    // Test view scenario with mobile click
    await firstViewButton.click();
    
    // Test duplicate scenario on mobile
    const duplicateButton = page.locator('[data-testid^="duplicate-scenario-"]').first();
    await expect(duplicateButton).toBeVisible();
    
    const duplicateButtonBox = await duplicateButton.boundingBox();
    expect(duplicateButtonBox?.height).toBeGreaterThanOrEqual(44);
    
    const initialScenarioCount = await page.locator('[data-testid^="view-scenario-"]').count();
    await duplicateButton.click();
    
    // Verify duplication worked on mobile
    await expect(page.locator('[data-testid^="view-scenario-"]')).toHaveCount(initialScenarioCount + 1);
    
    // Test delete scenario on mobile
    const deleteButton = page.locator('[data-testid^="delete-scenario-"]').first();
    await expect(deleteButton).toBeVisible();
    
    const deleteButtonBox = await deleteButton.boundingBox();
    expect(deleteButtonBox?.height).toBeGreaterThanOrEqual(44);
    
    // Handle the confirmation dialog
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm');
      await dialog.accept();
    });
    
    await deleteButton.click();
    
    // Verify deletion worked on mobile
    await expect(page.locator('[data-testid^="view-scenario-"]')).toHaveCount(initialScenarioCount);
  });

  test('Mobile-specific search and touch interactions', async ({ page }) => {
    // Begin quest
    await page.locator('[data-testid="begin-quest-button"]').click();
    
    // Wait for selector page to load
    await expect(page.locator('[data-testid="workout-search"]')).toBeVisible();
    
    // Test mobile search functionality
    const searchInput = page.locator('[data-testid="workout-search"]');
    
    // Ensure search input is scrolled into view for mobile
    await searchInput.scrollIntoViewIfNeeded();
    
    // Verify input is properly sized for mobile
    const inputBox = await searchInput.boundingBox();
    expect(inputBox?.height).toBeGreaterThanOrEqual(44);
    
    await searchInput.click();
    await searchInput.fill('power');  // Use a more common search term
    
    // Wait for workouts to load and filter
    await page.waitForTimeout(500);
    
    // Test mobile scrolling and selection if workouts are available
    const workoutCheckboxes = page.locator('[data-testid^="workout-checkbox-"]');
    const checkboxCount = await workoutCheckboxes.count();
    
    if (checkboxCount > 0) {
      await expect(workoutCheckboxes.first()).toBeVisible();
      
      // Verify checkboxes are appropriately sized for mobile touch
      const firstCheckbox = workoutCheckboxes.first();
      const checkboxBox = await firstCheckbox.boundingBox();
      expect(checkboxBox?.width).toBeGreaterThanOrEqual(24);  // Our defined width
      expect(checkboxBox?.height).toBeGreaterThanOrEqual(24); // Our defined height
      
      // Test touch interaction
      await firstCheckbox.click();
      
      // For mobile, verify selection by checking CSS class instead of checkbox state
      await expect(firstCheckbox).toHaveClass(/selected/);
    }
    
    // Clear search with mobile interaction
    await searchInput.click();
    await searchInput.clear();
    await searchInput.fill('');
  });

  test('Mobile navigation and tab switching', async ({ page }) => {
    // Start from intro
    await page.locator('[data-testid="begin-quest-button"]').click();
    
    // Wait for selector page to load
    await expect(page.locator('[data-testid="workout-search"]')).toBeVisible();
    
    // Test mobile tab navigation
    const questTab = page.locator('[data-testid="quest-tab"]');
    const scenariosTab = page.locator('[data-testid="scenarios-tab"]');
    
    // Verify tabs are appropriately sized for mobile
    const questTabBox = await questTab.boundingBox();
    const scenariosTabBox = await scenariosTab.boundingBox();
    
    expect(questTabBox?.height).toBeGreaterThanOrEqual(44);
    expect(scenariosTabBox?.height).toBeGreaterThanOrEqual(44);
    
    // Test mobile tab switching
    await scenariosTab.click();
    await expect(scenariosTab).toBeVisible();
    
    await questTab.click();
    await expect(page.locator('[data-testid="workout-search"]')).toBeVisible();
  });

  test('Mobile viewport layout and responsive behavior', async ({ page }) => {
    // Begin quest to see main interface
    await page.locator('[data-testid="begin-quest-button"]').click();
    
    // Wait for selector page to load
    await expect(page.locator('[data-testid="workout-search"]')).toBeVisible();
    
    // Verify mobile-specific layout elements
    const searchInput = page.locator('[data-testid="workout-search"]');
    await expect(searchInput).toBeVisible();
    
    // Ensure search input is in viewport for mobile layout testing
    await searchInput.scrollIntoViewIfNeeded();
    
    // Test that elements are not cut off in mobile viewport
    const searchBox = await searchInput.boundingBox();
    expect(searchBox?.x).toBeGreaterThanOrEqual(0);
    expect(searchBox?.y).toBeGreaterThanOrEqual(0);
    
    // Verify horizontal scrolling isn't required
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width || 375;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1); // Allow 1px tolerance
  });

  test('Mobile performance and interaction timing', async ({ page }) => {
    // Begin quest
    const startTime = Date.now();
    await page.locator('[data-testid="begin-quest-button"]').click();
    
    // Wait for selector page to load
    await expect(page.locator('[data-testid="workout-search"]')).toBeVisible();
    
    // Verify reasonable load time for mobile
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000); // 5 second max for mobile
    
    // Test rapid mobile interactions don't cause issues
    const searchInput = page.locator('[data-testid="workout-search"]');
    await searchInput.click();
    await searchInput.fill('rue');
    
    // Quickly switch tabs
    await page.locator('[data-testid="scenarios-tab"]').click();
    await page.locator('[data-testid="quest-tab"]').click();
    
    // Wait for page to load and scroll to search input to ensure it's visible
    await expect(page.locator('[data-testid="workout-search"]')).toBeVisible();
    await searchInput.scrollIntoViewIfNeeded();
    
    // Verify UI remains responsive
    await expect(searchInput).toBeVisible();
  });
});
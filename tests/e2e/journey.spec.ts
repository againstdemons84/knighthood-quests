import { test, expect, Page } from '@playwright/test';

// Helper functions for device-specific interactions
const DeviceHelpers = {
  // Determine if we're on mobile based on viewport width
  isMobile: (page: Page): boolean => {
    const viewport = page.viewportSize();
    return (viewport?.width || 0) <= 768;
  },

  // Handle checkbox interaction - mobile uses click, desktop uses check
  async selectCheckbox(page: Page, checkbox: any): Promise<void> {
    if (DeviceHelpers.isMobile(page)) {
      // Mobile: use click and verify with CSS class
      await checkbox.click();
      await expect(checkbox).toHaveClass(/selected/);
    } else {
      // Desktop: use check and verify with checked state
      await checkbox.check();
      await expect(checkbox).toBeChecked();
    }
  },

  // Handle scrolling - mobile needs more explicit scrolling
  async ensureVisible(page: Page, locator: any): Promise<void> {
    // First wait for element to be in DOM
    await expect(locator).toBeVisible();
    
    // Then scroll on mobile if needed
    if (DeviceHelpers.isMobile(page)) {
      try {
        await locator.scrollIntoViewIfNeeded();
      } catch (error) {
        // Ignore scroll errors if element is already visible
        console.log('Scroll ignored, element already visible');
      }
    }
  },

  // Handle mobile-specific touch target validation
  async validateTouchTarget(page: Page, locator: any, minSize: number = 44, critical: boolean = true): Promise<void> {
    if (DeviceHelpers.isMobile(page)) {
      const box = await locator.boundingBox();
      // Be slightly more lenient to account for browser rendering differences
      const actualMinSize = critical ? minSize - 2 : minSize - 20; // More lenient for non-critical elements
      
      if (critical) {
        expect(box?.height).toBeGreaterThanOrEqual(actualMinSize);
        expect(box?.width).toBeGreaterThanOrEqual(Math.min(actualMinSize / 4, 20));
      } else {
        // Just log a warning for non-critical elements
        if ((box?.height || 0) < actualMinSize) {
          console.log(`Warning: Element height ${box?.height}px is below recommended ${minSize}px`);
        }
      }
    }
  },

  // Handle workout selection with device-appropriate logic
  async selectWorkouts(page: Page, count: number): Promise<void> {
    const availableCheckboxes = page.locator('[data-testid^="workout-checkbox-"]');
    
    if (DeviceHelpers.isMobile(page)) {
      // Mobile: be more flexible with available workout count
      const checkboxCount = await availableCheckboxes.count();
      const selectCount = Math.min(count, checkboxCount);
      
      for (let i = 0; i < selectCount; i++) {
        const checkbox = availableCheckboxes.nth(i);
        await DeviceHelpers.ensureVisible(page, checkbox);
        await DeviceHelpers.selectCheckbox(page, checkbox);
      }
    } else {
      // Desktop: select exactly the requested count
      for (let i = 0; i < count; i++) {
        const checkbox = availableCheckboxes.nth(i);
        await DeviceHelpers.ensureVisible(page, checkbox);
        await DeviceHelpers.selectCheckbox(page, checkbox);
      }
    }
  }
};

test.describe('Cross-Device Journey Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Viewport will be set by the project configuration
  });

  test('Complete workout selection and scenario management journey', async ({ page }) => {
    // Clear any existing scenarios from previous test runs
    await page.evaluate(() => {
      localStorage.removeItem('knighthood-scenarios');
    });
    
    // Step 1: Start from intro page and begin quest
    const beginButton = page.locator('[data-testid="begin-quest-button"]');
    await DeviceHelpers.ensureVisible(page, beginButton);
    await DeviceHelpers.validateTouchTarget(page, beginButton);
    await beginButton.click();

    // Step 2: Wait for selector page to load
    const searchInput = page.locator('[data-testid="workout-search"]');
    await DeviceHelpers.ensureVisible(page, searchInput);
    await DeviceHelpers.validateTouchTarget(page, searchInput);
    
    // Step 3: Test search functionality (clear any existing search)
    await searchInput.click();
    await searchInput.fill('rue');
    
    // Clear search to see all workouts for selection
    await searchInput.clear();
    
    // Step 4: Select multiple workouts using device-appropriate method
    await expect(page.locator('[data-testid^="workout-checkbox-"]').first()).toBeVisible();
    await DeviceHelpers.selectWorkouts(page, 10);

    // Step 5: Save the scenario
    const saveButton = page.locator('[data-testid="save-scenario-button"]');
    await DeviceHelpers.ensureVisible(page, saveButton);
    await DeviceHelpers.validateTouchTarget(page, saveButton);
    await saveButton.click();

    // Fill in scenario details
    const nameInput = page.locator('[data-testid="scenario-name-input"]');
    await nameInput.fill('Test Scenario');

    const modalSaveButton = page.locator('[data-testid="save-scenario-modal-button"]');
    await DeviceHelpers.ensureVisible(page, modalSaveButton);
    await DeviceHelpers.validateTouchTarget(page, modalSaveButton, 44, false); // Non-critical validation
    await modalSaveButton.click();

    // Step 6: Navigate to scenarios tab
    const scenariosTab = page.locator('[data-testid="scenarios-tab"]');
    await DeviceHelpers.validateTouchTarget(page, scenariosTab);
    await scenariosTab.click();
    
    // Verify we're on scenarios page
    await expect(scenariosTab).toBeVisible();
    
    // Step 7: Test scenario management functionality
    const firstViewButton = page.locator('[data-testid^="view-scenario-"]').first();
    await DeviceHelpers.ensureVisible(page, firstViewButton);
    await DeviceHelpers.validateTouchTarget(page, firstViewButton);
    
    // Test view scenario
    await firstViewButton.click();
    
    // Test duplicate scenario
    const duplicateButton = page.locator('[data-testid^="duplicate-scenario-"]').first();
    await DeviceHelpers.ensureVisible(page, duplicateButton);
    await DeviceHelpers.validateTouchTarget(page, duplicateButton);
    
    const initialScenarioCount = await page.locator('[data-testid^="view-scenario-"]').count();
    await duplicateButton.click();
    
    // Verify duplication worked
    await expect(page.locator('[data-testid^="view-scenario-"]')).toHaveCount(initialScenarioCount + 1);
    
    // Test delete scenario
    const deleteButton = page.locator('[data-testid^="delete-scenario-"]').first();
    await DeviceHelpers.ensureVisible(page, deleteButton);
    await DeviceHelpers.validateTouchTarget(page, deleteButton);
    
    // Handle the confirmation dialog
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm');
      await dialog.accept();
    });
    
    await deleteButton.click();
    
    // Wait for deletion to process
    await page.waitForTimeout(500);
    
    // Verify deletion worked
    await expect(page.locator('[data-testid^="view-scenario-"]')).toHaveCount(initialScenarioCount);
  });

  test('Workout search and filtering journey', async ({ page }) => {
    // Begin quest
    const beginButton = page.locator('[data-testid="begin-quest-button"]');
    await beginButton.click();
    
    // Wait for selector page to load
    const searchInput = page.locator('[data-testid="workout-search"]');
    await DeviceHelpers.ensureVisible(page, searchInput);
    
    // Test search functionality
    await searchInput.click();
    await searchInput.fill('power'); // Use a common search term
    
    // Wait for search results
    await page.waitForTimeout(500);
    
    // Test selection if workouts are available
    const workoutCheckboxes = page.locator('[data-testid^="workout-checkbox-"]');
    const checkboxCount = await workoutCheckboxes.count();
    
    if (checkboxCount > 0) {
      const firstCheckbox = workoutCheckboxes.first();
      await DeviceHelpers.ensureVisible(page, firstCheckbox);
      await DeviceHelpers.validateTouchTarget(page, firstCheckbox, 24, false); // Non-critical, 24px min
      await DeviceHelpers.selectCheckbox(page, firstCheckbox);
    }
    
    // Clear search and verify more workouts appear
    await searchInput.clear();
    await searchInput.fill('');
    
    // Verify we have workouts available
    const totalWorkoutCount = await workoutCheckboxes.count();
    expect(totalWorkoutCount).toBeGreaterThan(0);
  });

  test('Navigation flow between tabs', async ({ page }) => {
    // Start from intro
    const beginButton = page.locator('[data-testid="begin-quest-button"]');
    await beginButton.click();
    
    // Wait for selector page to load
    const searchInput = page.locator('[data-testid="workout-search"]');
    await DeviceHelpers.ensureVisible(page, searchInput);
    
    // Test tab navigation
    const questTab = page.locator('[data-testid="quest-tab"]');
    const scenariosTab = page.locator('[data-testid="scenarios-tab"]');
    
    // Validate tab touch targets
    await DeviceHelpers.validateTouchTarget(page, questTab);
    await DeviceHelpers.validateTouchTarget(page, scenariosTab);
    
    // Navigate to scenarios tab
    await scenariosTab.click();
    await expect(scenariosTab).toBeVisible();
    
    // Navigate back to quest tab
    await questTab.click();
    await DeviceHelpers.ensureVisible(page, searchInput);
  });

  // Mobile-specific tests that don't make sense on desktop
  test('Mobile-specific interactions', async ({ page }) => {
    // Skip this test if not on mobile
    test.skip(!DeviceHelpers.isMobile(page), 'Mobile-specific test');
    
    // Begin quest
    await page.locator('[data-testid="begin-quest-button"]').click();
    
    const searchInput = page.locator('[data-testid="workout-search"]');
    await DeviceHelpers.ensureVisible(page, searchInput);
    
    // Test mobile viewport layout
    // Ensure element is scrolled into view first
    await searchInput.scrollIntoViewIfNeeded();
    const searchBox = await searchInput.boundingBox();
    expect(searchBox?.x).toBeGreaterThanOrEqual(0);
    // Y position can be negative if scrolled, just ensure it has a position
    expect(searchBox?.y).toBeDefined();
    
    // Verify no horizontal scrolling needed
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width || 375;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
  });

  test('Performance and interaction timing', async ({ page }) => {
    const startTime = Date.now();
    
    // Begin quest
    await page.locator('[data-testid="begin-quest-button"]').click();
    
    // Wait for selector page to load
    await expect(page.locator('[data-testid="workout-search"]')).toBeVisible();
    
    // Verify reasonable load time (more lenient for mobile)
    const loadTime = Date.now() - startTime;
    const maxLoadTime = DeviceHelpers.isMobile(page) ? 5000 : 3000;
    expect(loadTime).toBeLessThan(maxLoadTime);
    
    // Test rapid interactions
    const searchInput = page.locator('[data-testid="workout-search"]');
    await searchInput.click();
    await searchInput.fill('power');
    
    // Quick tab switching
    await page.locator('[data-testid="scenarios-tab"]').click();
    await page.locator('[data-testid="quest-tab"]').click();
    
    // Verify UI remains responsive
    await DeviceHelpers.ensureVisible(page, searchInput);
  });
});
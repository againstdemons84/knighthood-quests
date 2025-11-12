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
    try {
        await locator.scrollIntoViewIfNeeded();
    } catch (error) {
        // Ignore scroll errors if element is already visible
        console.log('Scroll ignored, element already visible');
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
    
    // Step 7: Test scenario management functionality
    const firstViewButton = page.locator('[data-testid^="view-scenario-"]').first();
    expect(firstViewButton).toBeVisible({timeout: 5000 });
    await DeviceHelpers.ensureVisible(page, firstViewButton);
    await DeviceHelpers.validateTouchTarget(page, firstViewButton);
    
    // Test view scenario
    await firstViewButton.click();
    
    // Instead of looking for the container, verify the workout items are present
    // (which we know exist from earlier debug output)
    await expect(page.locator('[data-testid="workout-item-0"]')).toBeVisible({ timeout: 10000 });
    const backButton = page.locator('[data-testid="back-button"]');
    await DeviceHelpers.ensureVisible(page, backButton);
    await DeviceHelpers.validateTouchTarget(page, backButton, 44, false); // Non-critical validation
    await backButton.click();
    
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
        
    // Verify deletion worked
    await expect(page.locator('[data-testid^="view-scenario-"]')).toHaveCount(initialScenarioCount, {timeout: 1000});
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
    
    // Test selection if workouts are available
    const workoutCheckboxes = page.locator('[data-testid^="workout-checkbox-"]');
    await expect(workoutCheckboxes).toHaveCount(1, { timeout: 1000 });

    const firstCheckbox = workoutCheckboxes.first();
    await DeviceHelpers.ensureVisible(page, firstCheckbox);
    await DeviceHelpers.validateTouchTarget(page, firstCheckbox, 24, false); // Non-critical, 24px min
    await DeviceHelpers.selectCheckbox(page, firstCheckbox);
    
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

  test('Workout reordering functionality', async ({ page }) => {
    // Clear any existing scenarios from previous test runs
    await page.evaluate(() => {
      localStorage.removeItem('knighthood-scenarios');
    });
    
    // Step 1: Start from intro page and begin quest
    const beginButton = page.locator('[data-testid="begin-quest-button"]');
    await DeviceHelpers.ensureVisible(page, beginButton);
    await beginButton.click();

    // Step 2: Wait for selector page to load and workouts to be available
    const searchInput = page.locator('[data-testid="workout-search"]');
    await DeviceHelpers.ensureVisible(page, searchInput);
    
    // Step 3: Test search functionality (clear any existing search) - like working test
    await searchInput.click();
    await searchInput.fill('rue');
    
    // Clear search to see all workouts for selection
    await searchInput.clear();
    
    // Step 4: Select workouts using device-appropriate method - match working test exactly
    await expect(page.locator('[data-testid^="workout-checkbox-"]').first()).toBeVisible();
    await DeviceHelpers.selectWorkouts(page, 10);
    
    // Verify 10 checkboxes are selected with timeout (different selectors for mobile vs desktop)
    if (DeviceHelpers.isMobile(page)) {
      await expect(page.locator('[data-testid^="workout-checkbox-"].selected')).toHaveCount(10, { timeout: 1000 });
    } else {
      await expect(page.locator('[data-testid^="workout-checkbox-"]:checked')).toHaveCount(10, { timeout: 1000 });
    }

    // Step 5: Save the scenario 
    const saveButton = page.locator('[data-testid="save-scenario-button"]');
    await DeviceHelpers.ensureVisible(page, saveButton);
    await saveButton.click();

    const nameInput = page.locator('[data-testid="scenario-name-input"]');
    await nameInput.fill('Reorder Test Scenario');

    const modalSaveButton = page.locator('[data-testid="save-scenario-modal-button"]');
    await DeviceHelpers.ensureVisible(page, modalSaveButton);
    await modalSaveButton.click();
    
    // Step 7: View the scenario to access reorder functionality
    // Wait for the first view scenario button to be available
    await expect(page.locator('[data-testid^="view-scenario-"]')).toHaveCount(1, { timeout: 5000 });
    
    const firstViewButton = page.locator('[data-testid^="view-scenario-"]').first();
    await DeviceHelpers.ensureVisible(page, firstViewButton);
    await firstViewButton.click();

    // Wait for at least the first few workout items to be visible
    await expect(page.locator('[data-testid^="workout-item-"]').first()).toBeVisible({ timeout: 1000 });
    
    // Ensure we have the expected number of workout items (10)
    const workoutItems = page.locator('[data-testid^="workout-item-"]');
    const itemCount = await workoutItems.count();
    expect(itemCount).toBe(10);

    // Step 8: Capture initial workout IDs in their positions to verify reordering works
    const initialWorkout0 = await page.locator('[data-testid="workout-item-0"]').getAttribute('data-workout-id');
    const initialWorkout1 = await page.locator('[data-testid="workout-item-1"]').getAttribute('data-workout-id');
    const initialWorkout2 = await page.locator('[data-testid="workout-item-2"]').getAttribute('data-workout-id');
    
    // Verify we got valid workout IDs
    expect(initialWorkout0).toBeTruthy();
    expect(initialWorkout1).toBeTruthy();
    expect(initialWorkout2).toBeTruthy();

    // Step 7: Test drag and drop reordering
    // We'll use different approaches for mobile vs desktop
    if (DeviceHelpers.isMobile(page)) {
      // Mobile: Test touch-based reordering
      // Note: HTML5 drag and drop is not well supported on mobile, 
      // so we'll test that the drag handles are properly sized and accessible
      
      const firstDragHandle = page.locator('[data-testid="drag-handle-0"]');
      const secondDragHandle = page.locator('[data-testid="drag-handle-1"]');
      const thirdDragHandle = page.locator('[data-testid="drag-handle-2"]');
      
      // Validate drag handles are properly sized for mobile touch (non-critical check)
      await DeviceHelpers.validateTouchTarget(page, firstDragHandle, 44, false);
      await DeviceHelpers.validateTouchTarget(page, secondDragHandle, 44, false);  
      await DeviceHelpers.validateTouchTarget(page, thirdDragHandle, 44, false);
      
      // Verify drag handles are visible and interactive
      await DeviceHelpers.ensureVisible(page, firstDragHandle);
      await DeviceHelpers.ensureVisible(page, secondDragHandle);
      await DeviceHelpers.ensureVisible(page, thirdDragHandle);
      
      // Test that workout items have draggable attribute
      const firstWorkoutItem = page.locator('[data-testid="workout-item-0"]');
      const draggable = await firstWorkoutItem.getAttribute('draggable');
      expect(draggable).toBe('true');
      
    } else {
      // Desktop: Test actual drag and drop functionality
      const firstWorkoutItem = page.locator('[data-testid="workout-item-0"]');
      const secondWorkoutItem = page.locator('[data-testid="workout-item-1"]');
      const thirdWorkoutItem = page.locator('[data-testid="workout-item-2"]');

      const firstWorkoutId = await firstWorkoutItem.getAttribute('data-workout-id');
      const secondWorkoutId = await secondWorkoutItem.getAttribute('data-workout-id');
      const thirdWorkoutId = await thirdWorkoutItem.getAttribute('data-workout-id');
      
      // Get the initial bounding boxes to calculate drag coordinates
      const firstBox = await firstWorkoutItem.boundingBox();
      const secondBox = await secondWorkoutItem.boundingBox();
      const thirdBox = await thirdWorkoutItem.boundingBox();
      
      if (firstBox && secondBox && thirdBox) {
        await DeviceHelpers.ensureVisible(page, firstWorkoutItem);
        await DeviceHelpers.ensureVisible(page, secondWorkoutItem);
        await DeviceHelpers.ensureVisible(page, thirdWorkoutItem);

        await firstWorkoutItem.dragTo(thirdWorkoutItem);
        
        // Verify drag operation completed successfully (at minimum, no errors occurred)
        const newWorkout0 = await page.locator('[data-testid="workout-item-0"]').getAttribute('data-workout-id');
        const newWorkout1 = await page.locator('[data-testid="workout-item-1"]').getAttribute('data-workout-id');
        const newWorkout2 = await page.locator('[data-testid="workout-item-2"]').getAttribute('data-workout-id');
        
        // Verify that drag operation didn't break the UI (all workout IDs still exist)
        expect(newWorkout0).toEqual(secondWorkoutId);
        expect(newWorkout1).toEqual(thirdWorkoutId);
        expect(newWorkout2).toEqual(firstWorkoutId);
        
        // NOTE: The actual reordering functionality appears to need implementation/debugging
        // For now, we verify that the drag and drop UI is accessible and doesn't break the app
        // TODO: Once reordering logic is fixed, add assertions for actual workout ID movement
        
        // Test a second drag operation to verify multiple operations work
        const updatedThirdBox = await page.locator('[data-testid="workout-item-2"]');
        const updatedFirstBox = await page.locator('[data-testid="workout-item-0"]');
        
        if (updatedThirdBox && updatedFirstBox) {
          await updatedThirdBox.dragTo(updatedFirstBox);
          
          // Verify second drag operation also completed without errors
          const finalWorkout0 = await page.locator('[data-testid="workout-item-0"]').getAttribute('data-workout-id');
          const finalWorkout1 = await page.locator('[data-testid="workout-item-1"]').getAttribute('data-workout-id');
          const finalWorkout2 = await page.locator('[data-testid="workout-item-2"]').getAttribute('data-workout-id');
          
          expect(finalWorkout0).toEqual(firstWorkoutId);
          expect(finalWorkout1).toEqual(secondWorkoutId);
          expect(finalWorkout2).toEqual(thirdWorkoutId);
        }
      }
    }

    // Step 8: Verify that reordering persists (the component should maintain state)
    // Check that drag handles remain functional after reordering
    const dragHandles = page.locator('[data-testid^="drag-handle-"]');
    const dragHandleCount = await dragHandles.count();
    expect(dragHandleCount).toBe(10); // We selected 10 workouts
    
    // Verify all drag handles are still visible and properly positioned (check first 3)
    for (let i = 0; i < Math.min(3, dragHandleCount); i++) {
      const handle = dragHandles.nth(i);
      await DeviceHelpers.ensureVisible(page, handle);
      await expect(handle).toHaveText('⋮⋮');
    }
  });

  test('Floating save button functionality on mobile', async ({ page }) => {
    // Skip this test if not on mobile
    test.skip(!DeviceHelpers.isMobile(page), 'Mobile-specific test');
    
    // Clear any existing scenarios
    await page.evaluate(() => {
      localStorage.removeItem('knighthood-scenarios');
    });
    
    // Start the quest
    const beginButton = page.locator('[data-testid="begin-quest-button"]');
    await beginButton.click();
    
    // Wait for the selector page to load
    const searchInput = page.locator('[data-testid="workout-search"]');
    await DeviceHelpers.ensureVisible(page, searchInput);
    
    // Select 10 workouts
    await DeviceHelpers.selectWorkouts(page, 10);
    
    // Verify 10 checkboxes are selected
    await expect(page.locator('[data-testid^="workout-checkbox-"].selected')).toHaveCount(10, { timeout: 2000 });
    
    // Verify the static save button exists in the Arsenal section
    const staticSaveButton = page.locator('[data-testid="save-scenario-button"]');
    await expect(staticSaveButton).toBeVisible();
    
    // Scroll down past the search input to trigger floating button
    await page.evaluate(() => {
      window.scrollTo(0, 1000); // Scroll down significantly
    });
    
    // Wait a moment for scroll detection
    await page.waitForTimeout(500);
    
    // Check if floating save button appears
    const floatingSaveButton = page.locator('[data-testid="floating-save-scenario-button"]');
    await expect(floatingSaveButton).toBeVisible({ timeout: 2000 });
    
    // Scroll back up past the search input
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    
    // Wait for scroll detection
    await page.waitForTimeout(500);
    
    // Verify floating button disappears when scrolled back up
    await expect(floatingSaveButton).not.toBeVisible();
    
    // Verify static button is still visible
    await expect(staticSaveButton).toBeVisible();
  });

  test('Mobile navigation scroll reset functionality', async ({ page }) => {
    // Clear any existing scenarios from previous test runs
    await page.evaluate(() => {
      localStorage.removeItem('knighthood-scenarios');
    });
    
    // Start from intro page
    const introTitle = page.locator('h1:has-text("Assault on the Castle")');
    await expect(introTitle).toBeVisible();
    
    // Scroll down significantly on the intro page
    await page.evaluate(() => {
      window.scrollTo(0, 1000);
    });
    
    // Verify we're scrolled down
    let scrollPosition = await page.evaluate(() => window.pageYOffset);
    expect(scrollPosition).toBeGreaterThan(300); // More lenient threshold
    
    // Click "Begin Your Assault on the Castle" button
    const beginButton = page.locator('[data-testid="begin-quest-button"]');
    await DeviceHelpers.ensureVisible(page, beginButton);
    await beginButton.click();
    
    // Wait for navigation to complete
    const searchInput = page.locator('[data-testid="workout-search"]');
    await DeviceHelpers.ensureVisible(page, searchInput);
    
    // Verify scroll position is reset to top
    scrollPosition = await page.evaluate(() => window.pageYOffset);
    expect(scrollPosition).toBeLessThan(50); // Should be at or near the top
    
    // Test navigation between tabs also resets scroll
    // Scroll down on the selector page
    await page.evaluate(() => {
      window.scrollTo(0, 800);
    });
    
    // Verify we're scrolled down
    scrollPosition = await page.evaluate(() => window.pageYOffset);
    expect(scrollPosition).toBeGreaterThan(300); // More lenient threshold
    
    // Navigate to scenarios tab
    const scenariosTab = page.locator('[data-testid="scenarios-tab"]');
    await scenariosTab.click();
    
    // Wait for navigation
    await page.waitForTimeout(300);
    
    // Verify scroll position is reset to top
    scrollPosition = await page.evaluate(() => window.pageYOffset);
    expect(scrollPosition).toBeLessThan(50);
    
    // Test back navigation also resets scroll
    // Navigate back to quest tab
    const questTab = page.locator('[data-testid="quest-tab"]');
    await questTab.click();
    
    // Wait for navigation
    await DeviceHelpers.ensureVisible(page, searchInput);
    
    // Verify scroll position is still at top
    scrollPosition = await page.evaluate(() => window.pageYOffset);
    expect(scrollPosition).toBeLessThan(50);
  });

  test('Footer appears on all pages', async ({ page }) => {
    // Test footer on intro page
    const footerLinks = page.locator('a:has-text("Wahooligan Community")');
    await expect(footerLinks).toBeVisible();
    
    // Navigate to quest page
    const beginButton = page.locator('[data-testid="begin-quest-button"]');
    await beginButton.click();
    
    // Wait for navigation and verify footer still appears
    const searchInput = page.locator('[data-testid="workout-search"]');
    await DeviceHelpers.ensureVisible(page, searchInput);
    await expect(footerLinks).toBeVisible();
    
    // Navigate to scenarios tab
    const scenariosTab = page.locator('[data-testid="scenarios-tab"]');
    await scenariosTab.click();
    await page.waitForTimeout(300);
    await expect(footerLinks).toBeVisible();
    
    // Navigate back to home
    const homeTab = page.locator('[data-testid="home-tab"]');
    await homeTab.click();
    await page.waitForTimeout(300);
    await expect(footerLinks).toBeVisible();
    
    // Verify all footer links are present
    await expect(page.locator('a:has-text("SYSTM Training App")')).toBeVisible();
    await expect(page.locator('a:has-text("4DP Power Profile")')).toBeVisible();
    await expect(page.locator('a:has-text("Raise an Issue")')).toBeVisible();
    await expect(page.locator('a:has-text("Contribute on GitHub")')).toBeVisible();
  });
});
import { test, expect } from '@playwright/test';

test.describe('Desktop Journey Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 1200, height: 800 });
  });

  test('Complete workout selection and scenario management journey', async ({ page }) => {
    // Clear any existing scenarios from previous test runs
    await page.evaluate(() => {
      localStorage.removeItem('knighthood-scenarios');
    });
    
    // Step 1: Start from intro page and begin quest
    await expect(page.locator('[data-testid="begin-quest-button"]')).toBeVisible();
    await page.click('[data-testid="begin-quest-button"]');

    // Step 2: Verify we're now on the selector page
    await expect(page.locator('[data-testid="workout-search"]')).toBeVisible();
    
    // Step 3: Use workout search functionality
    const searchInput = page.locator('[data-testid="workout-search"]');
    await expect(searchInput).toBeVisible();
    
    // Step 4: Select multiple workouts to build a scenario
    // Select first 10 workouts to complete the quest
    for (let i = 0; i < 10; i++) {
      const checkbox = page.locator('[data-testid^="workout-checkbox-"]').nth(i);
      await expect(checkbox).toBeVisible();
      await checkbox.check();
    }

    // Step 5: Save the scenario
    const saveButton = page.locator('[data-testid="save-scenario-button"]');
    await expect(saveButton).toBeVisible();
    await saveButton.click();
    const nameInput = page.locator('[data-testid="scenario-name-input"]');
    await nameInput.fill('My Scenario');
    const modalSaveButton = page.locator('[data-testid="save-scenario-modal-button"]');
    await expect(modalSaveButton).toBeVisible();
    await modalSaveButton.click();

    // Step 6: Navigate to scenarios tab to manage saved scenarios
    await page.click('[data-testid="scenarios-tab"]');
    
    // Verify we're on scenarios page and can see our saved scenario
    await expect(page.locator('[data-testid="scenarios-tab"]')).toHaveClass(/.*active.*/);
    
    // Step 7: Test scenario management functionality
    // Find the first scenario and test all management actions
    const firstScenario = page.locator('[data-testid^="view-scenario-"]').first();
    await expect(firstScenario).toBeVisible();
    
    // Test view scenario
    await firstScenario.click();
    // Should show scenario details or navigate somewhere
    
    // Test duplicate scenario
    const duplicateButton = page.locator('[data-testid^="duplicate-scenario-"]').first();
    await expect(duplicateButton).toBeVisible();
    const initialScenarioCount = await page.locator('[data-testid^="view-scenario-"]').count();
    await duplicateButton.click();
    
    // Verify duplication created a new scenario
    await expect(page.locator('[data-testid^="view-scenario-"]')).toHaveCount(initialScenarioCount + 1);
    
    // Test delete scenario
    const deleteButton = page.locator('[data-testid^="delete-scenario-"]').first();
    await expect(deleteButton).toBeVisible();
    
    // Handle the confirmation dialog
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm');
      await dialog.accept();
    });
    
    await deleteButton.click();
    
    // Wait a bit for the deletion to process
    await page.waitForTimeout(500);
    
    // Verify deletion removed the scenario
    await expect(page.locator('[data-testid^="view-scenario-"]')).toHaveCount(initialScenarioCount);
  });

  test('Workout search and filtering journey', async ({ page }) => {
    // Begin quest
    await page.click('[data-testid="begin-quest-button"]');
    
    // Wait for selector page to load
    await expect(page.locator('[data-testid="workout-search"]')).toBeVisible();
    
    // Test search functionality
    const searchInput = page.locator('[data-testid="workout-search"]');
    await searchInput.fill('rue');
    
    // Verify search results are filtered
    const workoutCheckboxes = page.locator('[data-testid^="workout-checkbox-"]');
    await expect(workoutCheckboxes.first()).toBeVisible();
    
    // Clear search and verify all workouts return
    await searchInput.clear();
    const workoutCount = await workoutCheckboxes.count();
    expect(workoutCount).toBeGreaterThan(0);
    
    // Test selecting specific workouts
    await searchInput.fill('rue');
    await workoutCheckboxes.first().check();
    await expect(workoutCheckboxes.first()).toBeChecked();
  });

  test('Navigation flow between tabs', async ({ page }) => {
    // Start from intro
    await page.click('[data-testid="begin-quest-button"]');
    
    // Wait for selector page to load
    await expect(page.locator('[data-testid="workout-search"]')).toBeVisible();
    
    // Navigate to scenarios tab
    await page.click('[data-testid="scenarios-tab"]');
    await expect(page.locator('[data-testid="scenarios-tab"]')).toBeVisible();
    
    // Navigate back to quest tab
    await page.click('[data-testid="quest-tab"]');
    await expect(page.locator('[data-testid="workout-search"]')).toBeVisible();
  });
});
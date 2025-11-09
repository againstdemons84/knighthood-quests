import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3001',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot only when test fails */
    screenshot: 'only-on-failure',

    /* Record video only when test fails */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers and viewports */
  projects: [
    // Desktop browsers
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['**/desktop.spec.ts', '**/cross-platform.spec.ts'],
    },

    {
      name: 'desktop-firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: ['**/desktop.spec.ts', '**/cross-platform.spec.ts'],
    },

    {
      name: 'desktop-webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: ['**/desktop.spec.ts', '**/cross-platform.spec.ts'],
    },

    // Mobile browsers
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 5'] },
      testMatch: ['**/mobile.spec.ts', '**/cross-platform.spec.ts'],
    },
    {
      name: 'mobile-webkit',
      use: { ...devices['iPhone 12'] },
      testMatch: ['**/mobile.spec.ts', '**/cross-platform.spec.ts'],
    },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'PORT=3001 npm start',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes for the dev server to start
  },
});
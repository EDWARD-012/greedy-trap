import { defineConfig, devices } from '@playwright/test'

// Set E2E_URL to run the same tests against a deployed copy, for example
// E2E_URL=https://greedy-trap.edward7780.com/ npm run e2e
const deployed = process.env.E2E_URL

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: deployed ?? 'http://localhost:4173/',
  },
  webServer: deployed
    ? undefined
    : {
        command: 'npm run build && npm run preview -- --port 4173 --strictPort',
        url: 'http://localhost:4173/',
        reuseExistingServer: !process.env.CI,
      },
  projects: [
    // E2E_CHROME_CHANNEL=chrome uses an installed Chrome instead of
    // Playwright's own Chromium build.
    { name: 'chromium', use: { ...devices['Desktop Chrome'], channel: process.env.E2E_CHROME_CHANNEL } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'phone', use: { ...devices['iPhone 13'] } },
  ],
})

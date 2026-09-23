import { defineConfig, devices } from '@playwright/test'

/**
 * Smoke tests against a real deployment.
 *
 * There is no web server here on purpose: these sign in to a running STOA with
 * real accounts, which is where every defect found by hand has actually lived.
 * Point them somewhere else with `PLAYWRIGHT_BASE_URL`.
 */
export default defineConfig({
  testDir: './tests/smoke',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'https://app.stoaedu.ch',
    trace: 'off',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})

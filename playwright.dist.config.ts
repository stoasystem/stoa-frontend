import { defineConfig, devices } from '@playwright/test'
import { WEB_ORIGIN } from './tests/e2e-dist/support/origins'

/**
 * End-to-end tests against the built dist, with the backend mocked (#29).
 *
 * Run `npm run build` first. The global setup publishes a copy of dist with
 * the real publisher and fetches the backend's OpenAPI document; the tests
 * serve that copy and answer the API inside the browser, so nothing is
 * listening on a port and nothing reaches a real service.
 *
 * No retries: a test that needs one is a finding, not noise.
 */
export default defineConfig({
  testDir: './tests/e2e-dist',
  globalSetup: './tests/e2e-dist/support/global-setup.ts',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: 'list',
  use: {
    baseURL: WEB_ORIGIN,
    locale: 'en-US',
    timezoneId: 'Europe/Zurich',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})

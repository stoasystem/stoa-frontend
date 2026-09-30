import { defineConfig, devices } from '@playwright/test'

/**
 * Smoke tests against a real deployment.
 *
 * There is no web server here on purpose: these sign in to a running STOA with
 * real accounts, which is where every defect found by hand has actually lived.
 * Point them somewhere else with `PLAYWRIGHT_BASE_URL`.
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'https://app.stoaedu.ch'

/**
 * A preview behind Basic Auth (#42, #30): set both `STOA_SMOKE_BASIC_USER`
 * and `STOA_SMOKE_BASIC_PASSWORD`. The browser then answers the site's prompt,
 * and only that site's -- never the API's. The password stays out of the
 * repository, like `STOA_SMOKE_PASSWORD`.
 *
 * Only for this suite. The cold-start check of the startup loaders must not
 * answer the prompt for the page, or it would hide a loader that forgets to
 * send the credentials the browser has cached.
 */
function basicAuth(): { username: string; password: string; origin: string } | undefined {
  const username = process.env.STOA_SMOKE_BASIC_USER
  const password = process.env.STOA_SMOKE_BASIC_PASSWORD
  if (!username && !password) return undefined
  if (!username || !password) {
    throw new Error('Set both STOA_SMOKE_BASIC_USER and STOA_SMOKE_BASIC_PASSWORD, or neither.')
  }
  return { username, password, origin: new URL(baseURL).origin }
}

export default defineConfig({
  testDir: './tests/smoke',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL,
    httpCredentials: basicAuth(),
    trace: 'off',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})

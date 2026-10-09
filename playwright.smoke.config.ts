import { defineConfig, devices } from '@playwright/test'

/**
 * Smoke tests against a real deployment.
 *
 * There is no web server here on purpose: these sign in to a running STOA with
 * real accounts, which is where every defect found by hand has actually lived.
 * Point them somewhere else with `PLAYWRIGHT_BASE_URL`. How to run them, and
 * what a person has to confirm afterwards, is at the top of
 * tests/smoke/01-preflight.spec.ts.
 *
 * Two projects. `offline` checks the smoke's own tools against mocked pages and
 * fixed answers, with every request answered in the browser and nothing sent
 * anywhere; `production` depends on it, so a watcher that has stopped seeing
 * failures stops the run before it reports a clean deployment.
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
  globalSetup: './tests/smoke/global-setup.ts',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  // Never retried: a retry is another generation request against #27's budget
  // of five per run, and the files run in order (read-only first, logout last).
  retries: 0,
  reporter: 'list',
  use: {
    baseURL,
    httpCredentials: basicAuth(),
    trace: 'off',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'offline',
      testDir: './tests/smoke/offline',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://app.smoke-offline.test' },
    },
    {
      name: 'production',
      testIgnore: /offline\//,
      dependencies: ['offline'],
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})

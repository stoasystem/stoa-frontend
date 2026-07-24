import { defineConfig, devices } from '@playwright/test'

const stripeSandboxRequested = process.env.STOA_STRIPE_SANDBOX === 'true'
const stripeSandboxBaseURL =
  process.env.STOA_STRIPE_SANDBOX_WEB_ORIGIN ?? 'https://sandbox-configuration-required.invalid'
const stripeSandboxPreflight = 'scripts/stripe-sandbox-preflight.mjs'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: stripeSandboxRequested
      ? stripeSandboxBaseURL
      : (process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5173'),
    trace: stripeSandboxRequested ? 'off' : 'on-first-retry',
    screenshot: 'off',
    video: 'off',
  },
  webServer: stripeSandboxRequested ? undefined : {
    command: 'npm run dev -- --host 127.0.0.1',
    env: {
      VITE_API_BASE_URL: 'http://127.0.0.1:65535',
      VITE_ENABLE_DEMO_API: 'true',
      VITE_ENABLE_MOCK_CHECKOUT: 'true',
      VITE_ENABLE_PAYMENT: 'false',
      VITE_ENABLE_REALTIME_NOTIFICATIONS: process.env.VITE_ENABLE_REALTIME_NOTIFICATIONS ?? 'false',
      VITE_WEBSOCKET_BASE_URL: process.env.VITE_WEBSOCKET_BASE_URL ?? '',
      VITE_SHOW_DEMO_SURFACES: 'true',
    },
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: false,
    stdout: 'ignore',
    stderr: 'pipe',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'stripe-sandbox-preflight',
      testMatch: /stripe-sandbox-preflight\.spec\.ts/,
      metadata: {
        startupDependency: stripeSandboxPreflight,
      },
      use: {
        ...devices['Desktop Chrome'],
        baseURL: stripeSandboxBaseURL,
        screenshot: 'off',
        trace: 'off',
        video: 'off',
      },
    },
    {
      name: 'stripe-sandbox',
      dependencies: ['stripe-sandbox-preflight'],
      testIgnore: /stripe-sandbox-preflight\.spec\.ts/,
      metadata: {
        acceptanceSpec: 'tests/e2e/billing-paid-access.spec.ts',
        mockCheckout: false,
        routeInterception: false,
        startupDependency: stripeSandboxPreflight,
      },
      use: {
        ...devices['Desktop Chrome'],
        baseURL: stripeSandboxBaseURL,
        screenshot: 'off',
        trace: 'off',
        video: 'off',
      },
    },
  ],
})

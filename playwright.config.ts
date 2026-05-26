import { defineConfig, devices } from '@playwright/test'

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
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    env: {
      VITE_API_BASE_URL: 'http://127.0.0.1:65535',
      VITE_ENABLE_DEMO_API: 'true',
      VITE_ENABLE_MOCK_CHECKOUT: 'true',
      VITE_ENABLE_PAYMENT: 'false',
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
  ],
})

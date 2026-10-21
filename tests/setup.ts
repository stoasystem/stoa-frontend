import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// src/lib/env.ts reads runtime config at import time, so anything importing
// the API layer needs a config registered before the first module evaluates.
vi.mock('@/lib/env', () => ({
  appEnv: 'staging',
  apiMode: 'staging',
  apiBaseUrl: 'https://api.test',
  enableMSW: false,
  isDevelopment: false,
  isStaging: true,
  isProduction: false,
  isProductionFacing: false,
  enableDemoShortcuts: false,
  enableAnalytics: false,
  enableFeedback: true,
  enablePayment: false,
  enableMockCheckout: false,
  enablePublicRegister: true,
  enableTeacherHelp: true,
  enableParentReport: true,
  enableReferral: false,
  enableSupportTickets: true,
  enableDemoApi: false,
  enableRealtimeNotifications: false,
  websocketBaseUrl: '',
  allowDemoFallback: false,
  showDemoAccounts: false,
  showDemoBadges: false,
  showInternalDebug: false,
  showDemoSurfaces: false,
  showCheckoutPreview: false,
}))

// Every language in full, as when all four shipped inside the app: a test
// switches with a bare changeLanguage and reads the next line in the new
// language. The app itself ships English and loads the rest when a tab is
// read in it (#414); i18nLoading414.test.tsx takes this away to test that.
vi.mock('@/i18n/resources', async (importOriginal) => {
  const files = import.meta.glob<Record<string, unknown>>('../src/i18n/locales/*/*.json', { import: 'default' })
  const bundledResources: Record<string, Record<string, Record<string, unknown>>> = {}
  for (const [file, load] of Object.entries(files)) {
    const [, language, namespace] = /\/locales\/([^/]+)\/([^/]+)\.json$/.exec(file) ?? []
    ;(bundledResources[language] ??= {})[namespace] = await load()
  }
  return { ...(await importOriginal<typeof import('@/i18n/resources')>()), bundledResources }
})

afterEach(() => {
  cleanup()
})

// Node 25+ has its own global localStorage and sessionStorage, which Vitest
// leaves in place of jsdom's. Without --localstorage-file they are undefined;
// with it they are Node's Storage, which jsdom's StorageEvent refuses as a
// storageArea, Storage.prototype spies never see, and every test file shares
// through the one file. Point both at the jsdom window's own, as on Node 22:
// a fresh pair for each test file, of the Storage class the page sees. Read
// only, like the browser's: no setter of Node's is left to swallow an
// assignment. A test file in another environment has no jsdom and keeps its own.
const dom = (globalThis as unknown as { jsdom?: { window: Window } }).jsdom?.window
if (dom) {
  for (const name of ['localStorage', 'sessionStorage'] as const) {
    const storage = dom[name]
    Object.defineProperty(globalThis, name, { configurable: true, enumerable: true, get: () => storage, set: undefined })
  }
}

// jsdom implements neither, and Radix/scroll-area primitives touch both.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

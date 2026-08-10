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

afterEach(() => {
  cleanup()
})

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

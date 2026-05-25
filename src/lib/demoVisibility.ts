import {
  apiMode,
  appEnv,
  enableDemoApi,
  enableMockCheckout,
  showCheckoutPreview,
  showDemoAccounts,
  showDemoBadges,
  showDemoSurfaces,
  showInternalDebug,
} from '@/lib/env'

export type DemoVisibility = {
  appEnv: typeof appEnv
  apiMode: typeof apiMode
  demoApiEnabled: boolean
  mockCheckoutEnabled: boolean
  showDemoAccounts: boolean
  showDemoBadges: boolean
  showDemoSurfaces: boolean
  showCheckoutPreview: boolean
  showInternalDebug: boolean
}

export const demoVisibility: DemoVisibility = {
  appEnv,
  apiMode,
  demoApiEnabled: enableDemoApi,
  mockCheckoutEnabled: enableMockCheckout,
  showDemoAccounts,
  showDemoBadges,
  showDemoSurfaces,
  showCheckoutPreview,
  showInternalDebug,
}

export function canShowDemoNavigation(explicitOverride?: boolean) {
  return explicitOverride ?? showDemoSurfaces
}

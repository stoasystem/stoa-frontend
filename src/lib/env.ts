import { getRuntimeConfig } from '@/lib/runtimeConfig'

export type ApiMode = 'mock' | 'demo' | 'staging' | 'production'
export type AppEnv = 'development' | 'staging' | 'staging-pilot' | 'production'

const runtimeConfig = getRuntimeConfig()

export const appEnv: AppEnv = runtimeConfig.environment
export const apiMode: ApiMode = appEnv === 'production' ? 'production' : 'staging'
export const apiBaseUrl: string = runtimeConfig.api.origin
export const enableMSW: boolean = false

export const isDevelopment: boolean = false
export const isStaging: boolean = appEnv === 'staging' || appEnv === 'staging-pilot'
export const isProduction: boolean = appEnv === 'production'
export const isProductionFacing: boolean = isProduction || appEnv === 'staging-pilot'

export const enableDemoShortcuts: boolean = false
export const enableAnalytics: boolean = runtimeConfig.features.analytics
export const enableFeedback: boolean = runtimeConfig.features.feedback
export const enablePayment: boolean = runtimeConfig.features.payments
export const enableMockCheckout: boolean = false
export const enablePublicRegister: boolean = runtimeConfig.features.publicRegistration
export const enableTeacherHelp: boolean = runtimeConfig.features.teacherHelp
export const enableParentReport: boolean = runtimeConfig.features.parentReports
export const enableReferral: boolean = runtimeConfig.features.referrals
export const enableSupportTickets: boolean = runtimeConfig.features.supportTickets
export const enableDemoApi: boolean = false
export const enableRealtimeNotifications: boolean = runtimeConfig.features.realtimeNotifications
export const websocketBaseUrl: string = runtimeConfig.realtime.endpoint ?? ''
export const allowDemoFallback: boolean = false

export const showDemoAccounts: boolean = false
export const showDemoBadges: boolean = false
export const showInternalDebug: boolean = false
export const showDemoSurfaces: boolean = false
export const showCheckoutPreview: boolean = false

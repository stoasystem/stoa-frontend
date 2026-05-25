import { DEFAULT_API_BASE_URL } from '@/lib/constants'

export type ApiMode = 'mock' | 'demo' | 'staging' | 'production'

export const appEnv = import.meta.env.VITE_APP_ENV ?? 'development'
export const apiMode = (import.meta.env.VITE_API_MODE ?? 'demo') as ApiMode
export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
export const enableMSW = import.meta.env.VITE_ENABLE_MSW === 'true'

export const isDevelopment = appEnv === 'development'
export const isStaging = appEnv === 'staging'
export const isProduction = appEnv === 'production'

export const enableDemoShortcuts = import.meta.env.VITE_ENABLE_DEMO_SHORTCUTS === 'true'
export const enableAnalytics = import.meta.env.VITE_ENABLE_ANALYTICS === 'true'
export const enableFeedback = import.meta.env.VITE_ENABLE_FEEDBACK === 'true'
export const enablePayment = import.meta.env.VITE_ENABLE_PAYMENT === 'true'
export const enableMockCheckout = import.meta.env.VITE_ENABLE_MOCK_CHECKOUT === 'true'
export const enablePublicRegister = import.meta.env.VITE_ENABLE_PUBLIC_REGISTER === 'true'
export const enableTeacherHelp = import.meta.env.VITE_ENABLE_TEACHER_HELP !== 'false'
export const enableParentReport = import.meta.env.VITE_ENABLE_PARENT_REPORT !== 'false'
export const enableReferral = import.meta.env.VITE_ENABLE_REFERRAL !== 'false'
export const enableSupportTickets = import.meta.env.VITE_ENABLE_SUPPORT_TICKETS !== 'false'
export const enableDemoApi = import.meta.env.VITE_ENABLE_DEMO_API === 'true'
export const allowDemoFallback = apiMode === 'mock' || (apiMode === 'demo' && enableDemoApi)

export const appEnv = import.meta.env.VITE_APP_ENV ?? 'development'

export const isDevelopment = appEnv === 'development'
export const isStaging = appEnv === 'staging'
export const isProduction = appEnv === 'production'

export const enableDemoShortcuts = import.meta.env.VITE_ENABLE_DEMO_SHORTCUTS === 'true'
export const enableAnalytics = import.meta.env.VITE_ENABLE_ANALYTICS === 'true'
export const enableFeedback = import.meta.env.VITE_ENABLE_FEEDBACK === 'true'

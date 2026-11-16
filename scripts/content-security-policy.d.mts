export type PolicySources = { apiOrigin: string; uploadOrigin: string; whiteboardOrigin: string }

export const PRODUCTION_SOURCES: Readonly<PolicySources>

export const DAILY_SCRIPT_SOURCES: readonly string[]

export const DAILY_CONNECT_SOURCES: readonly string[]

export function contentSecurityPolicy(sources: PolicySources): string

export type PolicySources = { apiOrigin: string; uploadOrigin: string }

export const PRODUCTION_SOURCES: Readonly<PolicySources>

export function contentSecurityPolicy(sources: PolicySources): string

export type ServiceSource = { file: string; source: string }
export type ServiceCall = { method: string; path: string; file: string }
export type UnparsedCall = { file: string; line: number; text: string }
export type KnownGap = { file: string; call: string; reason: string }
export type BackendRoutes = Map<string, Set<string>>

export const MIN_CHECKED_CALLS: number
export const PASSTHROUGH_CALLS: { file: string; text: string }[]
export const KNOWN_GAPS: KnownGap[]
export function normalise(path: string): string
export function loadBackendRoutes(inventory: { method: string; path: string }[]): BackendRoutes
export function collectCalls(sources: ServiceSource[]): { calls: ServiceCall[]; unparsed: UnparsedCall[] }
export function matchesBackendRoute(backend: BackendRoutes, callPath: string, method: string): boolean
export function findMissing(
  backend: BackendRoutes,
  calls: ServiceCall[],
  knownGaps?: KnownGap[],
): { missing: Map<string, string[]>; staleGaps: KnownGap[] }

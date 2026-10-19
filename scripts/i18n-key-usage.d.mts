type Uses = { exact: Record<string, Set<string>>; prefixes: Record<string, Set<string>>; suffixes: Set<string> }
export const LANGUAGES: string[]
export function collectUses(files: [string, string][]): Uses
export function isUsed(ns: string, key: string, uses: Uses): boolean
export function unusedKeys(root?: string): Record<string, string[]>

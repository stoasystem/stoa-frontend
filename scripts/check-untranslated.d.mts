export type UntranslatedFinding = { file: string; line: number; kind: string; text: string }
export const EXCLUDE: RegExp[]
export function isReadable(text: string): boolean
export function isSentence(text: string): boolean
export function scanSource(fileName: string, source: string): UntranslatedFinding[]
export function scan(root?: string): UntranslatedFinding[]

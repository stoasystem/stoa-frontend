/*
 * Stands in for KaTeX's built file at the address a failed import names
 * (chunkRecovery447.test.tsx). It records the address it was loaded from, so
 * the test sees which one the retry asked for.
 */
import katex from 'katex'

const loads = ((globalThis as { katexLoads447?: string[] }).katexLoads447 ??= [])
loads.push(import.meta.url)

export default katex

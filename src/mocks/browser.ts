/**
 * MSW browser worker setup.
 *
 * Only imported when VITE_ENABLE_MSW=true (controlled by src/lib/env.ts).
 * This module is tree-shaken out of production builds.
 */
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

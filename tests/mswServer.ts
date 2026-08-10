import { setupServer } from 'msw/node'
import { handlers } from '@/mocks/handlers'

/**
 * Node-side MSW server for component tests that exercise the real API layer.
 * Opt in per suite:
 *
 *   beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }))
 *   afterEach(() => mswServer.resetHandlers())
 *   afterAll(() => mswServer.close())
 */
export const mswServer = setupServer(...handlers)

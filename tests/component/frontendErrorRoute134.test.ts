/**
 * Card 134-R5: an error report carries the route pattern, never the address,
 * and no id from an address survives in its message or stack.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const post = vi.fn()
vi.mock('@/services/api/httpClient', () => ({ httpClient: { post: (...args: unknown[]) => post(...args) } }))
vi.mock('@/lib/runtimeConfig', () => ({ getRuntimeConfig: () => ({ features: { errorMonitoring: true } }) }))

import { reportFrontendError } from '@/services/monitoring/frontendErrorMonitoring'

const ID = '7f3c2a10-9b1e-4c5d-8e2f-0a1b2c3d4e5f'

function lastPayload() {
  expect(post).toHaveBeenCalledTimes(1)
  return post.mock.calls[0][1] as Record<string, string | undefined>
}

describe('frontend error report route', () => {
  beforeEach(() => post.mockReset())
  afterEach(() => window.history.replaceState(null, '', '/'))

  it('reports the route pattern of an address carrying an id', async () => {
    window.history.replaceState(null, '', `/teacher/requests/${ID}?tab=notes#n1`)
    await reportFrontendError(new Error('boom'))
    const payload = lastPayload()
    expect(payload.route).toBe('/teacher/requests/:requestId')
    expect(JSON.stringify(payload)).not.toContain(ID)
  })

  it('reports a fixed placeholder, not the address, when no route matches', async () => {
    window.history.replaceState(null, '', `/no-such-page/${ID}`)
    await reportFrontendError(new Error('boom'))
    const payload = lastPayload()
    expect(payload.route).toBe('*')
    expect(JSON.stringify(payload)).not.toContain('no-such-page')
  })

  it('strips ids and query strings from the message and stack', async () => {
    const error = new Error(`Request to https://api.stoaedu.ch/teacher/requests/${ID}?child=${ID} failed`)
    error.stack = [
      'Error: load /users/1234567/report',
      '    at load (https://app.stoaedu.ch/assets/index-Bx12abcd.js:1:234)',
      `    at https://app.stoaedu.ch/teacher/requests/${ID}:3:9`,
    ].join('\n')
    await reportFrontendError(error, { componentStack: `    at Page (https://app.stoaedu.ch/x/${ID}.js)` })
    const payload = lastPayload()
    const serialized = JSON.stringify(payload)
    expect(serialized).not.toContain(ID)
    expect(serialized).not.toContain('1234567')
    expect(serialized).not.toContain('child=')
    expect(serialized).toContain('index-Bx12abcd.js:1:234')
    expect(payload.message).toBe('Request to https://api.stoaedu.ch/teacher/requests/:id failed')
  })
})

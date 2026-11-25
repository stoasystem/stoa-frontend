/**
 * Card 134-F2: `page_viewed` is sent once per change of page, with the route
 * pattern, and `web_vitals` once per pattern when the page is hidden.
 */
import { act, render } from '@testing-library/react'
import { useState } from 'react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { trackEvent } from '@/services/analytics/analyticsClient'
import { PageViewTracker } from '@/services/analytics/PageViewTracker'

const ID = '7f3c2a10-9b1e-4c5d-8e2f-0a1b2c3d4e5f'
const tracked = vi.mocked(trackEvent)

let go: (to: string) => void = () => {}
let rerender: () => void = () => {}

function Harness() {
  const navigate = useNavigate()
  const [, setTick] = useState(0)
  go = (to) => navigate(to)
  rerender = () => setTick((n) => n + 1)
  return <PageViewTracker />
}

function views() {
  return tracked.mock.calls.filter(([name]) => name === 'page_viewed').map(([, payload]) => payload)
}

beforeEach(() => tracked.mockClear())

describe('PageViewTracker', () => {
  it('sends one view per change of path, with the pattern and never the id', () => {
    render(
      <MemoryRouter initialEntries={['/admin/users']}>
        <Harness />
      </MemoryRouter>,
    )
    expect(views()).toHaveLength(1)
    expect(views()[0]).toMatchObject({ route: '/admin/users' })
    expect(typeof views()[0]?.load_ms).toBe('number')

    act(() => rerender())
    act(() => rerender())
    expect(views()).toHaveLength(1)

    act(() => go(`/admin/users/${ID}/usage-period`))
    expect(views()).toHaveLength(2)
    expect(views()[1]).toMatchObject({ route: '/admin/users/:userId/usage-period' })
    expect(JSON.stringify(views())).not.toContain(ID)

    act(() => go(`/admin/users/${ID}/usage-period?tab=x`))
    expect(views()).toHaveLength(2)
  })

  it('waits for the page skeleton to go before timing the view', () => {
    const skeleton = document.createElement('div')
    skeleton.setAttribute('data-page-skeleton', '')
    document.body.appendChild(skeleton)
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Harness />
      </MemoryRouter>,
    )
    expect(views()).toHaveLength(0)

    // Leaving before it settles sends the view without a time.
    act(() => go('/admin/users'))
    expect(views()[0]).toEqual({ route: '/admin', load_ms: null })
    expect(views()).toHaveLength(1)
    skeleton.remove()
  })
})

describe('web vitals', () => {
  it('sends each route pattern once, rounded, when the page is hidden', async () => {
    vi.resetModules()
    const observers: { type: string; callback: PerformanceObserverCallback }[] = []
    class FakeObserver {
      constructor(private callback: PerformanceObserverCallback) {}
      observe(options: { type: string }) {
        observers.push({ type: options.type, callback: this.callback })
      }
      disconnect() {}
    }
    vi.stubGlobal('PerformanceObserver', FakeObserver)
    const client = await import('@/services/analytics/analyticsClient')
    const sent = vi.mocked(client.trackEvent)
    sent.mockClear()
    const vitals = await import('@/services/analytics/webVitals')

    const feed = (type: string, entries: object[]) => {
      for (const o of observers.filter((x) => x.type === type)) {
        o.callback({ getEntries: () => entries } as unknown as PerformanceObserverEntryList, {} as PerformanceObserver)
      }
    }

    vitals.setVitalsRoute('/admin/users')
    vitals.startWebVitals()
    feed('largest-contentful-paint', [{ startTime: 1234.6 }])
    feed('layout-shift', [{ value: 0.01234, hadRecentInput: false }, { value: 0.5, hadRecentInput: true }])
    feed('event', [{ entryType: 'event', interactionId: 3, duration: 180.4 }, { entryType: 'event', interactionId: 0, duration: 900 }])
    vitals.setVitalsRoute('/admin/users/:userId/usage-period')
    feed('event', [{ entryType: 'event', interactionId: 5, duration: 64.5 }])

    const hide = () => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
      document.dispatchEvent(new Event('visibilitychange'))
    }
    hide()
    hide()

    const calls = sent.mock.calls.filter(([name]) => name === 'web_vitals').map(([, payload]) => payload)
    expect(calls).toEqual([
      { route: '/admin/users', lcp: 1235, inp: 180, cls: 0.012 },
      { route: '/admin/users/:userId/usage-period', lcp: null, inp: 65, cls: 0 },
    ])
    vi.unstubAllGlobals()
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
  })
})

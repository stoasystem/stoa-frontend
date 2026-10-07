// The entries import CSS, declared for tsc by vite/client (src/vite-env.d.ts is not in this project).
/// <reference types="vite/client" />
/**
 * The star map bench (`starmap.html`) and the component gallery
 * (`components.html`) sign in a fake account on the dev server's origin, which
 * the real dev app shares (#135, #126 audit F6). Like the design preview they
 * must replace the page's storage and intercept its network before any app
 * module loads, so a token the real app left behind is never read and no
 * request leaves the dev server.
 *
 * Each entry is imported the way its HTML page loads it. The mocks only
 * record, when an app module is first evaluated, whether the storage was
 * already isolated and the interception installed.
 */
import { waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const seen = vi.hoisted(() => ({ loads: [] as { module: string; isolated: boolean; intercepted: boolean }[], realLocal: null as Storage | null }))

vi.hoisted(() => {
  seen.realLocal = window.localStorage
})

function record(module: string) {
  seen.loads.push({
    module,
    isolated: window.localStorage !== seen.realLocal,
    intercepted: '__stoaPreview' in window,
  })
}

const RECORDED = ['@/i18n', '@/store/authStore', '@/components/base', '@/pages/map/MapPages']

const REAL_TOKEN = 'real-dev-token-must-stay-unread'
const realFetch = window.fetch
const realSocket = window.WebSocket
const passedThrough = vi.fn(async () => new Response('dev server file'))
const storages = (['localStorage', 'sessionStorage'] as const).map((name) => [name, Object.getOwnPropertyDescriptor(window, name)] as const)

beforeEach(() => {
  vi.resetModules()
  seen.loads.length = 0
  // `doMock` after the reset, so every entry evaluates the modules afresh.
  for (const module of RECORDED) {
    vi.doMock(module, async (importOriginal) => {
      record(module)
      return importOriginal()
    })
  }
  window.localStorage.setItem('stoa_access_token', REAL_TOKEN)
  window.sessionStorage.setItem('stoa_tab_access_token', REAL_TOKEN)
  window.fetch = passedThrough as typeof window.fetch
  passedThrough.mockClear()
  document.body.innerHTML = '<div id="root"></div>'
})

afterEach(() => {
  for (const module of RECORDED) vi.doUnmock(module)
  // Back to jsdom's own storage.
  for (const [name, descriptor] of storages) {
    if (descriptor) Object.defineProperty(window, name, descriptor)
    else Reflect.deleteProperty(window, name)
  }
  Reflect.deleteProperty(window, '__stoaPreview')
  window.fetch = realFetch
  window.WebSocket = realSocket
  window.localStorage.clear()
  window.sessionStorage.clear()
})

describe.each([
  ['starmap.html', () => import('@/dev/starmapBench'), ['@/i18n', '@/store/authStore', '@/pages/map/MapPages']],
  ['components.html', () => import('@/dev/gallery'), ['@/i18n', '@/components/base', '@/store/authStore']],
])('%s', (_page, load, modules) => {
  it('isolates storage and intercepts the network before any app module loads', async () => {
    await load()
    await waitFor(() => expect(document.getElementById('root')?.childElementCount).toBeGreaterThan(0), { timeout: 20_000 })
    for (const module of modules) {
      expect(seen.loads).toContainEqual({ module, isolated: true, intercepted: true })
    }
    expect(seen.loads.filter((load) => !load.isolated || !load.intercepted)).toEqual([])
  }, 30_000)

  it('never reads the real token and sends nothing past the dev server', async () => {
    const realLocal = window.localStorage
    const realSession = window.sessionStorage
    await load()
    await waitFor(() => expect(document.getElementById('root')?.childElementCount).toBeGreaterThan(0), { timeout: 20_000 })

    expect(window.localStorage).not.toBe(realLocal)
    expect(window.localStorage.getItem('stoa_access_token')).toBeNull()
    expect(window.sessionStorage.getItem('stoa_tab_access_token')).toBeNull()

    const { httpClient } = await import('@/services/api/httpClient')
    const response = await httpClient.get('/auth/me')
    expect(response.status).toBe(200)
    expect(String(response.config.headers.Authorization ?? '')).not.toContain(REAL_TOKEN)

    for (const url of ['http://localhost:8000/notifications', '/api/auth/me', 'https://api.stoaedu.ch/auth/me']) {
      await window.fetch(url)
    }
    const socket = new window.WebSocket('ws://localhost:8000/ws')
    expect(socket.readyState).toBe(0)
    expect(passedThrough).not.toHaveBeenCalled()

    // The real storage is left exactly as the real app left it.
    expect(realLocal.getItem('stoa_access_token')).toBe(REAL_TOKEN)
    expect(realSession.getItem('stoa_tab_access_token')).toBe(REAL_TOKEN)
  }, 30_000)
})

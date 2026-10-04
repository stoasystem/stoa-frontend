/**
 * The design preview answers every request the dev server's `/api` proxy
 * would forward (#126 audit, F2). Vite's proxy matches the bare prefix -
 * `/api`, `/api?x=1` and `/apiauth/me` are all forwarded to the backend - so
 * the preview's fetch replacement must take every one of them, answer it and
 * record it, and let only the dev server's own files through.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { DEV_PROXY_PREFIX, installInterception } from '@/dev/preview/interception'

type Journal = { unanswered: { method: string; url: string; status: number }[] }

const realFetch = window.fetch
const passedThrough = vi.fn(async () => new Response('dev server file'))

beforeAll(async () => {
  window.fetch = passedThrough as typeof window.fetch
  await installInterception()
})

afterAll(() => {
  window.fetch = realFetch
})

describe('the design preview fetch replacement', () => {
  it('uses the same prefix the dev server proxies', () => {
    const config = readFileSync(path.resolve(__dirname, '../../vite.config.ts'), 'utf8')
    const proxy = /proxy:\s*\{([\s\S]*?)\n {4}\},?\n/.exec(config)?.[1] ?? ''
    expect([...proxy.matchAll(/^ {6}'([^']+)':/gm)].map(([, key]) => key)).toEqual([DEV_PROXY_PREFIX])
  })

  it.each([
    ['/api', '/'],
    ['/api?x=1', '/?x=1'],
    ['/apiauth/me', '/apiauth/me'],
    ['/api/no-such-route', '/no-such-route'],
  ])('answers %s itself and records it as %s', async (url, recorded) => {
    passedThrough.mockClear()
    const response = await window.fetch(url)
    expect(passedThrough).not.toHaveBeenCalled()
    expect(response.status).toBe(404)
    const journal = (window as unknown as { __stoaPreview: Journal }).__stoaPreview
    expect(journal.unanswered[journal.unanswered.length - 1]).toEqual({ method: 'GET', url: recorded, status: 404 })
  })

  it('lets the dev server files through (negative control)', async () => {
    passedThrough.mockClear()
    for (const url of ['/src/main.tsx', '/@vite/client', '/node_modules/.vite/deps/react.js', '/a/api/x']) await window.fetch(url)
    expect(passedThrough).toHaveBeenCalledTimes(4)
  })
})

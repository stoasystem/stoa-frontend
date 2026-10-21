/**
 * #419: the versions that cleared `npm audit --omit=dev`, and the one advisory
 * a visitor's browser could meet.
 *
 * Both gates run the audit itself (tests/release/verify-release.test.mjs pins
 * the step). It asks the registry, and it says nothing about why a version is
 * in the lock. This pins the floors the ticket set, offline: axios 1.20.0, and
 * react-router with react-router-dom on one version, 7.18.2 or later.
 *
 * Then the router's backslash fix (GHSA-wrjc-x8rr-h8h6, in 7.18.0). To a
 * browser `/\evil.example` is `//evil.example`, another host. Before the fix
 * `navigate()` kept the backslash, `pushState` refused the other origin, and
 * the router fell back to `location.assign`: off the site. The app's own
 * destinations go through `URL` first (`resolveDestination` in authRoutes), so
 * this is the second line: a call site that forgets that still stays here.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { act, render } from '@testing-library/react'
import { useEffect } from 'react'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

const LOCK = path.resolve(__dirname, '../../package-lock.json')

type LockEntry = { version?: string }

/** Every copy of `name` the lock installs, nested ones included. */
function lockedVersions(name: string): string[] {
  const lock = JSON.parse(readFileSync(LOCK, 'utf8')) as { packages: Record<string, LockEntry> }
  return Object.entries(lock.packages)
    .filter(([key]) => key === `node_modules/${name}` || key.endsWith(`/node_modules/${name}`))
    .map(([, entry]) => entry.version ?? '')
}

/** `version` is at least `floor`, compared as major.minor.patch. */
function atLeast(version: string, floor: string) {
  const parts = (value: string) => value.split('-')[0].split('.').map(Number)
  const [have, want] = [parts(version), parts(floor)]
  for (let index = 0; index < 3; index += 1) {
    if (have[index] !== want[index]) return have[index] > want[index]
  }
  return true
}

describe('#419: the lock carries the versions the audit cleared', () => {
  it('compares versions numerically, not as text', () => {
    // Negative control: as strings, '1.9.0' sorts after '1.20.0'.
    expect(atLeast('1.9.0', '1.20.0')).toBe(false)
    expect(atLeast('1.20.0', '1.20.0')).toBe(true)
    expect(atLeast('7.18.10', '7.18.2')).toBe(true)
  })

  it('installs axios 1.20.0 or later, once', () => {
    const versions = lockedVersions('axios')
    expect(versions).toHaveLength(1)
    expect(versions.filter((version) => !atLeast(version, '1.20.0'))).toEqual([])
  })

  it('installs react-router and react-router-dom on one version, 7.18.2 or later', () => {
    const router = lockedVersions('react-router')
    const dom = lockedVersions('react-router-dom')
    expect(router).toHaveLength(1)
    expect(dom).toHaveLength(1)
    expect(dom).toEqual(router)
    expect(atLeast(router[0], '7.18.2')).toBe(true)
  })
})

function NavigateOnMount({ to }: { to: string }) {
  const navigate = useNavigate()
  useEffect(() => {
    navigate(to)
  }, [navigate, to])
  return null
}

describe('#419: navigate() keeps a backslash path on this site', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/')
  })

  // A slash and a backslash, a backslash and a slash, two backslashes: each
  // reads as `//evil.example` to the browser.
  it.each(['/\\evil.example/path', '\\/evil.example/path', '\\\\evil.example/path'])(
    'treats %s as a path here',
    async (to) => {
      const origin = window.location.origin
      window.history.replaceState(null, '', '/start')

      await act(async () => {
        render(
          <BrowserRouter>
            <NavigateOnMount to={to} />
          </BrowserRouter>,
        )
      })

      expect(window.location.origin).toBe(origin)
      expect(window.location.pathname).toBe('/evil.example/path')
    },
  )
})

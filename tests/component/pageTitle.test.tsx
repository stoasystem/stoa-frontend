import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppRoutes, nameKeyOf } from '@/app/router/AppRoutes'
import i18n from '@/i18n'
import { pageRoutes } from '@/app/router/routeManifest'
import { useAuthStore } from '@/store/authStore'

// #103 registered a name for every page. Nothing wrote it anywhere: two
// pages called Seo by hand and the rest left the tab saying whatever the
// last page said. A screen reader announces the document title on arrival,
// so it is the first thing a reader is told about where they are.

vi.mock('@/pages/entry/EntryPage', () => ({ EntryPage: () => <p>entry</p> }))

afterEach(() => {
  document.title = ''
  useAuthStore.setState({ user: null, isAuthenticated: false } as never)
})

function at(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  )
}

describe('what the browser tab says', () => {
  it('names the page, in the reader’s language', async () => {
    await i18n.changeLanguage('de')

    at('/login')

    await waitFor(() => expect(document.title).toContain(i18n.t('common:routes.login.title')))
    expect(document.title).toContain('STOA')
  })

  it('follows a change of language', async () => {
    await i18n.changeLanguage('de')
    at('/login')
    await waitFor(() => expect(document.title).toContain(i18n.t('common:routes.login.title')))

    await i18n.changeLanguage('fr')

    await waitFor(() => expect(document.title).toContain(i18n.t('common:routes.login.title')))
  })

  it('never shows a bare key when a translation is missing', async () => {
    at('/login')

    await waitFor(() => expect(document.title).not.toContain('routes.'))
  })

  it('has a name to show for every page in the manifest', () => {
    // The whole point of #103: no page is nameless. A few take their name
    // from their navigation entry rather than a `titleKey`, and the title
    // bar reads that one — otherwise those nine would be the only tabs still
    // saying whatever the last page said.
    const nameless = pageRoutes
      .filter((route) => !route.titleKey && !route.nav?.some((entry) => entry.labelKey))
      .map((route) => route.path)

    expect(nameless).toEqual([])
    // The nine that take theirs from navigation are read the same way; only
    // the public pages are rendered here, because the rest want a query
    // client and their own data to mount at all.
    expect(pageRoutes.filter((route) => !route.titleKey).length).toBeGreaterThan(0)
    expect(pageRoutes.filter((route) => !nameKeyOf(route)).map((route) => route.path)).toEqual([])
  })

})

describe('where a page’s name comes from', () => {
  it('prefers the page’s own title key', () => {
    const route = pageRoutes.find((entry) => entry.titleKey)!

    expect(nameKeyOf(route)).toBe(route.titleKey)
  })

  it('falls back to the navigation entry, so no tab is left nameless', () => {
    // Nine pages are named by their navigation and nothing else. Reading only
    // `titleKey` would leave exactly those tabs saying whatever the previous
    // page said, which is the gap #103 was about.
    const route = pageRoutes.find((entry) => !entry.titleKey && entry.nav?.some((nav) => nav.labelKey))

    expect(route, 'no page takes its name from navigation any more').toBeDefined()
    expect(nameKeyOf(route!)).toBe(route!.nav!.find((nav) => nav.labelKey)!.labelKey)
  })
})

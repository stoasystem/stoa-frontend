/**
 * The pages a reader lands on when a route refuses them, or does not exist,
 * were English on every language: a parent opening /admin in German got a
 * German tab title ("Kein Zugriff") over "Forbidden" and "Go home" (#162
 * production walkthrough, 12 Oct 2026). check:untranslated lists src/pages/error
 * but does not count plain JSX text, so it never saw them.
 */
import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { ForbiddenPage } from '@/pages/error/ForbiddenPage'
import { UnauthorizedPage } from '@/pages/error/UnauthorizedPage'
import { NotFoundPage } from '@/pages/not-found/NotFoundPage'

vi.mock('@/layouts/AppLayout', () => ({ AppLayout: ({ children }: { children: ReactNode }) => <>{children}</> }))
vi.mock('@/layouts/AuthLayout', () => ({ AuthLayout: ({ children }: { children: ReactNode }) => <>{children}</> }))
vi.mock('@/layouts/MarketingLayout', () => ({ MarketingLayout: ({ children }: { children: ReactNode }) => <>{children}</> }))

function show(page: ReactNode) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>{page}</MemoryRouter>
    </I18nextProvider>,
  )
}

afterEach(async () => {
  await i18n.changeLanguage('en')
})

describe('the error pages speak the reader’s language', () => {
  it.each([
    { language: 'de', forbidden: 'Kein Zugriff', unauthorized: 'Anmeldung nötig', notFound: 'Seite nicht gefunden', home: 'Zur Startseite' },
    { language: 'fr', forbidden: 'Accès refusé', unauthorized: 'Connexion requise', notFound: 'Page introuvable', home: 'Aller à l’accueil' },
    { language: 'it', forbidden: 'Accesso negato', unauthorized: 'Accesso richiesto', notFound: 'Pagina non trovata', home: 'Alla pagina iniziale' },
  ])('in $language', async ({ language, forbidden, unauthorized, notFound, home }) => {
    await i18n.changeLanguage(language)

    const one = show(<ForbiddenPage />)
    expect(screen.getByRole('heading', { name: forbidden })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: home })).toHaveAttribute('href', '/')
    one.unmount()

    const two = show(<UnauthorizedPage />)
    expect(screen.getByRole('heading', { name: unauthorized })).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/login')
    two.unmount()

    const { container } = show(<NotFoundPage />)
    expect(screen.getByRole('heading', { name: notFound })).toBeInTheDocument()
    for (const english of ['Forbidden', 'Unauthorized', 'Page not found', 'Go home', 'Return home', 'Go to login']) {
      expect(container.textContent, english).not.toContain(english)
    }
  })
})

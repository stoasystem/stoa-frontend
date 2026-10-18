/**
 * The account chooser and the sign-in-again page speak to staff the way
 * staff's own screens do (#241). The #239 walkthrough found both pages saying
 * "du" to teachers and administrators, whose admin.json and teacher.json say
 * "Sie", and the chooser asking "Wer lernt hier?" over a list of teachers.
 *
 * Rendered with the real bundles: the point is the sentence a reader sees.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import deAuth from '@/i18n/locales/de/auth.json'
import enAuth from '@/i18n/locales/en/auth.json'
import frAuth from '@/i18n/locales/fr/auth.json'
import itAuth from '@/i18n/locales/it/auth.json'
import { addressContext } from '@/lib/addressForm'
import { readTabSignOut, rememberTabAccount, signOutTab } from '@/lib/tabAccount'
import { LoginPage } from '@/pages/login/LoginPage'

const AUTH = { de: deAuth, en: enAuth, fr: frAuth, it: itAuth }
// Parents read "Sie" too, as parent.json does (#277).
const STAFF = ['admin', 'teacher', 'organization_admin', 'school_teacher', 'school_viewer', 'parent'] as const
const FAMILY = ['student'] as const

function renderReauth(role: string | undefined) {
  const account = { email: 'x@test.stoaedu.ch', name: 'Xe', ...(role ? { role } : {}) }
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <LoginPage mode={{ kind: 'reauth', reason: 'expired', account, onSignInOther: () => {} }} />
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

function renderChooser() {
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <LoginPage mode={{ kind: 'choose', onSignInOther: () => {} }} />
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

/** Every `<key>_formal` in a bundle, as dotted paths. */
function formalKeys(bundle: unknown, prefix = ''): string[] {
  return Object.entries(bundle as Record<string, unknown>).flatMap(([key, value]) =>
    typeof value === 'object' && value !== null
      ? formalKeys(value, `${prefix}${key}.`)
      : key.endsWith('_formal')
        ? [`${prefix}${key}`]
        : [],
  )
}

beforeEach(async () => {
  sessionStorage.clear()
  await i18n.changeLanguage('de')
})

describe('which roles are addressed formally', () => {
  it.each(STAFF)('%s is', (role) => {
    expect(addressContext(role)).toBe('formal')
  })

  it.each(FAMILY)('%s is informally', (role) => {
    expect(addressContext(role)).toBe('informal')
  })

  it.each([undefined, '', 'nobody_knows'])('%s is not known', (role) => {
    expect(addressContext(role)).toBeUndefined()
  })
})

describe('every formal line exists in all four languages', () => {
  // A formal line missing in one language falls back to that language's
  // informal one without a sound: the German teacher would read "du" again.
  it('has the same formal keys everywhere', () => {
    const expected = formalKeys(deAuth).sort()
    expect(expected.length).toBeGreaterThan(0)
    for (const bundle of Object.values(AUTH)) expect(formalKeys(bundle).sort()).toEqual(expected)
  })
})

describe('the sign-in-again page in German', () => {
  it.each(STAFF)('says Sie to a %s', (role) => {
    renderReauth(role)

    expect(screen.getByText('Bitte melden Sie sich erneut an, um fortzufahren.')).toBeInTheDocument()
    expect(screen.getByText('Passwort vergessen? Ihre STOA-Administration setzt es zurück.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'So erhalten Sie ein Konto' })).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/\b(du|dich|dein|deine)\b/i)
  })

  it.each([...FAMILY, undefined])('keeps du for a %s', (role) => {
    renderReauth(role)

    expect(screen.getByText('Bitte melde dich erneut an, um weiterzumachen.')).toBeInTheDocument()
    expect(screen.getByText('Passwort vergessen? Deine STOA-Administration setzt es zurück.')).toBeInTheDocument()
  })
})

describe('the sign-in-again page in the other languages', () => {
  it('says vous to a French teacher', async () => {
    await i18n.changeLanguage('fr')
    renderReauth('teacher')

    expect(screen.getByText('Veuillez vous reconnecter pour continuer.')).toBeInTheDocument()
    expect(screen.getByText(/Votre administrateur STOA/)).toBeInTheDocument()
  })

  it('stays informal for an Italian administrator', async () => {
    await i18n.changeLanguage('it')
    renderReauth('admin')

    expect(screen.getByText('Accedi di nuovo per continuare.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Come ottenere un account' })).toBeInTheDocument()
  })
})

describe('the account chooser', () => {
  it('asks who uses the tab, not who learns, without du', () => {
    renderChooser()

    expect(screen.getByRole('heading', { name: 'Wer nutzt diesen Tab?' })).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/\blernt\b/)
    expect(document.body.textContent).not.toMatch(/\b(du|dich|dein|deine|Wähle)\b/)
  })

  it.each(Object.entries(AUTH))('%s does not assume the reader is learning', (_lang, bundle) => {
    expect(bundle.chooser.title).not.toMatch(/lern|learn|apprend|impar|studi/i)
  })
})

describe('the tab keeps the role it needs to choose', () => {
  it('remembers the role through a session ending', () => {
    rememberTabAccount({ id: 't-id', email: 't@test.stoaedu.ch', name: 'Tia', role: 'teacher' } as never)
    signOutTab({ reason: 'expired' })

    expect(readTabSignOut()?.account?.role).toBe('teacher')
  })
})

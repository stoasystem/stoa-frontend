/**
 * Pages every role reaches speak to each reader the way that reader's own
 * screens do (#277). Staff and parents read "Sie" / "vous", students "du" /
 * "tu"; a page that does not know its reader keeps its own voice. The
 * 2026-10-18 audit found the password change saying "du" to German teachers,
 * /me and the error panel doing the same, the help page saying "Sie" to
 * students, and the sign-in page mixing both within one form.
 *
 * Rendered with the real bundles, in German and French, for a student, a
 * parent, a teacher and an administrator on every page: the point is the
 * sentence each of them reads.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { toast } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorState } from '@/components/common/ErrorState'
import i18n from '@/i18n'
import { addressContext } from '@/lib/addressForm'
import { ChangePasswordPage } from '@/pages/auth/ChangePasswordPage'
import { LoginPage } from '@/pages/login/LoginPage'
import { MePage } from '@/pages/me/MePage'
import { SupportPage } from '@/pages/support/SupportPage'
import { ApiError } from '@/services/api/httpClient'
import { login, requestPasswordChange } from '@/services/auth/authApi'
import { type CurrentUser, useAuthStore } from '@/store/authStore'

// The shells around the pages are not what is under test, and they fetch.
vi.mock('@/layouts/DashboardLayout', () => ({ DashboardLayout: ({ children }: { children: ReactNode }) => children }))
vi.mock('@/layouts/AppLayout', () => ({ AppLayout: ({ children }: { children: ReactNode }) => children }))
vi.mock('@/layouts/MarketingLayout', () => ({ MarketingLayout: ({ children }: { children: ReactNode }) => children }))
vi.mock('@/features/account/GradeGroup', () => ({ GradeGroup: () => null }))
vi.mock('@/features/account/NotificationPreferencesGroup', () => ({ NotificationPreferencesGroup: () => null }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))
vi.mock('@/services/auth/authApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/auth/authApi')>()),
  login: vi.fn(),
  requestPasswordChange: vi.fn(),
  confirmPasswordChange: vi.fn(),
}))

const ROLES = ['student', 'parent', 'teacher', 'admin'] as const
type Role = (typeof ROLES)[number]
type Lang = 'de' | 'fr'
type Form = 'formal' | 'informal'
const formOf = (role: Role): Form => (role === 'student' ? 'informal' : 'formal')

// The words that give a form away. Letters on either side do not count, so
// the French "te" inside "êtes" is not "te".
const MARKERS: Record<Lang, Record<Form, RegExp>> = {
  de: {
    informal: /(?<!\p{L})(du|dich|dir|dein|deine|deinen|deinem|deiner|deines)(?!\p{L})/iu,
    // "Sie" also means "they" and starts sentences; these pages never use it so.
    formal: /(?<!\p{L})(Sie|Ihnen|Ihr|Ihre|Ihren|Ihrem|Ihrer|Ihres)(?!\p{L})/u,
  },
  fr: {
    informal: /(?<!\p{L})(tu|toi|ton|ta|tes|te)(?!\p{L})|(?<!\p{L})t[’'](?=\p{L})/iu,
    formal: /(?<!\p{L})(vous|votre|vos|veuillez)(?!\p{L})/iu,
  },
}
const other = (form: Form): Form => (form === 'formal' ? 'informal' : 'formal')

/** The page's text holds the reader's form and none of the other. */
function expectOnlyForm(lang: Lang, form: Form, text = document.body.textContent ?? '') {
  expect(text).toMatch(MARKERS[lang][form])
  expect(text).not.toMatch(MARKERS[lang][other(form)])
}

function signIn(role: Role, extra: Partial<CurrentUser> = {}) {
  useAuthStore.setState({
    user: { id: `${role}-1`, name: 'Ada', email: 'ada@test.stoaedu.ch', role, ...extra } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
}

function renderPage(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter>{node}</MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

/** What each reader is expected to read, line by line. */
const LINES = {
  changePasswordBody: {
    de: {
      informal: 'Gib dein aktuelles Passwort ein. Anschliessend senden wir einen sechsstelligen Code an die E-Mail-Adresse deines Kontos.',
      formal: 'Geben Sie Ihr aktuelles Passwort ein. Anschliessend senden wir einen sechsstelligen Code an die E-Mail-Adresse Ihres Kontos.',
    },
    fr: {
      informal: 'Saisis ton mot de passe actuel. Nous envoyons ensuite un code à six chiffres à l’adresse de ton compte.',
      formal: 'Saisissez votre mot de passe actuel. Nous envoyons ensuite un code à six chiffres à l’adresse de votre compte.',
    },
  },
  wrongCurrentPassword: {
    de: {
      informal: 'Das aktuelle Passwort stimmt nicht. Bitte prüf es und versuch es erneut.',
      formal: 'Das aktuelle Passwort stimmt nicht. Bitte prüfen Sie es und versuchen Sie es erneut.',
    },
    fr: {
      informal: 'Ce mot de passe actuel n’est pas correct. Vérifie-le et réessaie.',
      formal: 'Ce mot de passe actuel n’est pas correct. Vérifiez-le et réessayez.',
    },
  },
  meTitle: {
    de: { informal: 'Dein Konto', formal: 'Ihr Konto' },
    fr: { informal: 'Ton compte', formal: 'Votre compte' },
  },
  managed: {
    de: {
      informal: 'Name und E-Mail-Adresse gehören zu deinem Konto. Für eine Änderung wende dich an eine Administratorin oder einen Administrator.',
      formal: 'Name und E-Mail-Adresse gehören zu Ihrem Konto. Für eine Änderung wenden Sie sich an eine Administratorin oder einen Administrator.',
    },
    fr: {
      informal: 'Ton nom et ton adresse e-mail sont liés à ton compte. Pour les modifier, adresse-toi à un administrateur.',
      formal: 'Votre nom et votre adresse e-mail sont liés à votre compte. Pour les modifier, adressez-vous à un administrateur.',
    },
  },
  notYourFault: {
    de: { informal: 'Das liegt nicht an dir.', formal: 'Das liegt nicht an Ihnen.' },
    fr: { informal: "Ce n'est pas de ta faute.", formal: 'Ce n’est pas de votre faute.' },
  },
  reauthSubtitle: {
    de: { informal: 'Bitte melde dich erneut an, um weiterzumachen.', formal: 'Bitte melden Sie sich erneut an, um fortzufahren.' },
    fr: { informal: 'Reconnecte-toi pour continuer.', formal: 'Veuillez vous reconnecter pour continuer.' },
  },
  invalidEmail: {
    de: { informal: 'Gib eine gültige E-Mail-Adresse ein.', formal: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' },
    fr: { informal: 'Saisis une adresse e-mail valide.', formal: 'Veuillez saisir une adresse e-mail valide.' },
  },
  verifyFirst: {
    de: { informal: 'Bestätige deine E-Mail-Adresse, bevor du dich anmeldest', formal: 'Bestätigen Sie Ihre E-Mail-Adresse, bevor Sie sich anmelden' },
    fr: { informal: 'Confirme ton adresse e-mail avant de te connecter', formal: 'Confirmez votre adresse e-mail avant de vous connecter' },
  },
  supportRequest: {
    de: {
      informal: 'Schreib uns bei Zugangsproblemen, Fehlern, Fragen zu einem Bericht oder wenn du bei etwas unsicher bist.',
      formal: 'Schreiben Sie uns bei Zugangsproblemen, Fehlern, Fragen zu einem Bericht oder wenn Sie bei etwas unsicher sind.',
    },
    fr: {
      informal: 'Écris-nous en cas de problème d’accès, d’erreur, de question sur un rapport ou de doute quelconque.',
      formal: 'Écrivez-nous en cas de problème d’accès, d’erreur, de question sur un rapport ou de doute quelconque.',
    },
  },
} satisfies Record<string, Record<Lang, Record<Form, string>>>

const CASES = (['de', 'fr'] as const).flatMap((lang) => ROLES.map((role) => [lang, role, formOf(role)] as const))

beforeEach(() => {
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
  vi.mocked(toast.error).mockClear()
})

afterEach(async () => {
  await i18n.changeLanguage('de')
})

describe('who is addressed how', () => {
  it.each([
    ['student', 'informal'],
    ['students', 'informal'],
    ['parent', 'formal'],
    ['teacher', 'formal'],
    ['admin', 'formal'],
    ['organization_admin', 'formal'],
  ])('a %s is %s', (role, form) => {
    expect(addressContext(role)).toBe(form)
  })

  it.each([undefined, '', 'nobody_knows'])('an unknown reader (%s) keeps the page’s own voice', (role) => {
    expect(addressContext(role)).toBeUndefined()
  })
})

describe('the password change', () => {
  it.each(CASES)('%s: a forced change speaks to a %s %s', async (lang, role, form) => {
    await i18n.changeLanguage(lang)
    signIn(role, { mustChangePassword: true })
    renderPage(<ChangePasswordPage />)

    expect(screen.getByText(LINES.changePasswordBody[lang][form])).toBeInTheDocument()
    expectOnlyForm(lang, form)
  })

  it.each(CASES)('%s: a refused current password is told to a %s %s', async (lang, role, form) => {
    await i18n.changeLanguage(lang)
    vi.mocked(requestPasswordChange).mockRejectedValueOnce(
      new ApiError('Incorrect username or password.', { status: 400, code: 'password_change_credentials_invalid' }),
    )
    signIn(role)
    renderPage(<ChangePasswordPage />)

    await userEvent.type(screen.getByLabelText(i18n.t('auth:changePassword.currentPasswordLabel')), 'not-it')
    await userEvent.click(screen.getByRole('button', { name: i18n.t('auth:changePassword.sendCodeCta') }))

    expect(await screen.findByText(LINES.wrongCurrentPassword[lang][form])).toBeInTheDocument()
    expectOnlyForm(lang, form)
  })
})

describe('/me', () => {
  it.each(CASES)('%s: speaks to a %s %s', async (lang, role, form) => {
    await i18n.changeLanguage(lang)
    signIn(role)
    renderPage(<MePage />)

    expect(screen.getByRole('heading', { level: 1, name: LINES.meTitle[lang][form] })).toBeInTheDocument()
    expect(screen.getByText(LINES.managed[lang][form])).toBeInTheDocument()
    expect(screen.getByText(LINES.changePasswordBody[lang][form])).toBeInTheDocument()
    expectOnlyForm(lang, form)
  })
})

describe('the error panel', () => {
  it.each(CASES)('%s: reassures a %s %s', async (lang, role, form) => {
    await i18n.changeLanguage(lang)
    signIn(role)
    renderPage(<ErrorState message="—" />)

    expect(screen.getByText(LINES.notYourFault[lang][form])).toBeInTheDocument()
    expectOnlyForm(lang, form)
  })
})

describe('the sign-in page', () => {
  function renderReauth(role: Role) {
    const account = { email: 'ada@test.stoaedu.ch', name: 'Ada', role }
    renderPage(<LoginPage mode={{ kind: 'reauth', reason: 'expired', account, onSignInOther: () => {} }} />)
  }

  it.each(CASES)('%s: asks a %s %s to sign in again, and checks the address the same way', async (lang, role, form) => {
    await i18n.changeLanguage(lang)
    renderReauth(role)

    expect(screen.getByText(LINES.reauthSubtitle[lang][form])).toBeInTheDocument()
    const email = screen.getByLabelText(i18n.t('auth:register.email'))
    await userEvent.clear(email)
    await userEvent.type(email, 'not-an-address')
    await userEvent.click(screen.getByRole('button', { name: i18n.t('common:actions.signIn') }))

    expect(await screen.findByText(LINES.invalidEmail[lang][form])).toBeInTheDocument()
    expectOnlyForm(lang, form, screen.getByRole('main').textContent ?? '')
  })

  it.each(CASES)('%s: tells a %s %s to verify the address first', async (lang, role, form) => {
    await i18n.changeLanguage(lang)
    vi.mocked(login).mockRejectedValueOnce(
      new ApiError('Email not verified', { status: 403, code: 'email_verification_required' }),
    )
    renderReauth(role)

    await userEvent.type(screen.getByLabelText(i18n.t('auth:register.password')), 'secret')
    await userEvent.click(screen.getByRole('button', { name: i18n.t('common:actions.signIn') }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(LINES.verifyFirst[lang][form]))
  })

  // Nobody is known on the plain sign-in page: it keeps one voice, German
  // "du" and French "vous", down to its own validation and status lines.
  it.each([
    ['de', 'informal'],
    ['fr', 'formal'],
  ] as const)('%s: speaks one form to an unknown reader (%s)', async (lang, form) => {
    await i18n.changeLanguage(lang)
    vi.mocked(login).mockRejectedValueOnce(
      new ApiError('Email not verified', { status: 403, code: 'email_verification_required' }),
    )
    renderPage(<LoginPage />)

    await userEvent.click(screen.getByRole('button', { name: i18n.t('common:actions.signIn') }))
    expect(await screen.findByText(LINES.invalidEmail[lang][form])).toBeInTheDocument()
    expectOnlyForm(lang, form, screen.getByRole('main').textContent ?? '')

    for (const key of ['login.signingInStatus', 'login.verifyFirst', 'login.invalidCredentials', 'login.forgotPassword']) {
      expect(i18n.t(`auth:${key}`)).not.toMatch(MARKERS[lang][other(form)])
    }
  })
})

describe('the help page', () => {
  it.each(CASES)('%s: speaks to a signed-in %s %s', async (lang, role, form) => {
    await i18n.changeLanguage(lang)
    signIn(role)
    renderPage(<SupportPage />)

    expect(screen.getByText(LINES.supportRequest[lang][form])).toBeInTheDocument()
    expectOnlyForm(lang, form)
  })

  it.each(['de', 'fr'] as const)('%s: keeps its own formal voice for a visitor', async (lang) => {
    await i18n.changeLanguage(lang)
    renderPage(<SupportPage />)

    expect(screen.getByText(LINES.supportRequest[lang].formal)).toBeInTheDocument()
    expectOnlyForm(lang, 'formal')
  })
})

describe('the bundles behind these pages', () => {
  const NAMESPACES = ['auth', 'common', 'support'] as const
  const bundle = (lang: string, ns: string) => i18n.getResourceBundle(lang, ns) as Record<string, unknown>

  /** Every leaf (array items included) as [dotted path, text]. */
  function leaves(value: unknown, prefix = ''): [string, string][] {
    if (typeof value === 'string') return [[prefix, value]]
    if (Array.isArray(value)) return value.flatMap((item, index) => leaves(item, `${prefix}.${index}`))
    if (value && typeof value === 'object')
      return Object.entries(value).flatMap(([key, item]) => leaves(item, prefix ? `${prefix}.${key}` : key))
    return []
  }
  const contextKeys = (lang: string, ns: string) =>
    leaves(bundle(lang, ns))
      .map(([path]) => path.replace(/\.\d+$/, ''))
      .filter((path) => /_(formal|informal)$/.test(path))

  // A context line missing in one language falls back to that language's
  // plain one without a sound.
  it.each(NAMESPACES)('%s has the same context lines in all four languages', (ns) => {
    const expected = [...new Set(contextKeys('de', ns))].sort()
    for (const lang of ['en', 'fr', 'it']) expect([...new Set(contextKeys(lang, ns))].sort()).toEqual(expected)
  })

  // Within each group a page draws from, each variant holds one form only:
  // the plain lines of signed-in pages are the student's, the help page's
  // the visitor's (formal), the sign-in page's German "du" and French "vous".
  const GROUPS: { ns: string; prefix: string; plain: Record<Lang, Form> }[] = [
    { ns: 'auth', prefix: 'changePassword.', plain: { de: 'informal', fr: 'informal' } },
    { ns: 'auth', prefix: 'login.', plain: { de: 'informal', fr: 'formal' } },
    { ns: 'auth', prefix: 'reauth.subtitle', plain: { de: 'informal', fr: 'formal' } },
    { ns: 'common', prefix: 'me.profile.', plain: { de: 'informal', fr: 'informal' } },
    { ns: 'common', prefix: 'studentRoutes.me.title', plain: { de: 'informal', fr: 'informal' } },
    { ns: 'common', prefix: 'state.notYourFault', plain: { de: 'informal', fr: 'informal' } },
    { ns: 'support', prefix: 'description', plain: { de: 'formal', fr: 'formal' } },
    { ns: 'support', prefix: 'sections.', plain: { de: 'formal', fr: 'formal' } },
    { ns: 'support', prefix: 'contactCard.', plain: { de: 'formal', fr: 'formal' } },
  ]

  it.each(GROUPS.flatMap((group) => (['de', 'fr'] as const).map((lang) => [lang, `${group.ns}:${group.prefix}`, group] as const)))(
    '%s %s does not mix forms',
    (lang, _name, { ns, prefix, plain }) => {
      const mixed = leaves(bundle(lang, ns))
        .filter(([path]) => path.startsWith(prefix))
        .filter(([path, text]) => {
          const key = path.replace(/\.\d+$/, '')
          const form: Form = key.endsWith('_formal') ? 'formal' : key.endsWith('_informal') ? 'informal' : plain[lang]
          return MARKERS[lang][other(form)].test(text)
        })
      expect(mixed).toEqual([])
    },
  )
})

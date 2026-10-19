/**
 * No namespace mixes the two address forms outside the places that speak to a
 * different reader on purpose (#315).
 *
 * The rule (map #282): students read du / tu, parents and staff Sie / vous,
 * and Italian is informal for everyone. `sharedAddressForms277.test.tsx`
 * checks the groups the shared pages draw from; this checks every line of
 * every namespace, in German and French, against the voice declared for it
 * below, and every Italian line for the formal Lei.
 *
 * A line's voice, most specific first:
 * 1. a `_formal` / `_informal` context on its key (`src/lib/addressForm.ts`);
 * 2. a role under a `…ByRole` group (`subtitleByRole.parent` is formal);
 * 3. the longest key prefix declared in GROUPS below;
 * 4. the namespace's own voice.
 * A line in the other form fails, and so does a GROUPS prefix no key has
 * (a deleted group must not leave its exemption behind).
 */
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { EmailVerificationPanel } from '@/components/auth/EmailVerificationPanel'
import i18n from '@/i18n'
import { addressContext } from '@/lib/addressForm'

type Lang = 'de' | 'fr'
type Form = 'formal' | 'informal'
/** A voice the same in both languages, or one per language. */
type Voice = Form | Record<Lang, Form>

const LOCALES_DIR = path.resolve(__dirname, '../../src/i18n/locales')

// The words that give a form away, as in sharedAddressForms277.test.tsx.
// Letters on either side do not count, so the French "te" in "êtes" is not
// "te", and "Sie" is case-sensitive.
const MARKERS: Record<Lang, Record<Form, RegExp>> = {
  de: {
    informal: /(?<!\p{L})(du|dich|dir|dein|deine|deinen|deinem|deiner|deines)(?!\p{L})/iu,
    formal: /(?<!\p{L})(Sie|Ihnen|Ihr|Ihre|Ihren|Ihrem|Ihrer|Ihres)(?!\p{L})/u,
  },
  fr: {
    informal: /(?<!\p{L})(tu|toi|ton|ta|tes|te)(?!\p{L})|(?<!\p{L})t[’'](?=\p{L})/iu,
    formal: /(?<!\p{L})(vous|votre|vos|veuillez)(?!\p{L})/iu,
  },
}
// Italian formal address: Lei and its capitalised possessives. "voi" is the
// informal plural (auth:register.closed.studentParent speaks to students and
// parents together), so it is not flagged.
const ITALIAN_FORMAL = /(?<!\p{L})(Lei|La sua|Le sue|Suo|Sua|Suoi|Sue)(?!\p{L})/u

/** Who each namespace speaks to when nothing more specific says otherwise. */
const NAMESPACE_VOICE: Record<string, Voice | 'frozen'> = {
  // The student's screens.
  practice: 'informal',
  chat: 'informal',
  uploads: 'informal',
  starmap: 'informal',
  chapter: 'informal',
  // Each role's own namespace.
  parent: 'formal',
  teacher: 'formal',
  admin: 'formal',
  // Shared: the plain lines of signed-in shared pages are the student's
  // (#277); `_formal` covers everyone else.
  common: 'informal',
  // The sign-in page, for a reader it does not know yet: German "du", French
  // "vous" (#277).
  auth: { de: 'informal', fr: 'formal' },
  // The help page and the legal texts speak formally to a visitor.
  support: 'formal',
  legal: 'formal',
  // Field errors reach every role; they say what is wrong without
  // addressing anyone, except where GROUPS names the reader.
  errors: 'informal',
  // Frozen by Card 007 with every billing page (#257 is the unfreeze
  // checklist, which re-checks their copy).
  billing: 'frozen',
}

/** Key groups whose reader is not the namespace's. */
const GROUPS: Record<string, Record<string, Voice>> = {
  auth: {
    // The closed registration page and the role picker speak to adults.
    'register.': 'formal',
    'register.student': 'informal',
    'register.stepHeadings.student.': 'informal',
    // Only invited teachers activate an account.
    'activate.': 'formal',
    // Signed-in page: the plain lines are the student's, `_formal` the rest.
    'changePassword.': 'informal',
  },
  common: {
    'organizationHome.': 'formal',
    // Public activation pages: the sign-in page's own voice.
    'routes.activate.title': { de: 'informal', fr: 'formal' },
    'routes.teacherActivate.title': 'formal',
  },
  support: {
    // The public getting-started guide's student section speaks to students
    // (#341); the rest of the guide stays formal for parents and teachers.
    'onboarding.roles.student.': 'informal',
  },
  errors: {
    // Only teachers pick the subjects they teach (#270).
    subjectRequired: 'formal',
  },
}

const CONTEXT = /_(formal|informal)$/

function leaves(value: unknown, prefix = ''): [string, string][] {
  if (typeof value === 'string') return [[prefix, value]]
  if (Array.isArray(value)) return value.flatMap((item, index) => leaves(item, `${prefix}.${index}`))
  if (value && typeof value === 'object')
    return Object.entries(value).flatMap(([key, item]) => leaves(item, prefix ? `${prefix}.${key}` : key))
  return []
}

const formIn = (voice: Voice, lang: Lang): Form => (typeof voice === 'string' ? voice : voice[lang])
const other = (form: Form): Form => (form === 'formal' ? 'informal' : 'formal')

/** The voice a line at `key` should speak in. */
function voiceOf(ns: string, key: string, lang: Lang): Form {
  const segments = key.split('.')
  for (const segment of [...segments].reverse()) {
    const context = CONTEXT.exec(segment)
    if (context) return context[1] as Form
  }
  const last = segments.length - 1
  if (last > 0 && segments[last - 1].endsWith('ByRole')) {
    const byRole = addressContext(segments[last])
    if (byRole) return byRole
  }
  const group = Object.keys(GROUPS[ns] ?? {})
    .filter((prefix) => key.startsWith(prefix))
    .sort((a, b) => b.length - a.length)[0]
  if (group) return formIn(GROUPS[ns][group], lang)
  return formIn(NAMESPACE_VOICE[ns] as Voice, lang)
}

/** Lines in the form their voice does not use, as "key: text". */
function mixedLines(ns: string, lang: Lang, bundle: unknown): string[] {
  return leaves(bundle)
    .filter(([key, text]) => MARKERS[lang][other(voiceOf(ns, key, lang))].test(text))
    .map(([key, text]) => `${key}: ${text}`)
}

const NAMESPACES = readdirSync(path.join(LOCALES_DIR, 'en'))
  .filter((name) => name.endsWith('.json'))
  .map((name) => name.replace(/\.json$/, ''))
const bundleOf = (lang: string, ns: string): unknown =>
  JSON.parse(readFileSync(path.join(LOCALES_DIR, lang, `${ns}.json`), 'utf8'))
const CHECKED = NAMESPACES.filter((ns) => NAMESPACE_VOICE[ns] !== 'frozen')

describe('the rule itself', () => {
  it('takes a context first, then a role, then the longest group, then the namespace', () => {
    expect(voiceOf('common', 'me.profile.managed_formal', 'de')).toBe('formal')
    expect(voiceOf('support', 'sections.problems.items_informal.0', 'de')).toBe('informal')
    expect(voiceOf('common', 'notifications.subtitleByRole.parent', 'fr')).toBe('formal')
    expect(voiceOf('common', 'notifications.subtitleByRole.student', 'fr')).toBe('informal')
    expect(voiceOf('auth', 'register.stepHeadings.student.title', 'de')).toBe('informal')
    expect(voiceOf('auth', 'register.stepHeadings.parent.title', 'de')).toBe('formal')
    expect(voiceOf('auth', 'login.subtitle', 'de')).toBe('informal')
    expect(voiceOf('auth', 'login.subtitle', 'fr')).toBe('formal')
    expect(voiceOf('support', 'onboarding.roles.student.steps.0.description', 'fr')).toBe('informal')
    expect(voiceOf('support', 'onboarding.roles.parent.steps.0.description', 'fr')).toBe('formal')
  })

  it('flags a line in the other form, and only that', () => {
    expect(mixedLines('practice', 'de', { a: 'Prüf deine Antwort.', b: 'Prüfen Sie Ihre Antwort.', c: 'Antwort prüfen' })).toEqual([
      'b: Prüfen Sie Ihre Antwort.',
    ])
    expect(mixedLines('parent', 'fr', { a: 'Vérifiez votre réponse.', b: 'Vérifie ta réponse.', c: 'Vous êtes' })).toEqual([
      'b: Vérifie ta réponse.',
    ])
    expect(mixedLines('practice', 'de', { hint_formal: 'Prüfen Sie Ihre Antwort.' })).toEqual([])
  })
})

describe('every namespace speaks one form outside its declared groups', () => {
  it('declares a voice for every namespace', () => {
    expect(NAMESPACES.filter((ns) => !(ns in NAMESPACE_VOICE))).toEqual([])
    expect(Object.keys(NAMESPACE_VOICE).filter((ns) => !NAMESPACES.includes(ns))).toEqual([])
  })

  for (const lang of ['de', 'fr'] as const) {
    for (const ns of CHECKED) {
      it(`${lang}/${ns} does not mix du and Sie, tu and vous`, () => {
        expect(mixedLines(ns, lang, bundleOf(lang, ns))).toEqual([])
      })
    }
  }

  it.each(Object.entries(GROUPS).flatMap(([ns, groups]) => Object.keys(groups).map((prefix) => [ns, prefix] as const)))(
    'the %s group %s still names some key',
    (ns, prefix) => {
      expect(leaves(bundleOf('de', ns)).some(([key]) => key.startsWith(prefix))).toBe(true)
    },
  )

  it.each(NAMESPACES)('it/%s is informal throughout', (ns) => {
    const formal = leaves(bundleOf('it', ns))
      .filter(([, text]) => ITALIAN_FORMAL.test(text))
      .map(([key, text]) => `${key}: ${text}`)
    expect(formal).toEqual([])
  })
})

// The 2026-10-19 scan found the German verification card saying "Sie" inside
// the sign-in form, whose German says "du"; it now speaks the form's voice.
describe('the email verification card on the sign-in page', () => {
  afterEach(async () => {
    await i18n.changeLanguage('de')
  })

  it.each([
    ['de', 'informal'],
    ['fr', 'formal'],
  ] as const)('%s: speaks the sign-in page’s voice (%s)', async (lang, form) => {
    await i18n.changeLanguage(lang)
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={client}>
          <MemoryRouter>
            <EmailVerificationPanel email="ada@test.stoaedu.ch" source="login" surface="sky" />
          </MemoryRouter>
        </QueryClientProvider>
      </I18nextProvider>,
    )

    expect(screen.getByText(i18n.t('auth:verification.loginBody', { email: 'ada@test.stoaedu.ch' }))).toBeInTheDocument()
    // German "du" here is all imperatives ("Gib den Code ein"), which carry no
    // pronoun to look for; the other form's words must simply be absent.
    expect(container.textContent).not.toMatch(MARKERS[lang][other(form)])
  })
})

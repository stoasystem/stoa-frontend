/**
 * Review is a dark surface (#125, lane A2): "the whole look of the review
 * screen does not go with our theme". A star on the map says "review N"; the
 * map, the chapter, the practice stage and Ask are all the night sky, and
 * following that star landed on white cards on light grey.
 *
 * Two things are held here, as `askSkySurface.test.tsx` holds them for Ask.
 * The page really does carry the sky, through `data-surface="sky"` and
 * `data-review-surface`, which select the one token remap in brand-tokens.css
 * rather than each class being rewritten; and darkening it did not cost
 * contrast. `check:contrast` rates the remap as its own theme, "review"; the
 * arithmetic here also covers what it cannot see -- a tint on a glass card, a
 * placeholder in a field over that card, the feedback panel's own fill -- and
 * ties each reading to the class the screen actually carries, so a reading
 * cannot stay green for a token nothing uses.
 *
 *   text        4.5:1
 *   a control   3:1 (WCAG 1.4.11)
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { render, screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { Suspense } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { AppRoutes } from '@/app/router/AppRoutes'
import i18n from '@/i18n'
import enChapter from '@/i18n/locales/en/chapter.json'
import enPractice from '@/i18n/locales/en/practice.json'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import { mswServer } from '../mswServer'

// ---- the tokens, read where they are declared --------------------------

type RGBA = [number, number, number, number]

const css = readFileSync(path.resolve(__dirname, '../../src/styles/brand-tokens.css'), 'utf8')
const SKY_RULE = '[data-surface="sky"] {'
const ASK_RULE = '[data-surface="sky"][data-ask-surface] {'
const REVIEW_RULE = '[data-surface="sky"][data-review-surface] {'
/** The sky's own tokens, which the review block leaves alone. */
const skyBlock = css.slice(css.indexOf(SKY_RULE), css.indexOf(ASK_RULE))
/** The remap, as brand-tokens.css declares it: light name -> its value. */
const reviewBlock = css.slice(css.indexOf(REVIEW_RULE), css.indexOf('}', css.indexOf(REVIEW_RULE)))
const REVIEW_REMAP: Record<string, string> = Object.fromEntries(
  [...reviewBlock.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)].map((m) => [
    m[1],
    m[2].trim(),
  ]),
)
/** The light families, which neither block touches. */
const rootBlock = css.slice(css.indexOf(':root {'), css.indexOf(SKY_RULE))

function token(name: string, block = skyBlock): RGBA {
  const match = new RegExp(`${name}:\\s*([^;]+);`).exec(block)
  if (!match) throw new Error(`no ${name} declared`)
  const value = match[1].trim()
  if (value.startsWith('#')) {
    return [parseInt(value.slice(1, 3), 16), parseInt(value.slice(3, 5), 16), parseInt(value.slice(5, 7), 16), 1]
  }
  const parts = value.match(/[\d.]+/g)!.map(Number)
  return [parts[0], parts[1], parts[2], parts[3] ?? 1]
}

/** What one remapped light token resolves to, through the sky name it points at. */
function remapped(name: string): RGBA {
  const value = REVIEW_REMAP[name]
  if (!value) throw new Error(`${name} is not remapped for review`)
  const target = /^var\((--[a-z0-9-]+)\)$/.exec(value)
  if (!target) throw new Error(`${name} is not a plain token reference`)
  return token(target[1])
}

/** `fg` at its own alpha times `alpha`, over an opaque `bg`. */
function over(fg: RGBA, bg: RGBA, alpha = 1): RGBA {
  const a = fg[3] * alpha
  return [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a), 1]
}

function luminance([r, g, b]: RGBA): number {
  const lin = (c: number) => {
    const v = c / 255
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function contrast(a: RGBA, b: RGBA): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * Read inside each test, not at import: a remap written as a colour must fail
 * the test that says so, with its own message, rather than taking the whole
 * file down on load.
 */
const ground = () => remapped('--ground')
/** A question's card: --surface is glass, so it is composited onto the page. */
const card = () => over(remapped('--surface'), ground())
/** The feedback panel on that card: --fill is white 10%. */
const panel = () => over(remapped('--fill'), card())
/** The answer field: `bg-card/75` takes --surface to three quarters of its alpha. */
const field = () => over(remapped('--surface'), card(), 0.75)

// ---- the page on screen ------------------------------------------------

const DUE = {
  items: [
    {
      challengeId: 'brueche-l1-c1',
      lessonId: 'brueche-l1',
      subjectId: 'mathematics',
      topicId: 'brueche',
      prompt: 'Was ist 1/2 + 1/4?',
      options: ['3/4', '2/6', '1/6'],
      type: 'multiple_choice',
      dueAt: '2026-10-11T09:00:00+00:00',
      lapses: 4,
      reps: 2,
    },
    {
      challengeId: 'brueche-l1-c2',
      lessonId: 'brueche-l1',
      subjectId: 'mathematics',
      topicId: 'brueche',
      prompt: 'Fülle die Lücke: 2/4 = 1/_',
      options: [],
      type: 'fill_blank',
      dueAt: '2026-10-11T09:00:00+00:00',
      lapses: 0,
      reps: 1,
    },
  ],
  dueCount: 2,
  generatedAt: '2026-10-11T10:00:00+00:00',
}

beforeAll(async () => {
  mswServer.listen({ onUnhandledRequest: 'bypass' })
  // A lazy page: load it before the first findBy, as the /me tests do (#94).
  await import('@/pages/review/ReviewPage')
})

beforeEach(async () => {
  await i18n.changeLanguage('en')
  mswServer.use(
    http.get('https://api.test/practice/review/due', () => HttpResponse.json(DUE)),
    http.get('https://api.test/notifications', () => HttpResponse.json({ items: [], count: 0 })),
  )
  useAuthStore.setState({
    user: { id: 'u-1', name: 'Lina Meier', email: 'lina@example.com', role: 'student' } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
})

afterEach(() => {
  mswServer.resetHandlers()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})

afterAll(() => mswServer.close())

/**
 * The real page, with questions on it. `GET /practice/review/due` is what puts
 * the cards, the options and the badge there, so nothing is asserted until a
 * question is on screen -- an assertion made while the query is still in
 * flight would pass against an empty page.
 */
async function openReview() {
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={['/review/brueche-u1']}>
          <Suspense fallback={null}>
            <AppRoutes />
          </Suspense>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
  const prompt = await screen.findByText(DUE.items[0].prompt)
  const surface = prompt.closest('[data-review-surface]')
  if (!surface) throw new Error('the question is not inside the review surface')
  return { prompt, surface: surface as HTMLElement }
}

describe('the review is the sky, not a white page', () => {
  it('carries the sky surface and the remap, with the questions on it', async () => {
    const { surface } = await openReview()

    expect(surface).toHaveAttribute('data-surface', 'sky')
    expect(surface).toHaveAttribute('data-review-surface')
    // The shell paints the page area dark behind it, as it does for the map.
    expect(document.querySelector('main')).toHaveAttribute('data-surface', 'sky')
    expect(REVIEW_REMAP['--ink']).toBe('var(--on-sky-text)')
    expect(REVIEW_REMAP['--surface']).toBe('var(--sky-glass)')
    expect(REVIEW_REMAP['--accent']).toBe('var(--accent-on-sky)')
    // The rule that tells an option or a field from the sky, not a divider:
    // the one value this remap does not take from Ask's.
    expect(REVIEW_REMAP['--separator']).toBe('var(--on-sky-field-rule)')
    // The remap lives in the token file only, where the contrast gate reads it.
    expect(surface.style.getPropertyValue('--ink')).toBe('')
    expect(surface.getAttribute('style')).toBeNull()
    // The negative: the page area is no longer the light ground.
    expect(document.querySelector('main')?.className).not.toContain('bg-ground')
    expect(await screen.findByRole('heading', { name: enPractice.review.title })).toBeInTheDocument()
  })

  it('names only tokens: no colour is written into the remap, but the pressed accent the gate must read', () => {
    for (const [name, value] of Object.entries(REVIEW_REMAP)) {
      if (name === '--accent-pressed') continue
      expect(value, `${name} must not hold a literal colour`).not.toMatch(
        /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(|\b(?:white|black|red|green|blue|grey|gray)\b/i,
      )
      expect(value, `${name} must resolve through a token`).toMatch(/var\(--/)
    }
  })

  it('cannot resolve in a circle: no remapped name is used as a target', () => {
    const keys = new Set(Object.keys(REVIEW_REMAP))
    for (const [name, value] of Object.entries(REVIEW_REMAP)) {
      for (const referenced of value.match(/--[a-z0-9-]+/g) ?? []) {
        expect(keys.has(referenced), `${name} points at ${referenced}, which this remap also redefines`).toBe(false)
      }
    }
  })

  it('leaves Ask’s own remap alone: the two surfaces are separate rules', () => {
    expect(css.indexOf(ASK_RULE)).toBeGreaterThan(-1)
    expect(css.indexOf(REVIEW_RULE)).toBeGreaterThan(css.indexOf(ASK_RULE))
    expect(reviewBlock).not.toContain('data-ask-surface')
  })
})

describe('what the screen carries is what is rated', () => {
  it('the lapse badge is the accent on its own tint, not an alpha the gate cannot read', async () => {
    const { surface } = await openReview()
    const badge = within(surface).getByText(enPractice.review.missed_other.replace('{{count}}', '4'))

    expect(badge.className).toContain('bg-accent-tint')
    expect(badge.className).toContain('text-primary')
    expect(badge.className).not.toMatch(/bg-primary\/\d/)
  })

  // #181: the cards are the practice stage's own, so these hold the review to
  // the stage's controls rather than to restyled light ones. Their colours are
  // the sky's own tokens, rated in the dark theme of check:contrast (the field
  // rule on --sky and on --sky-glass, the plain and filled buttons on dark).
  it('the answer field is the stage’s, ruled with the sky’s field rule', async () => {
    const { surface } = await openReview()
    const answerField = within(surface).getByLabelText(enChapter.stage.yourAnswer)

    expect(answerField.className).toContain('var(--on-sky-field-rule)')
    // The negative: no light rule left over from the old card.
    expect(answerField.className).not.toContain('border-separator')
  })

  it('an option is the stage’s lettered choice, not an outline button', async () => {
    const { surface } = await openReview()
    const option = within(surface).getByRole('radio', { name: /3\/4/ })

    expect(option.closest('label')?.textContent).toMatch(/^A/)
    expect(within(surface).queryByRole('button', { name: '3/4' })).toBeNull()
  })

  it('a control not chosen yet is ruled with the gated field rule, not white at 10%', async () => {
    // #191 review: border-white/10 is 1.37:1 on the glass, under 1.4.11's 3:1.
    // --on-sky-field-rule is rated by check:contrast on --sky and on --sky-glass.
    const { surface } = await openReview()
    const option = within(surface).getByRole('radio', { name: /3\/4/ }).closest('label')!

    expect(option.className).toContain('border-[color:var(--on-sky-field-rule)]')
    expect(option.className).not.toContain('border-white/10')
  })

  it('Check is the stage’s raised button on the sky', async () => {
    const { surface } = await openReview()
    const check = within(surface).getAllByRole('button', { name: enChapter.stage.check })[0]

    expect(check).toHaveAttribute('data-variant', 'onSky')
    expect(check).toHaveAttribute('data-lift')
  })

  it('the card is the stage’s glass, not a light card restyled', async () => {
    const { surface } = await openReview()
    const card = surface.querySelector<HTMLElement>('[data-review-card]')!

    expect(card.style.background).toBe('var(--sky-glass)')
    expect(card.className).not.toContain('stoa-card')
  })
})

describe('darkening it kept the contrast', () => {
  it('body text clears 4.5:1 on the page, on a card, on the feedback panel and in the field', () => {
    for (const name of ['--ink', '--secondary'] as const) {
      for (const bg of [ground(), card(), panel(), field()]) {
        expect(contrast(over(remapped(name), bg), bg)).toBeGreaterThanOrEqual(4.5)
      }
    }
  })

  it('the filled Check button clears 3:1 on the page, and its label 4.5:1 on it', () => {
    const accent = remapped('--accent')
    expect(contrast(accent, ground())).toBeGreaterThanOrEqual(3)
    expect(contrast(remapped('--on-accent'), accent)).toBeGreaterThanOrEqual(4.5)
  })

  it('an option not picked yet is told from the sky by its rule, on the page and on a card', () => {
    const rule = remapped('--separator')
    for (const bg of [ground(), card()]) {
      expect(contrast(over(rule, bg), bg)).toBeGreaterThanOrEqual(3)
    }
    // Picked, it is the filled accent and its label is --on-accent on it.
    expect(contrast(remapped('--on-accent'), remapped('--accent'))).toBeGreaterThanOrEqual(4.5)
  })

  it('the "missed N times" badge: the accent on its own tint, over a card', () => {
    const tint = over(remapped('--accent-tint'), card())
    expect(contrast(over(remapped('--accent'), tint), tint)).toBeGreaterThanOrEqual(4.5)
  })

  it('a right answer and a wrong one, on the feedback panel over a card', () => {
    // Gold says "you got it", as on the practice stage: an icon, so 3:1.
    expect(contrast(over(token('--lit'), panel()), panel())).toBeGreaterThanOrEqual(3)
    // The cross and its message are --red, which the sky block lifts to a rose.
    const red = token('--red', skyBlock)
    expect(contrast(over(red, panel()), panel())).toBeGreaterThanOrEqual(4.5)
    // The verdict itself, and the explanation under it.
    expect(contrast(over(remapped('--ink'), panel()), panel())).toBeGreaterThanOrEqual(4.5)
    expect(contrast(over(remapped('--secondary'), panel()), panel())).toBeGreaterThanOrEqual(4.5)
  })

  it('the light tokens it replaces would not have cleared it (the check is not vacuous)', () => {
    // --accent, as the light page declares it, is 3.18:1 on --sky; --red is
    // the colour card 059 found unreadable on a dark surface. Those are the
    // reasons the remap and the sky's own --red exist.
    expect(contrast(token('--accent', rootBlock), ground())).toBeLessThan(4.5)
    expect(contrast(token('--ink', rootBlock), ground())).toBeLessThan(4.5)
    expect(contrast(token('--red', rootBlock), ground())).toBeLessThan(4.5)
    // And the divider Ask uses for --separator would not make an option a
    // control here, which is why this remap does not take it.
    const divider = token('--sky-glass-border')
    expect(contrast(over(divider, ground()), ground())).toBeLessThan(3)
  })
})

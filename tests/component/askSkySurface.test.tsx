/**
 * Ask is a dark surface (#125): "this question box should look more like the
 * rest -- it is white and the theme is not".
 *
 * Two things are held here. The panel and the sheet really do carry the sky,
 * through `data-surface="sky"` and the one token remap, rather than each class
 * being rewritten; and darkening it did not cost contrast. `check:contrast`
 * rates pairs declared in brand-tokens.css and cannot see a remap applied in a
 * component, so the same WCAG arithmetic runs here on the tokens the remap
 * actually resolves to.
 *
 *   text        4.5:1
 *   a control   3:1 (WCAG 1.4.11)
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AskHost } from '@/features/ask/AskHost'
import { ASK_SKY_TOKENS, ASK_SURFACE_BACKGROUND } from '@/features/ask/askLayout'
import i18n from '@/i18n'
import { ApiError } from '@/services/api/httpClient'
import { resetAsk } from '@/store/askStore'
import { type CurrentUser, useAuthStore } from '@/store/authStore'

vi.mock('@/services/analytics/analyticsClient', () => ({ trackEvent: vi.fn() }))
vi.mock('@/services/chat/chatApi', () => ({
  getConversations: vi.fn(async () => ({ items: [] })),
  getConversation: vi.fn(async (id: string) => ({
    id,
    title: 'Linear equations',
    subject: 'math',
    grade: '8',
    updatedAt: '2026-10-11T10:00:00.000Z',
    messages: [],
  })),
  createConversation: vi.fn(),
}))
vi.mock('@/services/chat/chatStreamApi', () => ({
  streamConversationMessage: vi.fn(),
  getGenerationProgress: vi.fn(),
}))
vi.mock('@/services/teacherHelp/teacherHelpApi', () => ({
  getTeacherAvailability: vi.fn(async () => ({ online: false, availableTeachers: 0 })),
  getTeacherHelpRequest: vi.fn(async () => {
    throw new ApiError('never escalated', { status: 404 })
  }),
  createTeacherHelpRequest: vi.fn(),
}))
vi.mock('@/services/student/studentApi', () => ({
  getStudentProfile: vi.fn(async () => ({ grade: '8', primarySubjects: ['math'] })),
}))
vi.mock('@/services/learning/memoryApi', () => ({
  getMyMemorySummary: vi.fn(async () => ({ recommendations: [], weakTopics: [] })),
}))

// ---- the tokens, read where they are declared --------------------------

type RGBA = [number, number, number, number]

const css = readFileSync(path.resolve(__dirname, '../../src/styles/brand-tokens.css'), 'utf8')
const skyBlock = css.slice(css.indexOf('[data-surface="sky"] {'))
/** The light families, which the sky block leaves alone -- `--green` is one. */
const rootBlock = css.slice(css.indexOf(':root {'), css.indexOf('[data-surface="sky"] {'))

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
function remapped(name: keyof typeof ASK_SKY_TOKENS): RGBA {
  const target = /^var\((--[a-z0-9-]+)\)$/.exec(ASK_SKY_TOKENS[name])
  if (!target) throw new Error(`${name} is not a plain token reference`)
  return token(target[1])
}

/** `fg` at its own alpha, over an opaque `bg`. */
function over(fg: RGBA, bg: RGBA): RGBA {
  const a = fg[3]
  return [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a), 1]
}

/** `a` and `b` mixed as `color-mix(in srgb, a <share>, b)`. */
function mix(a: RGBA, b: RGBA, share: number): RGBA {
  return [a[0] * share + b[0] * (1 - share), a[1] * share + b[1] * (1 - share), a[2] * share + b[2] * (1 - share), 1]
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
 * The panel's own ground, and the cards that sit on it. Read inside each test,
 * not at import: a remap written as a colour must fail the test that says so,
 * with its own message, rather than taking the whole file down on load.
 */
const ground = () => remapped('--ground')
const card = () => over(remapped('--surface'), ground())

// ---- the panel on screen -----------------------------------------------

function openAsk() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/ask/c1']}>
          <AskHost route={{ conversationId: 'c1' }} />
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
  return screen.getByRole('complementary', { name: 'Ask' })
}

const originalMatchMedia = window.matchMedia

beforeEach(async () => {
  await i18n.changeLanguage('en')
  window.matchMedia = ((query: string) => ({
    matches: !query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
  useAuthStore.setState({
    user: { id: 'u-1', name: 'Lina Meier', email: 'lina@example.com', role: 'student' } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
  resetAsk()
})

afterEach(() => {
  window.matchMedia = originalMatchMedia
  sessionStorage.clear()
  vi.clearAllMocks()
})

describe('the panel is the sky, not a white card', () => {
  it('carries the sky surface and the remap, and is grounded on --sky', () => {
    const panel = openAsk()

    expect(panel).toHaveAttribute('data-surface', 'sky')
    expect(panel.style.getPropertyValue('--ink')).toBe('var(--on-sky-text)')
    expect(panel.style.getPropertyValue('--surface')).toBe('var(--sky-glass)')
    expect(panel.style.getPropertyValue('--accent')).toBe('var(--accent-on-sky)')
    expect(panel.style.background).toBe(ASK_SURFACE_BACKGROUND.panel)
    // The negative: nothing is left pointing at the light page any more.
    expect(panel.style.background).not.toContain('var(--ground)')
  })

  it('names only tokens: no colour is written into the remap', () => {
    for (const [name, value] of Object.entries(ASK_SKY_TOKENS)) {
      expect(value, `${name} must not hold a literal colour`).not.toMatch(
        /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(|\b(?:white|black|red|green|blue|grey|gray)\b/i,
      )
      expect(value, `${name} must resolve through a token`).toMatch(/var\(--/)
    }
  })

  it('cannot resolve in a circle: no remapped name is used as a target', () => {
    const keys = new Set(Object.keys(ASK_SKY_TOKENS))
    for (const [name, value] of Object.entries(ASK_SKY_TOKENS)) {
      for (const referenced of value.match(/--[a-z0-9-]+/g) ?? []) {
        expect(keys.has(referenced), `${name} points at ${referenced}, which this remap also redefines`).toBe(false)
      }
    }
  })
})

describe('darkening it kept the contrast', () => {
  it('body text clears 4.5:1 on the panel and on a card', () => {
    for (const name of ['--ink', '--secondary'] as const) {
      expect(contrast(over(remapped(name), ground()), ground())).toBeGreaterThanOrEqual(4.5)
      expect(contrast(over(remapped(name), card()), card())).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('the filled control -- send, and the student’s own bubble -- clears 3:1 on the panel, and its label 4.5:1 on it', () => {
    const accent = remapped('--accent')
    expect(contrast(accent, ground())).toBeGreaterThanOrEqual(3)
    expect(contrast(remapped('--on-accent'), accent)).toBeGreaterThanOrEqual(4.5)
  })

  it('the way back into Ask is told from the sky by its glyph, as the map’s own glass controls are', () => {
    // Its face is --sky-glass, the same glass the star map's zoom pair uses, so
    // what carries 1.4.11 is the mark on it rather than the disc.
    expect(contrast(over(token('--on-sky-text'), token('--sky-glass')), ground())).toBeGreaterThanOrEqual(3)
  })

  it('the light tokens it replaces would not have cleared it (the check is not vacuous)', () => {
    // --accent, as the light page declares it, is 3.18:1 on --sky; that is the
    // reason --accent-on-sky exists, and the reason the remap is needed at all.
    const lightAccent: RGBA = [0x35, 0x52, 0xe8, 1]
    expect(contrast(lightAccent, ground())).toBeLessThan(4.5)
    const lightInk: RGBA = [0x1d, 0x1d, 0x1f, 1]
    expect(contrast(lightInk, ground())).toBeLessThan(4.5)
  })

  it('a teacher’s name and bubble, lifted off --green for the dark panel', () => {
    const green = token('--green', rootBlock)
    const name = mix(green, token('--on-sky-text'), 0.3)
    expect(contrast(over(name, ground()), ground())).toBeGreaterThanOrEqual(4.5)

    const bubble = mix(green, token('--sky'), 0.26)
    expect(contrast(over(remapped('--ink'), bubble), bubble)).toBeGreaterThanOrEqual(4.5)
    // --green as declared, used as a word on the panel, is why both are mixed.
    expect(contrast(green, ground())).toBeLessThan(4.5)
  })
})

/**
 * The review reminder on the star map (#593): a small Murmi in the map's
 * corner, from `GET /practice/review/summary` --
 *
 *   - reviews due: `calling`, with the count; a button that flies to the star
 *     with the most cards due, Murmi's bubble beside it, whose way leads into
 *     that star's review;
 *   - reviews scheduled, none due: `sleeping`, with when the next one is;
 *   - nothing scheduled (a newcomer): no Murmi at all.
 *
 * `calling` animates on the first visit of the student's day only; "got it"
 * sends it away for the rest of that day; both survive a reload, and with
 * storage refused it simply shows (and animates) again. It gives way to the
 * first landing's and finding a star's bubble: one Murmi bubble at a time.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import de from '@/i18n/locales/de/starmap.json'
import en from '@/i18n/locales/en/starmap.json'
import fr from '@/i18n/locales/fr/starmap.json'
import it_ from '@/i18n/locales/it/starmap.json'
import { BUBBLE_EXIT_MS } from '@/features/starmap/components/MurmiBubble'
import { subjectOfNebula, type StarMap } from '@/features/starmap/model/starMap'
import { ZOOM_MS } from '@/features/starmap/motion/motionPolicy'
import { REVEAL_FLIGHT_MS } from '@/features/starmap/onboarding/useFirstReveal'
import { daysBetween, localDay, mostDueStar, nextReview, reminderKeys, reminderMood } from '@/features/starmap/reviewReminder/reviewReminder'
import { reminderTarget } from '@/features/starmap/reviewReminder/useReviewReminder'
import { StarMapRoute } from '@/features/starmap/StarMapRoute'
import { StarMapSourceContext, type StarMapSource } from '@/features/starmap/starMapSource'
import { asNewcomer } from '@/dev/demo/sky/newcomer'
import { readDemoStarMap } from '@/dev/demo/sky/source'
import i18n from '@/i18n'
import { getReviewSummary } from '@/services/practice/practiceApi'
import { useAuthStore } from '@/store/authStore'
import type { ReviewSummary } from '@/types/practice'

vi.mock('@/services/practice/practiceApi', async (original) => ({
  ...(await original<typeof import('@/services/practice/practiceApi')>()),
  getReviewSummary: vi.fn(),
}))

const summaryFn = vi.mocked(getReviewSummary)

const sky = () => readDemoStarMap({ subjectId: 'math', size: 1000, t: i18n.getFixedT('en', 'starmap'), language: 'en', relations: false, longNames: false })

/** Wednesday 11 November 2026, 10:00 local time. */
const MONDAY = new Date(2026, 10, 9, 10, 0, 0)
const WEDNESDAY_9AM = new Date(2026, 10, 11, 9, 0, 0)
const OWNER = 'student-a'

function media(reduce: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: /reduce/.test(query) ? reduce : true,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as never
}

beforeAll(async () => {
  await import('@/dev/demo/sky/source')
}, 30_000)

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(MONDAY)
  await i18n.changeLanguage('en')
  media(false)
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  useAuthStore.setState({ user: { id: OWNER, role: 'student' } as never })
  summaryFn.mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
  sessionStorage.clear()
  localStorage.clear()
  useAuthStore.setState({ user: null })
})

const due = (dueCount: number): ReviewSummary => ({ dueCount, scheduledCount: dueCount + 4, nextDueAt: MONDAY.toISOString() })
const scheduled: ReviewSummary = { dueCount: 0, scheduledCount: 5, nextDueAt: WEDNESDAY_9AM.toISOString() }
const nothing: ReviewSummary = { dueCount: 0, scheduledCount: 0, nextDueAt: '' }

// ---------------------------------------------------------------- the rules

describe('what the summary makes of Murmi', () => {
  it('whistles with reviews due, sleeps with reviews scheduled and none due, is not there with nothing scheduled', () => {
    expect(reminderMood(due(3))).toBe('calling')
    expect(reminderMood(scheduled)).toBe('sleeping')
    expect(reminderMood(nothing)).toBeNull()
    expect(reminderMood(undefined)).toBeNull()
  })

  it('flies to the star with the most cards due, the first in the sky on a tie', () => {
    const map = sky()
    const best = mostDueStar(map)!
    expect(best.reviewDue).toBe(Math.max(...map.stars.map((star) => star.reviewDue)))
    expect(map.stars.find((star) => star.reviewDue === best.reviewDue)).toBe(best)
    expect(mostDueStar({ stars: map.stars.map((star) => ({ ...star, reviewDue: 0 })) })).toBeNull()
  })

  it('frames that star: a choice’s flight in the galaxy in view, the slow one from another, none with reduced motion', () => {
    const map = sky()
    const best = mostDueStar(map)!
    const home = subjectOfNebula(map, best.nebulaId) === map.subject.subjectId
    expect(reminderTarget(map, best, false)).toEqual({ layer: 'map', fly: true, frame: [best.unitId], flightMs: home ? ZOOM_MS : REVEAL_FLIGHT_MS })
    expect(reminderTarget(map, best, true)).toEqual({ layer: 'map', fly: true, frame: [best.unitId], flightMs: undefined })
  })
})

describe('the student’s day', () => {
  it('is the local calendar day, not the UTC one', () => {
    expect(localDay(new Date(2026, 10, 9, 0, 5))).toBe('2026-11-09')
    expect(localDay(new Date(2026, 10, 9, 23, 55))).toBe('2026-11-09')
    expect(daysBetween(new Date(2026, 10, 9, 23, 55), new Date(2026, 10, 10, 0, 5))).toBe(1)
  })

  it('says when the next review is: later today, tomorrow, a weekday this week, a date beyond', () => {
    expect(nextReview(new Date(2026, 10, 9, 18).toISOString(), MONDAY, 'en')).toEqual({ kind: 'today' })
    expect(nextReview(new Date(2026, 10, 8, 18).toISOString(), MONDAY, 'en')).toEqual({ kind: 'today' })
    expect(nextReview(new Date(2026, 10, 10, 8).toISOString(), MONDAY, 'en')).toEqual({ kind: 'tomorrow' })
    expect(nextReview(WEDNESDAY_9AM.toISOString(), MONDAY, 'en')).toEqual({ kind: 'weekday', when: 'Wednesday' })
    expect(nextReview(WEDNESDAY_9AM.toISOString(), MONDAY, 'de-CH')).toEqual({ kind: 'weekday', when: 'Mittwoch' })
    expect(nextReview(new Date(2026, 10, 20, 8).toISOString(), MONDAY, 'en')).toEqual({ kind: 'date', when: 'November 20' })
    expect(nextReview('', MONDAY, 'en')).toEqual({ kind: 'unknown' })
    expect(nextReview('not a date', MONDAY, 'en')).toEqual({ kind: 'unknown' })
  })
})

describe('its words, in four languages', () => {
  it.each([
    ['de', de],
    ['en', en],
    ['fr', fr],
    ['it', it_],
  ] as const)('%s has every line, the next review with its time filled in', (_, locale) => {
    const words = locale.reviewReminder
    for (const key of ['next', 'nextToday', 'nextTomorrow', 'nextUnknown', 'gotIt'] as const) expect(words[key]).toBeTruthy()
    expect(words.next).toContain('{{when}}')
    // The count reuses the star's own plurals.
    expect(locale.marker.reviewDue_one).toContain('{{count}}')
    expect(locale.marker.reviewDue_other).toContain('{{count}}')
  })
})

// ---------------------------------------------------------------- on the map route

const sourceNotDemo: StarMapSource = { read: readDemoStarMap, demo: false }

function Where() {
  const location = useLocation()
  return <p data-testid="where">{location.pathname}</p>
}

function mountRoute(entry: string | { pathname: string; state?: unknown } = '/map/math', source: StarMapSource = sourceNotDemo) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <StarMapSourceContext.Provider value={source}>
          <MemoryRouter initialEntries={['/map/math', entry]} initialIndex={1}>
            <Routes>
              <Route path="/map/:subjectId" element={<StarMapRoute />} />
              <Route path="/map/:subjectId/:topicId" element={<StarMapRoute />} />
              <Route path="/map/:subjectId/:topicId/:unitId" element={<StarMapRoute />} />
              <Route path="/review/:unitId" element={<p>review</p>} />
            </Routes>
            <Where />
          </MemoryRouter>
        </StarMapSourceContext.Provider>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

const corner = () => document.querySelector<HTMLElement>('[data-review-reminder]')
const cornerMurmi = () => corner()?.querySelector<SVGElement>('[data-murmi]') ?? null
const bubble = () => document.querySelector<HTMLElement>('[data-review-reminder-bubble]')

describe('the corner Murmi', () => {
  it('with reviews due: whistles beside the count, a button named by the same words, the figure hidden from readers', async () => {
    summaryFn.mockResolvedValue(due(3))
    mountRoute()
    await waitFor(() => expect(corner()).not.toBeNull())
    expect(corner()!.dataset.reviewReminder).toBe('calling')
    expect(cornerMurmi()!.dataset.murmi).toBe('calling')
    expect(cornerMurmi()!.getAttribute('aria-hidden')).toBe('true')
    const button = screen.getByRole('button', { name: '3 cards due for review' })
    expect(button).toHaveAttribute('data-review-reminder-open')
    // Part of the map's controls: the map's own taps and Murmi's bubbles keep clear of it.
    expect(button.closest('[data-starmap-overlay]')).not.toBeNull()
  })

  it('with one card due: the singular', async () => {
    summaryFn.mockResolvedValue(due(1))
    mountRoute()
    expect(await screen.findByRole('button', { name: '1 card due for review' })).toBeInTheDocument()
  })

  it('with reviews scheduled and none due: asleep, saying when the next one is, not a button', async () => {
    summaryFn.mockResolvedValue(scheduled)
    mountRoute()
    await waitFor(() => expect(corner()).not.toBeNull())
    expect(corner()!.dataset.reviewReminder).toBe('sleeping')
    expect(cornerMurmi()!.dataset.murmi).toBe('sleeping')
    expect(cornerMurmi()!.hasAttribute('data-murmi-animated')).toBe(false)
    expect(corner()).toHaveTextContent('Next review: Wednesday')
    expect(corner()!.querySelector('button')).toBeNull()
  })

  it('in German: the same, in its words', async () => {
    await i18n.changeLanguage('de')
    summaryFn.mockResolvedValue(scheduled)
    const first = mountRoute()
    await waitFor(() => expect(corner()).toHaveTextContent('Nächste Wiederholung: Mittwoch'))
    first.unmount()
    summaryFn.mockResolvedValue(due(3))
    mountRoute()
    expect(await screen.findByRole('button', { name: '3 Karten zur Wiederholung fällig' })).toBeInTheDocument()
  })

  it('with nothing scheduled (a newcomer): no Murmi at all', async () => {
    summaryFn.mockResolvedValue(nothing)
    mountRoute()
    await waitFor(() => expect(summaryFn).toHaveBeenCalled())
    await act(async () => {})
    expect(corner()).toBeNull()
  })

  it('not for anyone but a signed-in student: the summary is not even asked for', async () => {
    useAuthStore.setState({ user: { id: 'tutor-a', role: 'tutor' } as never })
    summaryFn.mockResolvedValue(due(3))
    mountRoute()
    await act(async () => {})
    expect(summaryFn).not.toHaveBeenCalled()
    expect(corner()).toBeNull()
  })

  it('not with a star chosen: its card has that side of the map', async () => {
    const map = sky()
    const star = map.stars.find((candidate) => candidate.state === 'lit')!
    summaryFn.mockResolvedValue(due(3))
    mountRoute(`/map/${subjectOfNebula(map, star.nebulaId)}/${star.nebulaId}/${star.unitId}`)
    await waitFor(() => expect(summaryFn).toHaveBeenCalled())
    await act(async () => {})
    expect(corner()).toBeNull()
  })
})

describe('the tap', () => {
  it('flies to the star with the most cards due, Murmi’s bubble beside it, its way into that star’s review', async () => {
    const map = sky()
    const best = mostDueStar(map)!
    summaryFn.mockResolvedValue(due(3))
    mountRoute()
    fireEvent.click(await screen.findByRole('button', { name: '3 cards due for review' }))
    await waitFor(() => expect(bubble()).not.toBeNull())
    expect(bubble()!.dataset.reviewReminderBubble).toBe(best.unitId)
    // On the star's galaxy, no card: the camera frames the star.
    expect(screen.getByTestId('where')).toHaveTextContent(new RegExp(`^/map/${subjectOfNebula(map, best.nebulaId)}$`))
    expect(bubble()!.querySelector('h2')!.textContent).toBe(best.name)
    expect(bubble()).toHaveTextContent(`${best.reviewDue} card${best.reviewDue === 1 ? '' : 's'} due for review`)
    const review = bubble()!.querySelector<HTMLAnchorElement>('a[data-review-reminder-way="review"]')!
    expect(review.getAttribute('href')).toBe(`/review/${best.unitId}`)
    expect(bubble()!.querySelector('[data-murmi]')!.getAttribute('data-murmi')).toBe('pointing')
    // One Murmi at a time: the corner's goes while its bubble is up.
    expect(corner()).toBeNull()
    fireEvent.click(review)
    await waitFor(() => expect(screen.getByText('review')).toBeInTheDocument())
  })

  it('from a nebula: the star’s galaxy route, in place', async () => {
    const map = sky()
    const best = mostDueStar(map)!
    const nebula = map.nebulae.find((candidate) => candidate.subjectId === 'math')!
    summaryFn.mockResolvedValue(due(3))
    mountRoute(`/map/math/${nebula.topicId}`)
    fireEvent.click(await screen.findByRole('button', { name: '3 cards due for review' }))
    await waitFor(() => expect(bubble()).not.toBeNull())
    expect(screen.getByTestId('where')).toHaveTextContent(new RegExp(`^/map/${subjectOfNebula(map, best.nebulaId)}$`))
  })

  it('waved away by its ✕: the bubble goes, the corner Murmi comes back, still', async () => {
    summaryFn.mockResolvedValue(due(3))
    mountRoute()
    fireEvent.click(await screen.findByRole('button', { name: '3 cards due for review' }))
    await waitFor(() => expect(bubble()).not.toBeNull())
    fireEvent.click(bubble()!.querySelector('button[aria-label="Close"]')!)
    await waitFor(() => expect(bubble()).toBeNull(), { timeout: BUBBLE_EXIT_MS + 1000 })
    await waitFor(() => expect(corner()).not.toBeNull())
    expect(cornerMurmi()!.hasAttribute('data-murmi-animated')).toBe(false)
  })
})

describe('once a day', () => {
  it('animates on the first visit of the day, holds still on the next (a reload), animates again the next day', async () => {
    summaryFn.mockResolvedValue(due(3))
    const first = mountRoute()
    await waitFor(() => expect(cornerMurmi()).not.toBeNull())
    expect(cornerMurmi()!.hasAttribute('data-murmi-animated')).toBe(true)
    expect(localStorage.getItem(reminderKeys(OWNER).seen)).toBe('2026-11-09')
    first.unmount()

    const reload = mountRoute()
    await waitFor(() => expect(cornerMurmi()).not.toBeNull())
    expect(cornerMurmi()!.hasAttribute('data-murmi-animated')).toBe(false)
    reload.unmount()

    vi.setSystemTime(new Date(2026, 10, 10, 7, 30))
    mountRoute()
    await waitFor(() => expect(cornerMurmi()).not.toBeNull())
    expect(cornerMurmi()!.hasAttribute('data-murmi-animated')).toBe(true)
  })

  it('with storage refused: animates every visit', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })
    summaryFn.mockResolvedValue(due(3))
    const first = mountRoute()
    await waitFor(() => expect(cornerMurmi()).not.toBeNull())
    expect(cornerMurmi()!.hasAttribute('data-murmi-animated')).toBe(true)
    first.unmount()
    mountRoute()
    await waitFor(() => expect(cornerMurmi()).not.toBeNull())
    expect(cornerMurmi()!.hasAttribute('data-murmi-animated')).toBe(true)
  })

  it('“got it”: gone for the rest of the day, across a reload; back the next day', async () => {
    summaryFn.mockResolvedValue(due(3))
    const first = mountRoute()
    fireEvent.click(await screen.findByRole('button', { name: '3 cards due for review' }))
    await waitFor(() => expect(bubble()).not.toBeNull())
    fireEvent.click(bubble()!.querySelector('[data-review-reminder-way="got-it"]')!)
    await waitFor(() => expect(bubble()).toBeNull(), { timeout: BUBBLE_EXIT_MS + 1000 })
    expect(corner()).toBeNull()
    expect(localStorage.getItem(reminderKeys(OWNER).waved)).toBe('2026-11-09')
    first.unmount()

    const reload = mountRoute()
    await waitFor(() => expect(summaryFn).toHaveBeenCalledTimes(2))
    await act(async () => {})
    expect(corner()).toBeNull()
    reload.unmount()

    vi.setSystemTime(new Date(2026, 10, 10, 7, 30))
    mountRoute()
    await waitFor(() => expect(corner()).not.toBeNull())
  })

  it('“got it” with storage refused: it simply comes back on the next visit', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })
    summaryFn.mockResolvedValue(due(3))
    const first = mountRoute()
    fireEvent.click(await screen.findByRole('button', { name: '3 cards due for review' }))
    await waitFor(() => expect(bubble()).not.toBeNull())
    fireEvent.click(bubble()!.querySelector('[data-review-reminder-way="got-it"]')!)
    await waitFor(() => expect(bubble()).toBeNull(), { timeout: BUBBLE_EXIT_MS + 1000 })
    expect(corner()).toBeNull()
    first.unmount()
    mountRoute()
    await waitFor(() => expect(corner()).not.toBeNull())
  })
})

describe('giving way', () => {
  it('hides while finding a star has its bubble up, and comes back once it goes', async () => {
    summaryFn.mockResolvedValue(due(3))
    mountRoute({ pathname: '/map/physics/optics/demo-refraction', state: { findStar: { unitId: 'demo-refraction' } } })
    await waitFor(() => expect(document.querySelector('[data-find-star]')).not.toBeNull())
    await waitFor(() => expect(summaryFn).toHaveBeenCalled())
    await act(async () => {})
    expect(corner()).toBeNull()
    fireEvent.click(document.querySelector('[data-find-star] button[aria-label="Close"]')!)
    await waitFor(() => expect(document.querySelector('[data-find-star]')).toBeNull(), { timeout: BUBBLE_EXIT_MS + 1000 })
    await waitFor(() => expect(corner()).not.toBeNull())
  })

  it('hides under the first landing’s bubble', async () => {
    sessionStorage.setItem(`stoa.starmap.firstLanding.subject.${OWNER}`, 'math')
    const newcomer: StarMapSource = { read: (options) => asNewcomer(readDemoStarMap(options) as StarMap), demo: false }
    summaryFn.mockResolvedValue(scheduled)
    mountRoute('/map/math', newcomer)
    await waitFor(() => expect(document.querySelector('[data-first-landing]')).not.toBeNull())
    await waitFor(() => expect(summaryFn).toHaveBeenCalled())
    await act(async () => {})
    expect(corner()).toBeNull()
  })
})

/**
 * The onboarding goes on past "Integers" (#586):
 *
 *   1. the first landing's bubble offers "Find my own star" beside "Start
 *      this star" and "Look around first";
 *   2. taking it hands over to the docked composer: focused, highlighted once,
 *      two or three things to say for the landing star's subject, one of which
 *      goes out at a tap, in a conversation of its own, and finds its star as
 *      any answer does (#489); Escape or opening Ask ends the offer;
 *   3. the first time a student new to Ask is on the practice stage, Murmi
 *      points at Ask and its way to add a photo -- not for a student who has
 *      asked something, not during a quiz, and not again once waved away in
 *      this tab. The conversation "Find my own star" started does not count.
 *
 * The design preview walks it: the sine-and-cosine example finds the demo
 * knowledge point, which a newcomer has a path to.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { demoStarMap } from '@/dev/demo/sky/demoStarMap'
import { DEMO_KNOWLEDGE_POINT } from '@/dev/demo/sky/demoSky'
import { asNewcomer } from '@/dev/demo/sky/newcomer'
import { demoConversationList, resetDemoServer, startAsNewcomer } from '@/dev/preview/demoSource'
import { demoTargetFor } from '@/dev/preview/handlers'
import { demoStarMapOverride } from '@/dev/preview/lighting'
import { guideConversations, rememberGuideConversation } from '@/features/ask/askGuide'
import { AskHost } from '@/features/ask/AskHost'
import { AskServerProvider } from '@/features/ask/server/askServer'
import { StageWithAsk } from '@/features/chapter/StageAsk'
import { findStarPath } from '@/features/starmap/model/missingStars'
import { exampleGroupFor, findOwnExamples } from '@/features/starmap/onboarding/findOwnStar'
import { BUBBLE_EXIT_MS, FirstLandingBubble } from '@/features/starmap/onboarding/FirstLandingBubble'
import { dockedPlace, placeAvoiding, starBox } from '@/features/starmap/components/MurmiBubble'
import { FindStarBubble } from '@/features/starmap/findStar/FindStarBubble'
import i18n from '@/i18n'
import { resetAsk, useAskStore } from '@/store/askStore'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { ConversationSummary } from '@/types/chat'
import { createFakeAskServer, type FakeAskServer } from '../fakes/askServer'
import { fakeClock } from './starmapHarness'

const OWNER = 'u-1'
const KP = DEMO_KNOWLEDGE_POINT.unitId
let server: FakeAskServer

function emulate({ wide = true, reducedMotion = false } = {}) {
  window.matchMedia = ((query: string) => ({
    matches: /reduce/.test(query) ? reducedMotion : wide,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as never
}

function mount(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrap = (inner: ReactNode) => (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <AskServerProvider value={server}>{inner}</AskServerProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>
  )
  const view = render(wrap(node))
  return { ...view, rerender: (next: ReactNode) => view.rerender(wrap(next)) }
}

function summary(id: string): ConversationSummary {
  return { id, title: id, subject: 'math', grade: '8', updatedAt: '2026-11-06T10:00:00Z' }
}

const newcomerMap = () =>
  asNewcomer(demoStarMapOverride(demoStarMap('math', 1000, i18n.getFixedT('en', 'starmap'), { language: 'en' }), 1000), [])

beforeEach(async () => {
  vi.clearAllMocks()
  sessionStorage.clear()
  await i18n.changeLanguage('en')
  emulate()
  useAuthStore.setState({
    user: { id: OWNER, name: 'L', email: 'l@x', role: 'student' } as CurrentUser,
    accessToken: 't',
    isAuthenticated: true,
  })
  resetAsk()
  server = createFakeAskServer()
  server.availability = { online: false, availableTeachers: 0 }
})

describe('1. the first landing offers two ways on', () => {
  it('has "Find my own star" beside "Start this star" and "Look around first", and hands over before Murmi goes', () => {
    const star = newcomerMap().stars.find((candidate) => candidate.unitId === KP)!
    const clock = fakeClock()
    const findOwn = vi.fn()
    const dismissed = vi.fn()
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <FirstLandingBubble star={star} onFindOwn={findOwn} locate={() => ({ x: 100, y: 100, size: 20 })} onDismiss={dismissed} scheduler={clock} />
        </MemoryRouter>
      </I18nextProvider>,
    )
    const layer = document.querySelector<HTMLElement>('[data-first-landing]')!
    Object.defineProperty(layer, 'clientWidth', { value: 1024 })
    Object.defineProperty(layer, 'clientHeight', { value: 700 })
    act(() => clock.advance(500))
    expect(screen.getByText(/Tell me where you are at school/)).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Start this star' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Look around first' })).toBeTruthy()

    vi.useFakeTimers()
    fireEvent.click(screen.getByRole('button', { name: 'Find my own star' }))
    expect(findOwn).toHaveBeenCalledTimes(1)
    expect(dismissed).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(BUBBLE_EXIT_MS)
    })
    expect(dismissed).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('offers it on the placeholder star too, where there is no chapter to start', () => {
    const star = newcomerMap().stars.find((candidate) => candidate.unitId === 'numbers-1')!
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <FirstLandingBubble star={star} startable={false} onFindOwn={() => {}} locate={() => null} onDismiss={() => {}} scheduler={fakeClock()} />
        </MemoryRouter>
      </I18nextProvider>,
    )
    const bubble = document.querySelector('[data-first-landing]')!
    expect([...bubble.querySelectorAll('button')].map((button) => button.textContent)).toEqual(['Find my own star', 'Look around first'])
  })
})

describe('2. finding my own star', () => {
  it('has two or three things to say for the subject, and two for any other', () => {
    const t = i18n.getFixedT('en', 'starmap')
    expect(findOwnExamples(t, 'math')).toEqual([
      'I want to practise quadratic equations',
      "We're learning derivatives",
      "We're doing sine and cosine at school",
    ])
    expect(findOwnExamples(t, 'physics')).toHaveLength(2)
    expect(exampleGroupFor('chemistry')).toBe('general')
    expect(findOwnExamples(t, 'chemistry')).toHaveLength(2)
    for (const language of ['de', 'fr', 'it']) {
      const own = findOwnExamples(i18n.getFixedT(language, 'starmap'), 'math')
      expect(own.every((example) => !example.startsWith('findOwn.'))).toBe(true)
    }
  })

  it('focuses the docked composer, highlights it, and sends a chosen example in a conversation of its own', async () => {
    server.seed({ newConversationIds: ['found-1'] })
    mount(<AskHost subjectId="math"><p>sky</p></AskHost>)
    expect(document.querySelector('[data-ask-examples]')).toBeNull()

    const examples = findOwnExamples(i18n.getFixedT('en', 'starmap'), 'math')
    act(() => useAskStore.getState().offerExamples(OWNER, examples))
    const docked = document.querySelector<HTMLElement>('[data-ask-docked]')!
    expect(document.activeElement?.hasAttribute('data-composer-field')).toBe(true)
    expect(docked.contains(document.activeElement)).toBe(true)
    expect(docked.querySelector('[data-ask-guide] [data-composer="docked"]')).not.toBeNull()
    const offered = within(screen.getByRole('list', { name: 'For example:' }))
    expect(offered.getAllByRole('button').map((button) => button.textContent)).toEqual(examples)

    await userEvent.click(offered.getByRole('button', { name: examples[2] }))
    // Ask opens on its list and the example goes out at once, as a new conversation's first question.
    await screen.findByRole('complementary', { name: 'Ask' })
    await waitFor(() => expect(server.conversations.createConversation).toHaveBeenCalledTimes(1))
    expect(server.conversations.createConversation.mock.calls[0][0]).toMatchObject({ initialMessage: examples[2] })
    expect(useAskStore.getState().examples).toBeNull()
    expect(useAskStore.getState().pending).toBeNull()
    // The onboarding asked it: the practice stage still counts the student as new to Ask.
    await waitFor(() => expect(guideConversations(OWNER).has('found-1')).toBe(true))
  })

  it('ends the offer on Escape, leaving Ask closed', () => {
    mount(<AskHost subjectId="math"><p>sky</p></AskHost>)
    act(() => useAskStore.getState().offerExamples(OWNER, ['One', 'Two']))
    expect(document.querySelector('[data-ask-examples]')).not.toBeNull()
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
    expect(document.querySelector('[data-ask-examples]')).toBeNull()
    expect(document.querySelector('[data-ask-guide]')).toBeNull()
    expect(useAskStore.getState().open).toBe(false)
  })

  it('in the design preview, finds the demo knowledge point, which a newcomer has a path to', () => {
    for (const language of ['en', 'de', 'fr', 'it']) {
      const example = findOwnExamples(i18n.getFixedT(language, 'starmap'), 'math')[2]
      expect(demoTargetFor(example)).toEqual({ unitId: KP })
    }
    expect(demoTargetFor("We're learning derivatives")).toBeNull()
    expect(findStarPath(newcomerMap(), KP)).not.toBeNull()
  })
})

const Stage = ({ off }: { off?: string }) => (
  <StageWithAsk practice={{ context: { unitId: 'u', lessonId: 'l', challengeId: 'ch-1' } }} off={off}>
    <p>exercise</p>
  </StageWithAsk>
)
const TIP = 'Stuck? Ask me here.'

describe('3. the first time on the practice stage', () => {
  it('points at Ask and its way to add a photo for a student with no conversation, and says so once', async () => {
    mount(<Stage />)
    const tip = await screen.findByRole('complementary', { name: TIP })
    // Beside the exercise on a wide screen: in Ask's panel, over its composer.
    expect(screen.getByRole('complementary', { name: 'Ask' }).contains(tip)).toBe(true)
    expect(within(tip).getByText(/take a photo of your working/)).toBeTruthy()
    expect(document.querySelector('[data-stage-ask-tip-status]')!.textContent).toContain(TIP)
    expect(document.querySelector('[data-stage-host][data-ask-guide] [data-ask-surface] [data-composer-add]')).not.toBeNull()
    // Not a modal: it took no focus.
    expect(tip.contains(document.activeElement)).toBe(false)
  })

  it('sits over the docked composer on a phone', async () => {
    emulate({ wide: false })
    mount(<Stage />)
    const tip = await screen.findByRole('complementary', { name: TIP })
    expect(tip.closest('[data-ask-docked]')).not.toBeNull()
    expect(document.querySelector('[data-ask-guide] [data-composer="docked"]')).not.toBeNull()
  })

  it('is not shown to a student who has asked something', async () => {
    server.seed({ list: [summary('mine')] })
    mount(<Stage />)
    await waitFor(() => expect(server.conversations.getConversations).toHaveBeenCalled())
    await act(async () => {})
    expect(screen.queryByRole('complementary', { name: TIP })).toBeNull()
  })

  it("counts the conversation \"Find my own star\" started as the onboarding's, not the student's", async () => {
    rememberGuideConversation(OWNER, 'found-1')
    server.seed({ list: [summary('found-1')] })
    mount(<Stage />)
    expect(await screen.findByRole('complementary', { name: TIP })).toBeTruthy()
  })

  it('is not shown during a quiz', async () => {
    mount(<Stage off="Ask is off during the quiz." />)
    await waitFor(() => expect(server.conversations.getConversations).toHaveBeenCalled())
    await act(async () => {})
    expect(screen.queryByRole('complementary', { name: TIP })).toBeNull()
    expect(document.querySelector('[data-ask-guide]')).toBeNull()
  })

  it('goes on "Got it" or Escape, and stays away in this tab', async () => {
    const first = mount(<Stage />)
    await userEvent.click(within(await screen.findByRole('complementary', { name: TIP })).getByRole('button', { name: 'Got it' }))
    expect(screen.queryByRole('complementary', { name: TIP })).toBeNull()
    // Ask's panel stays open: only Murmi went.
    expect(screen.getByRole('complementary', { name: 'Ask' })).toBeTruthy()
    first.unmount()

    mount(<Stage />)
    await waitFor(() => expect(server.conversations.getConversations).toHaveBeenCalledTimes(2))
    await act(async () => {})
    expect(screen.queryByRole('complementary', { name: TIP })).toBeNull()
  })

  it('goes on Escape wherever focus is, leaving Ask open', async () => {
    mount(<Stage />)
    await screen.findByRole('complementary', { name: TIP })
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(screen.queryByRole('complementary', { name: TIP })).toBeNull()
    expect(screen.getByRole('complementary', { name: 'Ask' })).toBeTruthy()
  })
})

describe("the design preview's newcomer", () => {
  it('has none of the demo conversations, so the practice stage greets them', () => {
    startAsNewcomer(true)
    expect(demoConversationList().items).toEqual([])
    resetDemoServer()
    expect(demoConversationList().items.length).toBeGreaterThan(0)
  })
})

describe('Murmi keeps clear of the stars it talks about (#586, found in testing)', () => {
  const layer = { width: 1024, height: 700 }
  const bubble = { width: 320, height: 120 }
  const anchor = { x: 500, y: 300, size: 20 }
  const coversBox = (place: { x: number; y: number }, box: { x0: number; y0: number; x1: number; y1: number }) =>
    place.x < box.x1 && place.x + bubble.width > box.x0 && place.y < box.y1 && place.y + bubble.height > box.y0

  it('takes another side when its first choice, below, would cover the star it names', () => {
    const named = starBox({ x: 500, y: 380, size: 20 })
    expect(placeAvoiding(anchor, bubble, layer, [], null).side).toBe('below')
    const place = placeAvoiding(anchor, bubble, layer, [], named)
    expect(place.side).not.toBe('below')
    expect(coversBox(place, named)).toBe(false)
  })

  it('keeps clear of the named star before the rest of the path when it cannot clear them all', () => {
    const named = starBox({ x: 500, y: 380, size: 20 })
    // The path's other stars sit above, right and left: no side clears every star.
    const rest = [starBox({ x: 500, y: 200, size: 20 }), starBox({ x: 700, y: 300, size: 20 }), starBox({ x: 300, y: 300, size: 20 })]
    const place = placeAvoiding(anchor, bubble, layer, [], named, rest)
    expect(coversBox(place, named)).toBe(false)
  })

  it('docks under the top controls on a phone when the bottom would cover the star it names', () => {
    const phone = { width: 375, height: 700 }
    const controls = [{ x0: 300, y0: 600, x1: 360, y1: 680 }, { x0: 16, y0: 16, x1: 300, y1: 60 }]
    expect(dockedPlace({ x: 180, y: 250, size: 20 }, { height: 150 }, phone, controls).side).toBe('docked-bottom')
    const named = starBox({ x: 180, y: 520, size: 20 })
    expect(dockedPlace({ x: 180, y: 250, size: 20 }, { height: 150 }, phone, controls, named).side).toBe('docked-top')
  })

  it('places the find-star bubble off the first missing star on the map', () => {
    const map = newcomerMap()
    const path = findStarPath(map, KP)!
    const star = map.stars.find((candidate) => candidate.unitId === KP)!
    const first = map.stars.find((candidate) => candidate.unitId === path.first)!
    const spots: Record<string, { x: number; y: number; size: number }> = { [KP]: anchor, [first.unitId]: { x: 500, y: 380, size: 20 } }
    const clock = fakeClock()
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <FindStarBubble star={star} first={first} path={path.missing} locate={(unitId) => spots[unitId] ?? null} onDismiss={() => {}} scheduler={clock} />
        </MemoryRouter>
      </I18nextProvider>,
    )
    const layerEl = document.querySelector<HTMLElement>('[data-find-star]')!
    Object.defineProperty(layerEl, 'clientWidth', { value: layer.width })
    Object.defineProperty(layerEl, 'clientHeight', { value: layer.height })
    const box = layerEl.querySelector<HTMLElement>('aside')!
    Object.defineProperty(box, 'offsetWidth', { value: bubble.width })
    Object.defineProperty(box, 'offsetHeight', { value: bubble.height })
    act(() => clock.advance(500))
    expect(box.dataset.side).toBeDefined()
    expect(box.dataset.side).not.toBe('below')
    const [, x, y] = /translate\((-?[\d.]+)px, (-?[\d.]+)px\)/.exec(box.style.transform)!.map(Number)
    expect(coversBox({ x, y }, starBox(spots[first.unitId]))).toBe(false)
  })
})

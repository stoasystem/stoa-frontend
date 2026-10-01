import { act, render, screen, within } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { demoStarMap, defaultDemoSubject } from '@/features/starmap/fixtures/demoStarMap'
import { DEMO_STAR_COUNT, fixtureSizeFrom } from '@/features/starmap/useStarMap'
import { LEARNING_STATES } from '@/features/starmap/model/starMap'
import { StarMapView } from '@/features/starmap/components/StarMapView'
import { useStarMapStore } from '@/store/starMapStore'
import { fakeClock, recordingRenderer } from './starmapHarness'

beforeEach(async () => {
  await i18n.changeLanguage('en')
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
   x: 0, y: 0, left: 0, top: 0, width: 1280, height: 776, right: 1280, bottom: 776, toJSON: () => ({}),
  } as DOMRect)
})
afterEach(async () => { vi.restoreAllMocks(); await i18n.changeLanguage('en') })
const mapFor = (id: string) => demoStarMap(id, 10, i18n.getFixedT(i18n.language, 'starmap'))

it('normalizes math aliases and gives empty subjects truthful summaries', () => {
  expect(mapFor(' Mathematics ')).toEqual(mapFor('math'))
  for (const id of ['german', 'unknown']) {
   const map = mapFor(id)
   expect(map.stars).toEqual([])
   expect(map.summary.total).toBe(0)
  }
  expect(mapFor('german').subjects.find((s) => s.subjectId === 'german')?.total).toBe(0)
})

it.each(['de', 'en', 'fr', 'it'])('translates every placeholder label in %s', async (language) => {
  await i18n.changeLanguage(language)
  for (const id of ['math', 'physics']) {
   const map = mapFor(id)
   const labels = [map.subject.name, ...map.nebulae.map((n) => n.name), ...map.subjects.map((s) => s.name),
     ...map.stars.flatMap((s) => [s.name, ...(s.chapter.nextLesson ? [s.chapter.nextLesson.title] : [])])]
   for (const label of labels) expect(label).not.toContain('demo.')
  }
  expect(mapFor('math').stars[0].name).toBe(i18n.t('demo.sampleStar', { ns: 'starmap', lng: language, index: 1 }))
})

it('keeps account preferences separate and falls back to the first subject with content', async () => {
  const subjects = mapFor('math').subjects
  useStarMapStore.setState({ lastSubjects: {} })
  useStarMapStore.getState().remember('a', 'physics')
  useStarMapStore.getState().remember('b', 'math')
  await useStarMapStore.persist.rehydrate()
  expect(useStarMapStore.getState().lastSubjects).toEqual({ a: 'physics', b: 'math' })
  expect(defaultDemoSubject(useStarMapStore.getState().lastSubjects.a, subjects)).toBe('physics')
  expect(defaultDemoSubject(undefined, [subjects[2], subjects[1], subjects[0]])).toBe('physics')
  expect(defaultDemoSubject('removed', subjects)).toBe('math')
  expect(defaultDemoSubject('german', subjects)).toBe('german')
  useStarMapStore.setState({ lastSubjects: {} })
})

it('labels sample progress and offers review as coming soon without a fake chapter link', () => {
  const map = mapFor('math')
  const clock = fakeClock()
  render(<I18nextProvider i18n={i18n}><MemoryRouter><div data-surface="sky">
   <StarMapView demo map={map} target={{ layer: 'star', nebulaId: 'numbers', unitId: 'u-2' }}
     onNavigate={vi.fn()} scheduler={clock} createRendererFor={() => recordingRenderer()} />
  </div></MemoryRouter></I18nextProvider>)
  act(() => clock.advance(20))
  expect(screen.getByText('Demo · Sample content and progress')).toBeInTheDocument()
  const card = screen.getByRole('article', { name: 'Knowledge point 2' })
  expect(within(card).getByRole('button', { name: 'Review 3 exercises' })).toBeDisabled()
  expect(within(card).getByText('Coming soon')).toBeInTheDocument()
  expect(within(card).queryByRole('link', { name: 'Open chapter' })).toBeNull()
  expect(within(card).queryByRole('heading', { name: 'Skills' })).toBeNull()
  expect(within(card).queryByRole('progressbar')).toBeNull()
  expect(within(card).getByText('Learning content is coming soon.')).toBeInTheDocument()
})

it.each(['math', 'physics'])('defaults to a dense %s visual demo with empty content', (id) => {
  const size = fixtureSizeFrom(new URLSearchParams(), DEMO_STAR_COUNT)
  const map = demoStarMap(id, size, i18n.getFixedT('en', 'starmap'))
  for (const state of LEARNING_STATES) expect(map.stars.some((s) => s.state === state)).toBe(true)
  expect(map.stars.filter((s) => s.recommendation)).toHaveLength(1)
  expect(map.stars).toHaveLength(1000)
  expect(map.nebulae).toHaveLength(15)
  expect(map.prerequisites).toEqual([])
  expect(map.stars.every((s) => s.skills.length === 0 && s.chapter.lessonCount === 0 && s.chapter.nextLesson === null)).toBe(true)
  expect(map.stars[0].name).toBe('Knowledge point 1')
  expect(map.subjects.find((s) => s.subjectId === id)?.total).toBe(1000)
})

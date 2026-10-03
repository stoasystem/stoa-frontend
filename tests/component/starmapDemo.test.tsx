import { act, render, screen, within } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { DEMO_KNOWLEDGE_POINT, demoStarKind } from '@/dev/demo/sky/demoSky'
import type { FixtureSize } from '@/dev/demo/sky/demoSky'
import { demoStarMap } from '@/dev/demo/sky/demoStarMap'
// The demo-only words (the Demo notice, the placeholder star's note) come with the demo source (#131).
import '@/dev/demo/sky/source'
import { defaultSubject } from '@/features/starmap/starMapSource'
import i18n from '@/i18n'
import type { SupportedLanguage } from '@/i18n/languages'
import { DEMO_STAR_COUNT, fixtureSizeFrom } from '@/features/starmap/useStarMap'
import { LEARNING_STATES, type StarMap } from '@/features/starmap/model/starMap'
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
const mapFor = (id: string, size: FixtureSize = 10) =>
  demoStarMap(id, size, i18n.getFixedT(i18n.language, 'starmap'), { language: i18n.language as SupportedLanguage })

it('normalizes math aliases and gives unknown subjects truthful summaries', () => {
  expect(mapFor(' Mathematics ')).toEqual(mapFor('math'))
  const map = mapFor('unknown')
  expect(map.stars).toEqual([])
  expect(map.summary.total).toBe(0)
  expect(map.subjects.map((s) => [s.subjectId, s.enrolled])).toEqual([['math', true], ['physics', true], ['chemistry', false]])
})

it('keeps a subject the student does not take in the sky, with no student evidence', () => {
  const map = mapFor('chemistry', 1000)
  const topics = new Set(map.nebulae.filter((n) => n.subjectId === 'chemistry').map((n) => n.topicId))
  const own = map.stars.filter((s) => topics.has(s.nebulaId))
  expect(own.length).toBeGreaterThan(0)
  expect(map.subjects.find((s) => s.subjectId === 'chemistry')).toMatchObject({ enrolled: false, lit: 0, total: own.length })
  expect(map.summary).toMatchObject({ lit: 0, total: own.length })
  expect(own.every((s) => (s.state === 'ready' || s.state === 'locked') && !s.recommendation)).toBe(true)
})

it('hands out the whole sky whichever galaxy is in focus, the same arrays every time (#119)', () => {
  const math = mapFor('math', 1000)
  const physics = mapFor('physics', 1000)
  expect(math.stars).toHaveLength(1000)
  expect(physics.stars).toBe(math.stars)
  expect(physics.nebulae).toBe(math.nebulae)
  expect(new Set(math.nebulae.map((n) => n.subjectId))).toEqual(new Set(['math', 'physics', 'chemistry']))
  // Nebulae in band order: galaxy by galaxy, then topic order; one order across the sky.
  expect(math.nebulae.map((n) => n.order)).toEqual(math.nebulae.map((_, i) => i + 1))
  const galaxyRuns = math.nebulae.map((n) => n.subjectId).filter((id, i, all) => id !== all[i - 1])
  expect(galaxyRuns).toEqual(['math', 'physics', 'chemistry'])
  expect([math.subject.subjectId, physics.subject.subjectId]).toEqual(['math', 'physics'])
  expect(physics.summary).toMatchObject({ lit: physics.subjects[1].lit, total: physics.subjects[1].total })
})

it.each(['de', 'en', 'fr', 'it'] as const)('names every subject, nebula and star in %s', async (language) => {
  await i18n.changeLanguage(language)
  for (const id of ['math', 'physics', 'chemistry']) {
    const map = mapFor(id)
    const labels = [map.subject.name, ...map.nebulae.map((n) => n.name), ...map.subjects.map((s) => s.name),
      ...map.stars.flatMap((s) => [s.name, ...s.skills.map((skill) => skill.name), ...(s.chapter.nextLesson ? [s.chapter.nextLesson.title] : [])])]
    for (const label of labels) {
      expect(label).not.toContain('demo.')
      expect(label.trim()).not.toBe('')
    }
  }
  const point = mapFor('math').stars.find((s) => s.unitId === DEMO_KNOWLEDGE_POINT.unitId)
  expect(point?.name).toBe(DEMO_KNOWLEDGE_POINT.name[language])
  expect(point?.chapter.nextLesson?.title).toBe(DEMO_KNOWLEDGE_POINT.lessons[DEMO_KNOWLEDGE_POINT.lessonsDone].title[language])
})

it('keeps account preferences separate and falls back to the first subject the student takes', async () => {
  const subjects = mapFor('math').subjects
  useStarMapStore.setState({ lastSubjects: {} })
  useStarMapStore.getState().remember('a', 'physics')
  useStarMapStore.getState().remember('b', 'math')
  await useStarMapStore.persist.rehydrate()
  expect(useStarMapStore.getState().lastSubjects).toEqual({ a: 'physics', b: 'math' })
  expect(defaultSubject(useStarMapStore.getState().lastSubjects.a, subjects)).toBe('physics')
  expect(defaultSubject(undefined, [subjects[2], subjects[1], subjects[0]])).toBe('physics')
  expect(defaultSubject('removed', subjects)).toBe('math')
  expect(defaultSubject('chemistry', subjects)).toBe('chemistry')
  useStarMapStore.setState({ lastSubjects: {} })
})

function showCard(map: StarMap, nebulaId: string, unitId: string) {
  const clock = fakeClock()
  render(<I18nextProvider i18n={i18n}><MemoryRouter><div data-surface="sky">
   <StarMapView demo map={map} target={{ layer: 'star', nebulaId, unitId }}
     onNavigate={vi.fn()} scheduler={clock} createRendererFor={() => recordingRenderer()} />
  </div></MemoryRouter></I18nextProvider>)
  act(() => clock.advance(20))
}

it('says a placeholder star is demo content, with no chapter, and offers review as coming soon', () => {
  const map = mapFor('math')
  const star = map.stars.find((s) => s.reviewDue > 0 && s.skills.length > 0)!
  expect(demoStarKind(star.unitId)).toBe('placeholder')
  showCard(map, star.nebulaId, star.unitId)
  expect(screen.getByText('Demo · Sample content and progress')).toBeInTheDocument()
  const card = screen.getByRole('article', { name: star.name })
  expect(within(card).getByRole('button', { name: i18n.t('star.review', { ns: 'starmap', count: star.reviewDue }) })).toBeDisabled()
  expect(within(card).getByText('Coming soon')).toBeInTheDocument()
  expect(within(card).queryByRole('link', { name: 'Open chapter' })).toBeNull()
  expect(within(card).getByRole('heading', { name: 'Skills' })).toBeInTheDocument()
  expect(within(card).queryByRole('progressbar')).toBeNull()
  expect(within(card).getByText('Placeholder star · demo content, no chapter.')).toBeInTheDocument()
})

it('opens the chapter of the demo knowledge point', () => {
  const map = mapFor('math')
  const point = map.stars.find((s) => s.unitId === DEMO_KNOWLEDGE_POINT.unitId)!
  expect(demoStarKind(point.unitId)).toBe('knowledge_point')
  showCard(map, point.nebulaId, point.unitId)
  const card = screen.getByRole('article', { name: point.name })
  expect(within(card).getByRole('link', { name: 'Continue' })).toHaveAttribute('href', `/chapter/${DEMO_KNOWLEDGE_POINT.unitId}`)
  expect(within(card).getByRole('progressbar')).toBeInTheDocument()
  expect(within(card).getByText('Suggested next')).toBeInTheDocument()
  expect(within(card).queryByText('Placeholder star · demo content, no chapter.')).toBeNull()
})

it.each(['math', 'physics'])('defaults to the %s galaxy of the 1000-star sky, placeholder stars but for one', (id) => {
  const size = fixtureSizeFrom(new URLSearchParams(), DEMO_STAR_COUNT)
  expect(size).toBe(1000)
  const map = demoStarMap(id, size, i18n.getFixedT('en', 'starmap'))
  const topics = new Set(map.nebulae.filter((n) => n.subjectId === id).map((n) => n.topicId))
  const own = map.stars.filter((s) => topics.has(s.nebulaId))
  for (const state of LEARNING_STATES) expect(own.some((s) => s.state === state)).toBe(true)
  expect(own.filter((s) => s.recommendation)).toHaveLength(1)
  expect(own.length).toBe(map.subjects.find((s) => s.subjectId === id)?.total)
  expect(map.summary.total).toBe(own.length)
  expect(own.length).toBeGreaterThan(250)
  expect(map.subjects.reduce((sum, s) => sum + s.total, 0)).toBe(1000)
  expect(map.prerequisites).toEqual([])
  const withChapter = own.filter((s) => s.chapter.lessonCount > 0).map((s) => s.unitId)
  expect(withChapter).toEqual(id === 'math' ? [DEMO_KNOWLEDGE_POINT.unitId] : [])
  for (const star of map.stars) {
    expect(star.x).toBeGreaterThanOrEqual(0)
    expect(star.x).toBeLessThanOrEqual(1)
  }
})

it('shows the sky’s prerequisites, across subjects too, when relations are asked for', () => {
  const map = demoStarMap('physics', 1000, i18n.getFixedT('en', 'starmap'), { relations: true })
  const units = new Set(map.stars.map((s) => s.unitId))
  expect(map.prerequisites.length).toBeGreaterThan(0)
  for (const edge of map.prerequisites) {
    expect(units.has(edge.from)).toBe(true)
    expect(units.has(edge.to)).toBe(true)
  }
  expect(map.prerequisites).toContainEqual({ from: DEMO_KNOWLEDGE_POINT.unitId, to: 'demo-refraction' })
})

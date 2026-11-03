/*
 * Prerequisites no longer lock a knowledge point (#484, ADR 0004, backend
 * stoa-backend#125): three learning states, and 前置未点亮 laid over them as
 * a suggestion of what to learn first.
 *
 *   - the read model's `unlitPrerequisiteIds` reaches the map as sent, in the
 *     order stated; a backend from before it (`locked`, no list) is read as
 *     ready, with the list worked out from the edges, and nothing breaks;
 *   - a ready star with prerequisites not lit is drawn waiting, a started one
 *     as in progress, and assistive technology hears the marker;
 *   - the star's card opens the chapter all the same, and lists what to learn
 *     first, each a link to its star;
 *   - the copy is in all four languages, and no "locked" is left to say.
 *
 * The chapter, the lessons and the lesson quiz opening for such a point are
 * in `chapterStage` and `lessonQuiz`.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { render, screen, within } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { StarCard } from '@/features/starmap/components/StarCard'
import { starLabel } from '@/features/starmap/components/labels'
import { LEARNING_STATES, starLook, type Star, type StarMap } from '@/features/starmap/model/starMap'
import { projectStarMap } from '@/features/starmap/readModelSource'
import i18n from '@/i18n'
import type { KnowledgeMapResponse } from '@/types/practice'

type ResponseStar = KnowledgeMapResponse['stars'][number]

function responseStar(unitId: string, state: ResponseStar['state'], extra: Partial<ResponseStar> = {}): ResponseStar {
  return {
    unitId,
    name: unitId,
    nebulaId: 'algebra',
    order: 1,
    state,
    progress: 0,
    unmetExercises: 0,
    reviewDue: 0,
    recommendation: null,
    x: 0,
    y: 0,
    skills: [],
    chapter: { lessonCount: 3, lessonsDone: 0, nextLesson: { lessonId: `${unitId}-l1`, title: 'First steps' } },
    ...extra,
  }
}

function response(stars: ResponseStar[], prerequisites: KnowledgeMapResponse['prerequisites'] = []): KnowledgeMapResponse {
  return {
    subjectId: 'math',
    galaxies: [{ subjectId: 'math', name: 'Maths', lit: 0, total: stars.length, enrolled: true }],
    nebulae: [{ topicId: 'algebra', name: 'Algebra', order: 1, subjectId: 'math' }],
    stars,
    prerequisites,
    summary: { lit: 0, total: stars.length, streakDays: 0, score: 0 },
  }
}

const project = (sky: KnowledgeMapResponse) => projectStarMap(sky, { subjectId: 'math' } as never)
const starOf = (map: StarMap, unitId: string) => map.stars.find((star) => star.unitId === unitId)!

describe('the read model (stoa-backend#125)', () => {
  it('passes the unlit prerequisites through as sent, in the order stated', () => {
    const map = project(
      response([
        responseStar('fractions', 'ready'),
        responseStar('decimals', 'in_progress'),
        responseStar('equations', 'ready', { unlitPrerequisiteIds: ['decimals', 'fractions'] }),
      ]),
    )
    expect(starOf(map, 'equations')).toMatchObject({ state: 'ready', unlitPrerequisiteIds: ['decimals', 'fractions'] })
  })

  it('reads a backend from before it: locked is ready, and what it waits on comes from the edges', () => {
    const map = project(
      response(
        [responseStar('numbers', 'lit'), responseStar('fractions', 'ready'), responseStar('equations', 'locked')],
        [
          { from: 'numbers', to: 'equations' },
          { from: 'fractions', to: 'equations' },
        ],
      ),
    )
    expect(starOf(map, 'equations')).toMatchObject({ state: 'ready', unlitPrerequisiteIds: ['fractions'] })
    expect(starOf(map, 'numbers').unlitPrerequisiteIds).toEqual([])
    expect(map.stars.every((star) => (LEARNING_STATES as readonly string[]).includes(star.state))).toBe(true)
  })
})

describe('how a star is drawn and read out', () => {
  const star = (state: Star['state'], unlitPrerequisiteIds: string[]) => ({ state, unlitPrerequisiteIds })

  it('draws a ready star that waits on prerequisites quieter, and a started one as in progress', () => {
    expect(starLook(star('ready', ['a']))).toBe('waiting')
    expect(starLook(star('ready', []))).toBe('ready')
    expect(starLook(star('in_progress', ['a']))).toBe('in_progress')
    expect(starLook(star('lit', []))).toBe('lit')
  })

  it('says it waits, after its state, to assistive technology', () => {
    const map = project(response([responseStar('fractions', 'ready'), responseStar('equations', 'ready', { unlitPrerequisiteIds: ['fractions'] })]))
    const t = i18n.getFixedT('en', 'starmap')
    expect(starLabel(t, starOf(map, 'equations'))).toBe('equations, Ready to start, 0% of lessons done, Builds on stars not lit yet')
    expect(starLabel(t, starOf(map, 'fractions'))).toBe('fractions, Ready to start, 0% of lessons done')
  })
})

describe('the star’s card', () => {
  function showCard(map: StarMap, unitId: string) {
    const star = starOf(map, unitId)
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <StarCard map={map} star={star} nebula={map.nebulae[0]} reducedMotion />
        </MemoryRouter>
      </I18nextProvider>,
    )
    return screen.getByRole('article', { name: unitId })
  }

  it('opens the chapter of a star that waits, and lists what to learn first as links, in order', () => {
    const map = project(
      response([
        responseStar('fractions', 'ready'),
        responseStar('decimals', 'in_progress'),
        responseStar('equations', 'ready', { unlitPrerequisiteIds: ['decimals', 'gone', 'fractions'] }),
      ]),
    )
    const card = showCard(map, 'equations')
    expect(within(card).getByRole('link', { name: 'Start' })).toHaveAttribute('href', '/chapter/equations')
    expect(within(card).getByText('Next lesson: First steps')).toBeInTheDocument()
    const section = within(card).getByRole('heading', { name: 'Best learned first' }).closest('section')!
    // One the sky does not hold has nowhere to lead and is left out.
    expect(within(section).getAllByRole('link').map((link) => link.textContent)).toEqual(['decimals', 'fractions'])
    expect(within(section).getByRole('link', { name: 'fractions' })).toHaveAttribute('href', '/map/math/algebra/fractions')
  })

  it('lists nothing to learn first for a star with all its prerequisites lit', () => {
    const map = project(response([responseStar('equations', 'in_progress', { unlitPrerequisiteIds: [] })]))
    const card = showCard(map, 'equations')
    expect(within(card).queryByRole('heading', { name: 'Best learned first' })).toBeNull()
    expect(within(card).getByRole('link', { name: 'Continue' })).toHaveAttribute('href', '/chapter/equations')
  })
})

describe('the copy', () => {
  const bundle = (language: string, namespace: string) =>
    JSON.parse(readFileSync(path.resolve(__dirname, `../../src/i18n/locales/${language}/${namespace}.json`), 'utf8'))

  it('says what to learn first and what waiting means in all four languages, each its own words', () => {
    const english = { first: bundle('en', 'chapter').chapter.firstLearn, waiting: bundle('en', 'starmap').legend.waiting }
    for (const language of ['de', 'fr', 'it']) {
      const chapter = bundle(language, 'chapter')
      const starmap = bundle(language, 'starmap')
      expect(chapter.chapter.firstLearn, language).toBeTruthy()
      expect(chapter.chapter.firstLearn, language).not.toBe(english.first)
      expect(starmap.star.prerequisites, language).toBe(chapter.chapter.firstLearn)
      expect(starmap.legend.waiting, language).toBeTruthy()
      expect(starmap.legend.waiting, language).not.toBe(english.waiting)
    }
  })

  it('has no word left for a locked star, lesson or refusal', () => {
    for (const language of ['de', 'en', 'fr', 'it']) {
      const chapter = bundle(language, 'chapter')
      const starmap = bundle(language, 'starmap')
      expect(starmap.state.locked, language).toBeUndefined()
      expect(chapter.chapter.locked, language).toBeUndefined()
      expect(chapter.chapter.status.locked, language).toBeUndefined()
      expect(chapter.stage.locked, language).toBeUndefined()
      expect(chapter.stage.trouble.locked, language).toBeUndefined()
    }
  })
})

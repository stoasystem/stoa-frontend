/**
 * Finding a star (#489): the missing stars and the first one (#478).
 *
 * From the target star back along its prerequisites, every star not lit --
 * forks and prerequisites in other subjects too, each once, loops guarded;
 * the first missing star is the one on the outer edge (its prerequisites all
 * lit), first in course order. A lit target or one with nothing missing has
 * no path.
 */
import { describe, expect, it } from 'vitest'
import { findStarPath, missingStars } from '@/features/starmap/model/missingStars'
import type { LearningState, Prerequisite, Star, StarMap } from '@/features/starmap/model/starMap'

function star(unitId: string, nebulaId: string, order: number, state: LearningState = 'ready'): Star {
  return {
    unitId,
    name: unitId,
    nebulaId,
    order,
    state,
    progress: state === 'lit' ? 1 : 0,
    unmetExercises: 0,
    reviewDue: 0,
    recommendation: null,
    x: 0.5,
    y: 0.5,
    skills: [],
    chapter: { lessonCount: 1, lessonsDone: 0, nextLesson: null },
    unlitPrerequisiteIds: [],
  }
}

const edge = (from: string, to: string): Prerequisite => ({ from, to })

/**
 * Two subjects. Maths: algebra (order 1) a1..a4, geometry (order 2) g1, g2.
 * Physics: mechanics (order 3) p1, p2. The target, p2, needs p1 (physics) and
 * a4 (maths, across subjects); a4 needs a3 and g1 (a fork across nebulae);
 * a3 needs a2, a2 needs a1 (lit); g2 needs g1.
 */
function map(states: Partial<Record<string, LearningState>> = {}, prerequisites?: Prerequisite[]): Pick<StarMap, 'stars' | 'nebulae' | 'prerequisites'> {
  const s = (id: string, nebula: string, order: number, fallback: LearningState = 'ready') => star(id, nebula, order, states[id] ?? fallback)
  return {
    nebulae: [
      { topicId: 'algebra', name: 'Algebra', order: 1, subjectId: 'math' },
      { topicId: 'geometry', name: 'Geometry', order: 2, subjectId: 'math' },
      { topicId: 'mechanics', name: 'Mechanics', order: 3, subjectId: 'physics' },
    ],
    stars: [
      s('a1', 'algebra', 1, 'lit'),
      s('a2', 'algebra', 2),
      s('a3', 'algebra', 3),
      s('a4', 'algebra', 4),
      s('g1', 'geometry', 1),
      s('g2', 'geometry', 2),
      s('p1', 'mechanics', 1),
      s('p2', 'mechanics', 2),
    ],
    prerequisites: prerequisites ?? [
      edge('a1', 'a2'),
      edge('a2', 'a3'),
      edge('a3', 'a4'),
      edge('g1', 'a4'),
      edge('a4', 'p2'),
      edge('p1', 'p2'),
      edge('g1', 'g2'),
    ],
  }
}

describe('the missing stars (#478 point 2)', () => {
  it('are every star not lit back along the prerequisites: forks and other subjects too, in course order', () => {
    // a4 is maths, p2 physics: across subjects. a4 forks into a3 and g1. a1 is lit: the walk stops there.
    expect(missingStars(map(), 'p2')).toEqual(['a2', 'a3', 'a4', 'g1', 'p1'])
  })

  it('leave out stars that only follow the path (g2 needs g1, the target does not need g2)', () => {
    expect(missingStars(map(), 'p2')).not.toContain('g2')
  })

  it('stop at a lit star: what is behind it is covered by it', () => {
    // a3 lit: a2 behind it is not missing, though it is not lit.
    expect(missingStars(map({ a3: 'lit' }), 'p2')).toEqual(['a4', 'g1', 'p1'])
  })

  it('count a star in progress as missing: it is not lit yet', () => {
    expect(missingStars(map({ p1: 'in_progress' }), 'p2')).toContain('p1')
  })

  it('are none for a lit target, one with every prerequisite lit, and a star the map does not hold', () => {
    expect(missingStars(map({ p2: 'lit' }), 'p2')).toEqual([])
    expect(missingStars(map({ a4: 'lit', p1: 'lit' }), 'p2')).toEqual([])
    expect(missingStars(map(), 'a1')).toEqual([])
    expect(missingStars(map(), 'not-on-the-map')).toEqual([])
  })

  it('follow the unlit prerequisites a star names itself, where the sky was read without its edges', () => {
    const sky = map({}, [])
    const named: Record<string, string[]> = { p2: ['a4', 'p1'], a4: ['a3', 'g1'], a3: ['a2'] }
    sky.stars = sky.stars.map((s) => ({ ...s, unlitPrerequisiteIds: named[s.unitId] ?? [] }))
    expect(missingStars(sky, 'p2')).toEqual(['a2', 'a3', 'a4', 'g1', 'p1'])
    expect(findStarPath(sky, 'p2')!.edges).toEqual([edge('a2', 'a3'), edge('a3', 'a4'), edge('g1', 'a4'), edge('a4', 'p2'), edge('p1', 'p2')])
  })

  it('name each star once where two ways lead to it, and never the target, loops included', () => {
    const loop = [edge('a2', 'a3'), edge('a3', 'a2'), edge('a3', 'p2'), edge('a2', 'p2'), edge('p2', 'a2'), edge('p2', 'p2')]
    expect(missingStars(map({}, loop), 'p2')).toEqual(['a2', 'a3'])
  })
})

describe('the first missing star (#478 point 2)', () => {
  it('is on the outer edge -- its prerequisites all lit -- first in course order', () => {
    // On the edge: a2 (a1 lit), g1 and p1 (none). a2 comes first in course order.
    expect(findStarPath(map(), 'p2')!.first).toBe('a2')
  })

  it('goes by course order across nebulae and subjects, not by the order prerequisites are listed', () => {
    // a2 lit: on the edge are a3 (algebra), g1 (geometry), p1 (mechanics); listed physics first.
    const listed = [edge('p1', 'p2'), edge('g1', 'a4'), edge('a2', 'a3'), edge('a3', 'a4'), edge('a4', 'p2')]
    expect(findStarPath(map({ a2: 'lit' }, listed), 'p2')!.first).toBe('a3')
  })

  it('is never a missing star whose own prerequisite is missing, even first in course order', () => {
    // a3 (algebra) is first in course order of what is missing, but needs g1 (geometry), which is not lit.
    const path = findStarPath(map({}, [edge('g1', 'a3'), edge('a3', 'p2')]), 'p2')!
    expect(path.missing).toEqual(['a3', 'g1'])
    expect(path.first).toBe('g1')
  })

  it('is the first in course order where a loop leaves no star on the edge', () => {
    const loop = [edge('a2', 'a3'), edge('a3', 'a2'), edge('a3', 'p2')]
    expect(findStarPath(map({}, loop), 'p2')!.first).toBe('a2')
  })
})

describe('the path', () => {
  it('holds the prerequisites from a missing star into another or into the target, none leading off it', () => {
    const path = findStarPath(map(), 'p2')!
    expect(path.target).toBe('p2')
    expect(path.edges).toEqual([edge('a2', 'a3'), edge('a3', 'a4'), edge('g1', 'a4'), edge('a4', 'p2'), edge('p1', 'p2')])
  })

  it('is null for a lit target and for one with nothing missing', () => {
    expect(findStarPath(map({ p2: 'lit' }), 'p2')).toBeNull()
    expect(findStarPath(map({ a4: 'lit', p1: 'lit' }), 'p2')).toBeNull()
  })
})

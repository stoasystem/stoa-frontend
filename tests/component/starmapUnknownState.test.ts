/**
 * A learning state this front end does not know yet (a newer backend's) is
 * drawn as ready, as its card offers it ("Start"), not as lit (#368):
 * `indexOf`'s -1 clamped to index 0 painted it gold, as though the student
 * had lit it.
 */
import { describe, expect, it } from 'vitest'
import { StarMapEngine } from '@/features/starmap/engine/starMapEngine'
import { LEARNING_STATES, orderedStars, type LearningState, type StarMap } from '@/features/starmap/model/starMap'
import { STATE_IN_PROGRESS, STATE_LIT, STATE_WAITING, STATE_READY, type SceneData } from '@/features/starmap/render/types'
import { fakeClock, recordingRenderer, skyMap, THEME } from './starmapHarness'

/** The scene the engine hands its renderer for `map`. */
function sceneOf(map: StarMap): SceneData {
  const clock = fakeClock()
  let scene: SceneData | undefined
  const renderer = { ...recordingRenderer(), setData: (data: SceneData) => void (scene = data) }
  const engine = new StarMapEngine({ renderer, theme: THEME, reducedMotion: true, scheduler: clock, now: clock.now, galaxy: true })
  engine.setViewport(1280, 776, 1, { top: 76, bottom: 164 })
  engine.setData(map, { layer: 'map' })
  engine.destroy()
  expect(scene).toBeDefined()
  return scene!
}

/** `map` with its stars, in the engine's order, given these states one by one. */
function withStates(map: StarMap, states: string[]): StarMap {
  const order = orderedStars(map).map((star) => star.unitId)
  const stateOf = new Map(order.map((unitId, i) => [unitId, states[i % states.length] as LearningState]))
  return { ...map, stars: map.stars.map((star) => ({ ...star, state: stateOf.get(star.unitId)! })) }
}

describe('drawing a learning state the front end does not know (#368)', () => {
  it('draws the four states it knows as themselves', () => {
    const map = withStates(skyMap(10, 'math'), [...LEARNING_STATES])
    const scene = sceneOf(map)
    const expected = { lit: STATE_LIT, in_progress: STATE_IN_PROGRESS, ready: STATE_READY, locked: STATE_WAITING }
    orderedStars(map).forEach((star, i) => expect(scene.state[i]).toBe(expected[star.state]))
  })

  it('draws one it does not know as ready, never as lit', () => {
    const states = ['mastered', 'lit', '', 'LIT', 'locked']
    const map = withStates(skyMap(10, 'math'), states)
    const scene = sceneOf(map)
    orderedStars(map).forEach((star, i) => {
      const known = (LEARNING_STATES as readonly string[]).includes(star.state)
      expect(scene.state[i]).toBe(known ? LEARNING_STATES.indexOf(star.state) : STATE_READY)
    })
    // Every unknown one is among them, and none of them came out gold.
    const unknown = orderedStars(map).flatMap((star, i) => ((LEARNING_STATES as readonly string[]).includes(star.state) ? [] : [i]))
    expect(unknown.length).toBeGreaterThan(2)
    for (const i of unknown) expect(scene.state[i]).not.toBe(STATE_LIT)
  })
})

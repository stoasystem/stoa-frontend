/**
 * A frame clock and a renderer the planet tests can see into (#47): frames
 * run only when a test advances time, and every frame the engine hands over
 * is kept.
 */
import type { FrameScheduler } from '@/features/planet/engine/planetEngine'
import type { PlanetRenderer, SceneFrame } from '@/features/planet/render/types'

export type FakeClock = FrameScheduler & {
  now: () => number
  /** Run every frame due in the next `ms`, at 60 Hz. */
  advance: (ms: number) => void
  readonly pending: number
}

export function fakeClock(): FakeClock {
  let time = 0
  let next = 1
  const queue = new Map<number, (now: number) => void>()
  return {
    now: () => time,
    request(callback) {
      const handle = next
      next += 1
      queue.set(handle, callback)
      return handle
    },
    cancel(handle) {
      queue.delete(handle)
    },
    advance(ms) {
      const end = time + ms
      while (time < end) {
        time = Math.min(end, time + 1000 / 60)
        const due = [...queue.values()]
        queue.clear()
        for (const callback of due) callback(time)
      }
    },
    get pending() {
      return queue.size
    },
  }
}

export type RecordingRenderer = PlanetRenderer & {
  frames: SceneFrame[]
  snapshots: number
  /** The breathing of the last frame, copied (the engine reuses its arrays). */
  lastBreathScale: number[]
}

export function recordingRenderer(): RecordingRenderer {
  const renderer: RecordingRenderer = {
    kind: 'canvas2d',
    frames: [],
    snapshots: 0,
    lastBreathScale: [],
    resize() {},
    setTheme() {},
    setData() {},
    draw(frame) {
      renderer.frames.push({ ...frame })
      renderer.lastBreathScale = Array.from(frame.breathScale)
    },
    snapshot() {
      renderer.snapshots += 1
    },
    destroy() {},
  }
  return renderer
}

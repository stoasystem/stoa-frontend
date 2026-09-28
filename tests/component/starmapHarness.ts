/**
 * Test doubles for the star map (#47, #72): a frame clock that runs only when
 * a test advances time, a renderer that keeps every frame the engine hands
 * it, and a fake 2D canvas for driving the real Canvas 2D renderer in jsdom.
 */
import type { FrameScheduler } from '@/features/starmap/engine/starMapEngine'
import type { SceneFrame, StarMapRenderer, StarMapTheme } from '@/features/starmap/render/types'

export const THEME: StarMapTheme = {
  sky: '#0A1020',
  atmosphere: 'rgba(120, 160, 255, 0.16)',
  lit: '#F2C572',
  litCore: '#FFF8EA',
  text: '#FFFFFF',
  textBody: 'rgba(255, 255, 255, 0.75)',
  textCaption: 'rgba(255, 255, 255, 0.65)',
  fontFamily: 'sans-serif',
}

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

/** A frame as the renderer got it, with its arrays copied (the engine reuses them). */
export type RecordedFrame = Omit<SceneFrame, 'x' | 'y' | 'starAlpha' | 'sharpness' | 'nebulaX' | 'nebulaY' | 'nebulaR'> & {
  x: number[]
  y: number[]
  starAlpha: number[]
  sharpness: number[]
  nebulaX: number[]
  nebulaY: number[]
  nebulaR: number[]
}

export type RecordingRenderer = StarMapRenderer & { frames: RecordedFrame[]; snapshots: number; ratios: number[]; last: () => RecordedFrame }

export function recordingRenderer(): RecordingRenderer {
  const renderer: RecordingRenderer = {
    kind: 'canvas2d',
    stats: { frames: 0, starDraws: 0, tileDraws: 0, tilePaints: 0, highlightNebula: -1 },
    frames: [],
    snapshots: 0,
    ratios: [],
    last: () => renderer.frames[renderer.frames.length - 1],
    resize(_viewport, dpr) {
      renderer.ratios.push(dpr)
    },
    setTheme() {},
    setData() {},
    draw(frame) {
      renderer.frames.push({
        ...frame,
        x: Array.from(frame.x),
        y: Array.from(frame.y),
        starAlpha: Array.from(frame.starAlpha),
        sharpness: Array.from(frame.sharpness),
        nebulaX: Array.from(frame.nebulaX),
        nebulaY: Array.from(frame.nebulaY),
        nebulaR: Array.from(frame.nebulaR),
      })
    },
    snapshot() {
      renderer.snapshots += 1
    },
    destroy() {},
  }
  return renderer
}

export type CanvasCounter = { drawImage: number; filterSets: number; texts?: { text: string; x: number; y: number }[] }

/** A 2D context that accepts every call, counts `drawImage`, and counts any `filter` set. */
export function fakeContext(counter: CanvasCounter) {
  const store: Record<string | symbol, unknown> = {}
  const gradient = { addColorStop() {} }
  return new Proxy(store, {
    get(target, prop) {
      if (prop in target) return target[prop]
      if (prop === 'createRadialGradient' || prop === 'createLinearGradient') return () => gradient
      if (prop === 'measureText') return (text: string) => ({ width: 7 * String(text).length })
      if (prop === 'drawImage') return () => (counter.drawImage += 1)
      if (prop === 'fillText') return (text: string, x: number, y: number) => counter.texts?.push({ text, x, y })
      return () => undefined
    },
    set(target, prop, value) {
      if (prop === 'filter') counter.filterSets += 1
      target[prop] = value
      return true
    },
    has(target, prop) {
      return prop in target
    },
  }) as unknown as CanvasRenderingContext2D
}

/** A canvas whose context is `fakeContext`. */
export function fakeCanvas(counter: CanvasCounter, width = 1, height = 1): HTMLCanvasElement {
  const context = fakeContext(counter)
  return { width, height, getContext: () => context } as unknown as HTMLCanvasElement
}

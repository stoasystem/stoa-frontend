/*
 * What moves on the planet, and what stops under `prefers-reduced-motion`
 * (#11 point 6; canvas board "Motion and states").
 *
 * Reduced motion keeps rotation that follows the student's own hand, and
 * takes away everything that moves by itself: inertia, the idle drift, the
 * breathing of lit stars. Changing layer becomes a 200 ms linear crossfade
 * instead of a zoom flight. Every animation on the planet reads this one
 * policy, so there is one place to get it right.
 */

export type LayerTransition = 'zoom' | 'crossfade'

export type MotionPolicy = {
  inertia: boolean
  autoRotate: boolean
  breathing: boolean
  layerTransition: LayerTransition
  /** How long a layer change takes, ms. */
  layerMs: number
}

/** Motion tokens: zoom planet <-> region 420 ms; reduced motion 200 ms linear. */
export const ZOOM_MS = 420
export const CROSSFADE_MS = 200

export function motionPolicy(reducedMotion: boolean): MotionPolicy {
  if (reducedMotion) {
    return { inertia: false, autoRotate: false, breathing: false, layerTransition: 'crossfade', layerMs: CROSSFADE_MS }
  }
  return { inertia: true, autoRotate: true, breathing: true, layerTransition: 'zoom', layerMs: ZOOM_MS }
}

/**
 * The idle drift: a slow turn when the planet first opens, so it reads as a
 * globe. It stops at the first touch and never runs longer than five seconds
 * (WCAG 2.2.2 needs no pause control for motion that short).
 */
export const AUTO_ROTATE = {
  /** Degrees per second about the planet's axis. */
  speed: 6,
  durationMs: 5000,
  /** The last part eases out rather than stopping dead. */
  easeOutMs: 1200,
} as const

/** Breathe (lit stars): 2.8-4.2 s, scale 1 -> 1.14, opacity .82 -> 1, phase from position. */
export const BREATHE = {
  minPeriodMs: 2800,
  maxPeriodMs: 4200,
  scaleFrom: 1,
  scaleTo: 1.14,
  alphaFrom: 0.82,
  alphaTo: 1,
} as const

/** A stable per-point phase and period from its position, as the board asks. */
export function breathingOf(lat: number, lng: number): { periodMs: number; phase: number } {
  // Cheap, deterministic hash of the coordinates to [0, 1).
  const h = Math.abs(Math.sin(lat * 12.9898 + lng * 78.233) * 43758.5453) % 1
  const h2 = Math.abs(Math.sin(lat * 39.3468 + lng * 11.135) * 24634.6345) % 1
  return {
    periodMs: BREATHE.minPeriodMs + (BREATHE.maxPeriodMs - BREATHE.minPeriodMs) * h,
    phase: h2,
  }
}

/**
 * The breath at `timeMs`: an ease-in-out swell between the board's two
 * key frames. `still` is what reduced motion draws: the full star, not moving.
 */
export function breathAt(timeMs: number, periodMs: number, phase: number): { scale: number; alpha: number } {
  const cycle = (timeMs / periodMs + phase) % 1
  // 0 -> 1 -> 0 over one period, sinusoidal (ease-in-out at both ends).
  const swell = 0.5 - 0.5 * Math.cos(cycle * 2 * Math.PI)
  return {
    scale: BREATHE.scaleFrom + (BREATHE.scaleTo - BREATHE.scaleFrom) * swell,
    alpha: BREATHE.alphaFrom + (BREATHE.alphaTo - BREATHE.alphaFrom) * swell,
  }
}

export const STILL_BREATH = { scale: 1, alpha: 1 } as const

/** cubic-bezier(x1, y1, x2, y2) as an easing function of t in [0, 1]. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const ax = 3 * x1 - 3 * x2 + 1
  const bx = 3 * x2 - 6 * x1
  const cx = 3 * x1
  const ay = 3 * y1 - 3 * y2 + 1
  const by = 3 * y2 - 6 * y1
  const cy = 3 * y1
  const sampleX = (s: number) => ((ax * s + bx) * s + cx) * s
  const sampleY = (s: number) => ((ay * s + by) * s + cy) * s
  const slopeX = (s: number) => (3 * ax * s + 2 * bx) * s + cx
  return (t: number) => {
    if (t <= 0) return 0
    if (t >= 1) return 1
    let s = t
    for (let i = 0; i < 8; i += 1) {
      const error = sampleX(s) - t
      if (Math.abs(error) < 1e-6) break
      const slope = slopeX(s)
      if (Math.abs(slope) < 1e-6) break
      s -= error / slope
    }
    return sampleY(Math.max(0, Math.min(1, s)))
  }
}

/** --ease-standard: cubic-bezier(.2, .8, .2, 1), used for the zoom. */
export const easeStandard = cubicBezier(0.2, 0.8, 0.2, 1)

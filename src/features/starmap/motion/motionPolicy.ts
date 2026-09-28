/*
 * What moves on the star map, and what stops under `prefers-reduced-motion`
 * (#72 points 5 and 6; canvas board "Motion and states").
 *
 * Nothing moves by itself except the recommended star, which breathes. A pan
 * glides a little after release. Changing layer is a zoom flight. Reduced
 * motion keeps panning that follows the student's hand and takes the rest
 * away: no glide, no breathing, and a layer change becomes a 200 ms linear
 * crossfade. Every animation on the map reads this one policy.
 */

export type LayerTransition = 'zoom' | 'crossfade'

export type MotionPolicy = {
  inertia: boolean
  breathing: boolean
  layerTransition: LayerTransition
  /** How long a layer change takes, ms. */
  layerMs: number
}

/** Motion tokens: zoom 420 ms; reduced motion 200 ms linear. */
export const ZOOM_MS = 420
export const CROSSFADE_MS = 200

export function motionPolicy(reducedMotion: boolean): MotionPolicy {
  if (reducedMotion) return { inertia: false, breathing: false, layerTransition: 'crossfade', layerMs: CROSSFADE_MS }
  return { inertia: true, breathing: true, layerTransition: 'zoom', layerMs: ZOOM_MS }
}

/** Breathe: 2.8-4.2 s, scale 1 -> 1.14, opacity .82 -> 1 (Motion board). One star only. */
export const BREATHE = {
  periodMs: 3400,
  scaleFrom: 1,
  scaleTo: 1.14,
  alphaFrom: 0.82,
  alphaTo: 1,
} as const

/** The breath at `timeMs`: an ease-in-out swell between the board's two key frames. */
export function breathAt(timeMs: number, periodMs: number = BREATHE.periodMs): { scale: number; alpha: number } {
  const cycle = (timeMs / periodMs) % 1
  const swell = 0.5 - 0.5 * Math.cos(cycle * 2 * Math.PI)
  return {
    scale: BREATHE.scaleFrom + (BREATHE.scaleTo - BREATHE.scaleFrom) * swell,
    alpha: BREATHE.alphaFrom + (BREATHE.alphaTo - BREATHE.alphaFrom) * swell,
  }
}

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

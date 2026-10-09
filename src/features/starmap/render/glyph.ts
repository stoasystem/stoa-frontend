/*
 * The star glyph, measured off the canvas board "Knowledge point glyph":
 * layers, not a disc -- halo, lens star, hairline ring, core. Two cuts:
 * `large` from the 120 box, `small` from the 18 box (small glyphs are drawn
 * bolder, and at map scale only the star and halo survive).
 *
 * The board's fifth glyph, "Next", is the recommendation marker now (#9
 * point 8): a dashed ring and faint halo laid over whatever state the star is
 * in. The board has no mark for "due for review"; `review` is a small pip at
 * the ring's upper right until the design says otherwise.
 *
 * All numbers are in the cut's own box units, measured from its centre.
 */

/**
 * The board draws a locked star as a white ring at 28%, which is 2.5:1 on the
 * sky. A locked star opens its prerequisites when tapped, so it is a control
 * and its ring must reach 3:1 (WCAG 1.4.11): 42% gives 3.8:1 on the sky and
 * 3.2:1 on the brightest nebula haze (checked in starmapContrast.test.ts).
 *
 * Its ring is the same size as a ready star's. It used to be half of it —
 * the smallest and the dimmest mark on the map — while being the state most
 * points are in, which left the whole sky looking empty at every zoom, not
 * only on the panorama. What tells the two apart is the core: a ready star
 * has one, a locked star is hollow, the same as the dots say it far out.
 */
export const LOCKED_RING_ALPHA = 0.42

export type GlyphCut = {
  box: number
  lit: { halo: number; haloAlpha: number; blur: number; tip: number; waist: number; starAlpha: number; ring: number; ringWidth: number; ringAlpha: number; core: number }
  inProgress: { halo: number; haloAlpha: number; blur: number; tip: number; waist: number; starAlpha: number; ring: number; ringWidth: number; trackAlpha: number; core: number }
  ready: { ring: number; ringWidth: number; ringAlpha: number; core: number; coreAlpha: number }
  locked: { ring: number; ringWidth: number; ringAlpha: number }
  recommended: { halo: number; haloAlpha: number; blur: number; ring: number; ringWidth: number; dash: readonly [number, number] }
  review: { offset: number; radius: number; outline: number }
}

export const GLYPH_LARGE: GlyphCut = {
  box: 120,
  lit: { halo: 46.2, haloAlpha: 0.26, blur: 6, tip: 44, waist: 15, starAlpha: 0.85, ring: 20.9, ringWidth: 1.6, ringAlpha: 0.55, core: 9.2 },
  inProgress: { halo: 52.8, haloAlpha: 0.3, blur: 6, tip: 31.9, waist: 10.8, starAlpha: 0.75, ring: 28.4, ringWidth: 3.5, trackAlpha: 0.16, core: 8.4 },
  ready: { ring: 17.6, ringWidth: 1.6, ringAlpha: 0.55, core: 4.4, coreAlpha: 0.75 },
  locked: { ring: 17.6, ringWidth: 1.6, ringAlpha: LOCKED_RING_ALPHA },
  recommended: { halo: 44, haloAlpha: 0.14, blur: 6, ring: 34, ringWidth: 1.6, dash: [4.8, 6.4] },
  review: { offset: 21, radius: 5.5, outline: 2 },
}

export const GLYPH_SMALL: GlyphCut = {
  box: 18,
  lit: { halo: 10.6, haloAlpha: 0.26, blur: 2, tip: 10.1, waist: 3.4, starAlpha: 0.85, ring: 4.8, ringWidth: 0.8, ringAlpha: 0.55, core: 2.1 },
  inProgress: { halo: 12.1, haloAlpha: 0.3, blur: 2, tip: 7.3, waist: 2.5, starAlpha: 0.75, ring: 7.8, ringWidth: 1.5, trackAlpha: 0.16, core: 1.9 },
  ready: { ring: 4, ringWidth: 0.8, ringAlpha: 0.55, core: 1, coreAlpha: 0.75 },
  locked: { ring: 4, ringWidth: 0.8, ringAlpha: LOCKED_RING_ALPHA },
  recommended: { halo: 10.1, haloAlpha: 0.14, blur: 2, ring: 8.6, ringWidth: 0.8, dash: [2.1, 2.8] },
  review: { offset: 5.6, radius: 1.8, outline: 0.8 },
}

/** Glyph boxes below this many CSS px use the small cut. */
export const SMALL_CUT_BELOW = 30

/**
 * The dot cut: what a knowledge point is far out (#109), where a full glyph
 * per star would pack a nebula solid. The states are told apart there by
 * figure, not by colour or by a tenth of a pixel of radius: the legend's
 * marks at dot scale -- a filled star, a filled star inside a ring, a ring
 * with a core, a bare ring -- so a colour-blind reader tells them by shape
 * and a sighted one finds every point at all. The recommendation (a dashed
 * ring and halo) and the review pip are laid over these as they are over the
 * glyph. Box units from the centre, in an 18 box like `GLYPH_SMALL`.
 */
export type DotCut = {
  box: number
  lit: { tip: number; waist: number; core: number }
  inProgress: { tip: number; waist: number; ring: number; ringWidth: number; core: number }
  ready: { ring: number; ringWidth: number; core: number }
  locked: { ring: number; ringWidth: number }
  /** The soft glow under a lit or in-progress dot. */
  halo: { radius: number; blur: number; alpha: number }
  review: { offset: number; radius: number; outline: number }
}

export const DOT_CUT: DotCut = {
  box: 18,
  lit: { tip: 7.7, waist: 2.7, core: 2 },
  inProgress: { tip: 5.6, waist: 1.9, ring: 7.2, ringWidth: 1.3, core: 1.7 },
  ready: { ring: 6.1, ringWidth: 1.35, core: 2.3 },
  locked: { ring: 6.5, ringWidth: 1.35 },
  halo: { radius: 4, blur: 2.2, alpha: 0.3 },
  review: { offset: 7.2, radius: 2, outline: 0.9 },
}

/**
 * A dot's box on screen, CSS px. The engine sizes it from the gap between
 * stars (`dotRadius`, capped at 2.1 for a packed nebula), which on a map of
 * ten points leaves a 2.5 px mark in a screen of room -- inside the spread of
 * the sky's own dust. Where the glyph box says there is room, the dot grows
 * with it, to `room` of it and never past `max`: still a dot, and still far
 * below the recommended star's glyph, which keeps the eye.
 */
export const DOT_BOX = { fromDot: 4, room: 0.45, max: 16 } as const

/**
 * A pressed star sinks, the way a pressed button does.
 *
 * Between the press and the page changing the sky stayed perfectly still,
 * which reads as a click that did not land. Small on purpose: this says
 * "heard you", the flight that follows says the rest.
 */
export const PRESS = { scale: 0.88, alpha: 1.15 } as const

/** The box a dot is drawn in, CSS px, from the frame's dot radius and glyph box. */
export function dotBoxFor(dotRadius: number, glyphSize: number): number {
  return Math.max(dotRadius * DOT_BOX.fromDot, Math.min(glyphSize * DOT_BOX.room, DOT_BOX.max))
}

/** The lens star: four points joined by quadratic curves pulled to the waist. */
export function starPath(tip: number, waist: number, cx = 0, cy = 0): string {
  const f = (n: number) => n.toFixed(2)
  return [
    `M${f(cx)} ${f(cy - tip)}`,
    `Q${f(cx + waist)} ${f(cy - waist)} ${f(cx + tip)} ${f(cy)}`,
    `Q${f(cx + waist)} ${f(cy + waist)} ${f(cx)} ${f(cy + tip)}`,
    `Q${f(cx - waist)} ${f(cy + waist)} ${f(cx - tip)} ${f(cy)}`,
    `Q${f(cx - waist)} ${f(cy - waist)} ${f(cx)} ${f(cy - tip)}`,
    'Z',
  ].join(' ')
}

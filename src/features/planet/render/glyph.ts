/*
 * The knowledge point glyph, measured off the canvas board "Knowledge point
 * glyph": layers, not a disc -- halo, lens star, hairline ring, core. Two
 * cuts: `large` from the 120 box, `small` from the 18 box (small glyphs are
 * drawn bolder, and at planet scale only the star and halo survive).
 *
 * The board's fifth glyph, "Next", is the recommendation marker now (#9
 * point 8): a dashed ring and faint halo laid over whatever state the point is
 * in. The board has no mark for "due for review"; `review` is a small pip at
 * the ring's upper right until the design says otherwise.
 *
 * All numbers are in the cut's own box units, measured from its centre.
 */

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
  locked: { ring: 9.2, ringWidth: 1.6, ringAlpha: 0.28 },
  recommended: { halo: 44, haloAlpha: 0.14, blur: 6, ring: 34, ringWidth: 1.6, dash: [4.8, 6.4] },
  review: { offset: 21, radius: 5.5, outline: 2 },
}

export const GLYPH_SMALL: GlyphCut = {
  box: 18,
  lit: { halo: 10.6, haloAlpha: 0.26, blur: 2, tip: 10.1, waist: 3.4, starAlpha: 0.85, ring: 4.8, ringWidth: 0.8, ringAlpha: 0.55, core: 2.1 },
  inProgress: { halo: 12.1, haloAlpha: 0.3, blur: 2, tip: 7.3, waist: 2.5, starAlpha: 0.75, ring: 7.8, ringWidth: 1.5, trackAlpha: 0.16, core: 1.9 },
  ready: { ring: 4, ringWidth: 0.8, ringAlpha: 0.55, core: 1, coreAlpha: 0.75 },
  locked: { ring: 2.1, ringWidth: 0.8, ringAlpha: 0.28 },
  recommended: { halo: 10.1, haloAlpha: 0.14, blur: 2, ring: 8.6, ringWidth: 0.8, dash: [2.1, 2.8] },
  review: { offset: 5.6, radius: 1.8, outline: 0.8 },
}

/** Glyph boxes below this many CSS px use the small cut. */
export const SMALL_CUT_BELOW = 30

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

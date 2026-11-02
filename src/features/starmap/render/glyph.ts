/*
 * The star glyph, measured off the canvas board "Knowledge point glyph":
 * layers, not a disc. Two cuts: `large` from the 120 box, `small` from the
 * 18 box (small glyphs are drawn bolder, and at map scale only the star and
 * glow survive).
 *
 * Every star is soft light, not a sticker (the design preview "B, soft
 * stars", 2026-11-02): an orb that fades from its centre instead of a disc
 * with an edge, and glows that thin to nothing. A lit star is a warm orb with
 * a faint cross of rays and a fainter violet rim far out, the dreamy part; an
 * in-progress star is a smaller warm orb inside its glowing progress ring; a
 * ready star is a cool, ice-white orb; a waiting star is a fine hollow ring
 * with a glow of its own. The shapes tell the states apart as well as the
 * colours do: rays, a ring round an orb, a bare orb, a bare ring.
 *
 * The board's fifth glyph, "Next", is the recommendation marker now (#9
 * point 8): a dashed ring and faint halo laid over whatever state the star is
 * in. "Due for review" is a small white pip at the ring's upper right
 * (`review`), decided on the canvas's Decisions board (v46, #201).
 *
 * All numbers are in the cut's own box units, measured from its centre.
 */

/**
 * The board draws a waiting star as a white ring at 28%, which is 2.5:1 on the
 * sky. A waiting star opens its prerequisites when tapped, so it is a control
 * and its ring must reach 3:1 (WCAG 1.4.11): 55% gives 6.2:1 on the sky,
 * 5.1:1 on stacked nebula haze and 4.1:1 at a fully lit nebula's core
 * (checked in starmapContrast.test.ts). Its glow is laid under the ring, so
 * the ring itself is never fainter than this.
 *
 * It reaches about as far as a ready star's orb: what tells the two apart is
 * that a ready star is filled light and a waiting one is hollow, the same as
 * the dots say it far out.
 */
export const WAITING_RING_ALPHA = 0.55

/**
 * A soft star: a `rim` of violet far out at `rimAlpha`, its own `glow`, a
 * cross of rays (four, `rayWidth` wide at the centre, tapering to `tip`),
 * the `glint`'s four shorter ones on the diagonals (none where `glint` is 0),
 * and the `orb`, light fading out from the centre over its radius.
 */
export type StarLight = {
  rim: number
  rimAlpha: number
  glow: number
  glowAlpha: number
  tip: number
  rayWidth: number
  rayAlpha: number
  glint: number
  glintWidth: number
  glintAlpha: number
  orb: number
}

/**
 * How light falls off across a glow, as [offset, alpha] stops: the curve of
 * `LoginNebula`'s glow (0.45, 0.14 at 0.4, none at the edge), scaled to a
 * fill's own alpha.
 */
export const GLOW_STOPS: readonly (readonly [number, number])[] = [
  [0, 1],
  [0.4, 0.31],
  [1, 0],
]

/** A ray's fill from the centre out: the core's white, then the star's colour, thinning to the tip. */
export const RAY_STOPS: readonly (readonly [number, 'core' | 'lit', number])[] = [
  [0, 'core', 1],
  [0.25, 'lit', 0.9],
  [1, 'lit', 0],
]

/** An orb from the centre out: its inner colour, its outer one by `ORB_TURN`, then nothing at the edge. */
export const ORB_TURN = 0.35

/** The rim and ice colours when the sky tokens `--starmap-rim` and `--starmap-ice` are absent (a test keeps them equal). */
export const STAR_INK = { rim: 'rgb(168, 150, 255)', ice: 'rgb(196, 220, 255)' } as const

/** A line drawn as light: under the fine line, one `wide` times as wide at `alpha` of its strength. */
export const LINE_GLOW = { wide: 3.2, alpha: 0.16 } as const

export type GlyphCut = {
  box: number
  lit: StarLight
  inProgress: StarLight & { ring: number; ringWidth: number; trackAlpha: number }
  ready: { rim: number; rimAlpha: number; glow: number; glowAlpha: number; orb: number; orbAlpha: number }
  waiting: { ring: number; ringWidth: number; ringAlpha: number }
  recommended: { halo: number; haloAlpha: number; blur: number; ring: number; ringWidth: number; dash: readonly [number, number] }
  review: { offset: number; radius: number; outline: number }
}

export const GLYPH_LARGE: GlyphCut = {
  box: 120,
  lit: { rim: 104, rimAlpha: 0.11, glow: 66, glowAlpha: 0.36, tip: 74, rayWidth: 2.4, rayAlpha: 0.42, glint: 34, glintWidth: 1.8, glintAlpha: 0.22, orb: 36 },
  inProgress: { rim: 84, rimAlpha: 0.08, glow: 52, glowAlpha: 0.26, tip: 44, rayWidth: 1.7, rayAlpha: 0.3, glint: 0, glintWidth: 0, glintAlpha: 0, orb: 24, ring: 44, ringWidth: 4.5, trackAlpha: 0.1 },
  ready: { rim: 74, rimAlpha: 0.1, glow: 42, glowAlpha: 0.16, orb: 24, orbAlpha: 0.9 },
  waiting: { ring: 20, ringWidth: 4.5, ringAlpha: WAITING_RING_ALPHA },
  recommended: { halo: 44, haloAlpha: 0.14, blur: 6, ring: 54, ringWidth: 2.2, dash: [6, 8] },
  review: { offset: 30, radius: 5.5, outline: 2 },
}

export const GLYPH_SMALL: GlyphCut = {
  box: 18,
  lit: { rim: 16, rimAlpha: 0.11, glow: 10.5, glowAlpha: 0.36, tip: 13.5, rayWidth: 0.6, rayAlpha: 0.5, glint: 6, glintWidth: 0.45, glintAlpha: 0.26, orb: 6.4 },
  inProgress: { rim: 13, rimAlpha: 0.08, glow: 8.5, glowAlpha: 0.26, tip: 8.5, rayWidth: 0.45, rayAlpha: 0.34, glint: 0, glintWidth: 0, glintAlpha: 0, orb: 4.4, ring: 7.6, ringWidth: 1.3, trackAlpha: 0.12 },
  ready: { rim: 12, rimAlpha: 0.1, glow: 7, glowAlpha: 0.18, orb: 4.6, orbAlpha: 0.92 },
  waiting: { ring: 3.8, ringWidth: 1.1, ringAlpha: WAITING_RING_ALPHA },
  recommended: { halo: 10.1, haloAlpha: 0.14, blur: 2, ring: 9.4, ringWidth: 0.9, dash: [2.1, 2.8] },
  review: { offset: 6, radius: 1.8, outline: 0.8 },
}

/** Glyph boxes below this many CSS px use the small cut. */
export const SMALL_CUT_BELOW = 30

/**
 * The dot cut: what a knowledge point is far out (#109), where a full glyph
 * per star would pack a nebula solid. The states are told apart there by
 * figure, not by colour or by a tenth of a pixel of radius: the legend's
 * marks at dot scale -- an orb with rays, an orb inside a ring, a bare orb,
 * a bare ring -- so a colour-blind reader tells them by shape and a sighted
 * one finds every point at all. Far out the sky should read as a field of
 * soft lights, so only the waiting star is hollow, and small. The
 * recommendation (a dashed ring and halo) and the review pip are laid over
 * these as they are over the glyph. Box units from the centre, in an 18 box
 * like `GLYPH_SMALL`.
 */
export type DotCut = {
  box: number
  lit: { tip: number; rayWidth: number; glint: number; glintWidth: number; glintAlpha: number; orb: number }
  inProgress: { orb: number; ring: number; ringWidth: number; ringAlpha: number }
  ready: { orb: number }
  waiting: { ring: number; ringWidth: number }
  /** The soft glow under a lit or in-progress dot: its own colour, and the violet rim past it. */
  halo: { radius: number; alpha: number; rim: number; rimAlpha: number }
  review: { offset: number; radius: number; outline: number }
}

export const DOT_CUT: DotCut = {
  box: 18,
  lit: { tip: 8.6, rayWidth: 0.55, glint: 4.4, glintWidth: 0.4, glintAlpha: 0.5, orb: 4.2 },
  inProgress: { orb: 3.4, ring: 5.4, ringWidth: 0.9, ringAlpha: 0.75 },
  ready: { orb: 5.4 },
  waiting: { ring: 3, ringWidth: 1.1 },
  halo: { radius: 7, alpha: 0.4, rim: 9, rimAlpha: 0.12 },
  review: { offset: 6.2, radius: 2, outline: 0.9 },
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
export const PRESS = { scale: 0.84, alpha: 1.3 } as const

/**
 * A star under the pointer lifts: it grows, brightens, and takes a ring of
 * cool light. Its name alone was the whole answer before, and a name that
 * appears somewhere beside the star does not say "this one".
 */
export const HOVER = { scale: 1.14, alpha: 1.3, ring: { gap: 1.5, pad: 4, width: 1.4, alpha: 0.7 } } as const

/**
 * The star whose card is open keeps a mark of its own, so the sky says which
 * one the card belongs to after the press is over: four arcs of gold light
 * round it, a lock-on, `gap` radians apart and turned by `turn`, with a faint
 * full ring at `inner` of their radius. It used to be a dashed gold ring,
 * which is the recommended star's mark too.
 */
export const CHOSEN = {
  ring: { gap: 1.85, pad: 6, width: 1.6, alpha: 0.9 },
  arcs: 4,
  gap: 0.44,
  turn: 0.22,
  inner: { at: 0.78, width: 0.8, alpha: 0.3 },
} as const

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

/**
 * Four thin rays from the centre, each a sliver `width` wide there and
 * tapering to a point at `tip`: up, right, down and left, or on the
 * diagonals when `diagonal`.
 */
export function rayPath(tip: number, width: number, diagonal = false): string {
  const f = (n: number) => n.toFixed(2)
  const turn = diagonal ? Math.PI / 4 : 0
  return [0, 1, 2, 3]
    .map((k) => {
      const angle = turn + (k * Math.PI) / 2
      const dx = Math.sin(angle)
      const dy = -Math.cos(angle)
      return `M${f(-dy * width)} ${f(dx * width)} L${f(dx * tip)} ${f(dy * tip)} L${f(dy * width)} ${f(-dx * width)} Z`
    })
    .join(' ')
}

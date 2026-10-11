/**
 * Where Ask sits, from the canvas (https://claude.ai/artifact/XTHszGBU78LNmon3uJjMNk):
 * Placement, rows "Planet: composer" and "Ask panel"; Motion and states, rows
 * "Panel (Ask, desktop)" and "Sheet (phone)".
 */

/** How Ask was opened, which decides its height on a phone (#49, 2026-09-28 review). */
export type AskEntry =
  /** Typing in the docked composer on the planet: the planet stays behind it. */
  | 'planet'
  /** `/ask` or `/ask/:id` opened directly (a deep link, a notification). */
  | 'direct'
  /**
   * Beside the practice stage (#50): a panel next to the exercise on a wide
   * screen; on a narrower one the composer under the stage, which raises the
   * same 72% sheet the planet does.
   */
  | 'stage'

export const ASK_PANEL = {
  /** Placement: "right, 420 wide, over the sky". */
  width: 420,
  headerHeight: 56,
  /** Motion: slides 40 px from the right and fades. */
  slideFrom: 40,
} as const

export const ASK_SHEET = {
  /** Placement: "sheet, 72% high" -- from the planet (#12 point 6), and from the stage. */
  planetHeight: '72%',
  /** Opened directly: a full-screen sheet (#13 point 1). */
  directHeight: '100%',
  grabber: { width: 36, height: 5 },
  radius: 20,
  /** Motion: "From the bottom; dim 25%". */
  dim: 0.25,
  /** Dragged further than this share of its height, the sheet closes. */
  dismissFraction: 0.25,
} as const

export const DOCKED_COMPOSER = {
  /** Placement: "bottom 22, width 640, centred". */
  desktop: { bottom: 22, width: 640 },
  /** Placement: "inset 12, bottom 34, full width". */
  phone: { inset: 12, bottom: 34 },
} as const

/**
 * The button that calls Ask back after it was closed (#125).
 *
 * Every other corner is taken, measured on the pages Ask sits on:
 *   bottom centre  the docked composer (640 wide, 46 high, 22 or 34 up)
 *   bottom right   the star map's zoom pair, at 24 (wide) or 16 (phone) in
 *                  from both edges, over the composer's reserved band
 *   bottom left    the legend on a wide screen (up to 640 wide), the "?" on a
 *                  phone, both at the same offsets as the zoom pair
 *   left edge,     the role switcher used for testing, `fixed left-2 top-1/2`
 *     middle
 * The right edge's middle is the one band none of them reaches, and it mirrors
 * the role switcher across the page. 44 is the smallest touch target the Sizes
 * board allows.
 */
export const ASK_REOPEN = { size: 44, inset: 16 } as const

export function sheetHeightFor(entry: AskEntry): string {
  return entry === 'direct' ? ASK_SHEET.directHeight : ASK_SHEET.planetHeight
}

/**
 * The Ask panel and sheet are a dark surface now (#125): a white card over the
 * star map read as a different product, which is what the student said.
 *
 * They carry `data-surface="sky"`, which brings the sky's own tokens, and this
 * points the light families the panel's contents are built from at their sky
 * counterparts, so one declaration darkens everything inside -- the composer,
 * the bubbles, the lists, the cards -- instead of every class being rewritten.
 *
 * Every value is a token. No key appears on the right-hand side of another, so
 * nothing resolves in a circle. `tests/component/askSkySurface.test.tsx` holds
 * both of those.
 */
export const ASK_SKY_TOKENS = {
  '--ground': 'var(--sky)',
  '--surface': 'var(--sky-glass)',
  '--sidebar': 'var(--sky-2)',
  '--fill': 'var(--on-sky-selected)',
  '--ink': 'var(--on-sky-text)',
  '--secondary': 'var(--on-sky-text-caption)',
  '--tertiary': 'var(--on-sky-text-muted)',
  '--separator': 'var(--sky-glass-border)',
  '--hairline': 'var(--sky-glass-border)',
  '--card-border': 'var(--sky-glass-border)',
  '--float-border': 'var(--sky-glass-border)',
  '--accent': 'var(--accent-on-sky)',
  '--accent-pressed': 'color-mix(in srgb, var(--accent-on-sky) 82%, var(--on-sky-text))',
  '--accent-tint': 'var(--on-sky-selected)',
  '--on-accent': 'var(--on-accent-on-sky)',
  '--pill-neutral': 'var(--on-sky-text-caption)',
} as const satisfies Record<`--${string}`, string>

/** The panel's own ground: the sky, left slightly open so the blur has work. */
export const ASK_SURFACE_BACKGROUND = {
  panel: 'color-mix(in srgb, var(--sky) 94%, transparent)',
  sheet: 'color-mix(in srgb, var(--sky) 96%, transparent)',
} as const

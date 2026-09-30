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

export function sheetHeightFor(entry: AskEntry): string {
  return entry === 'direct' ? ASK_SHEET.directHeight : ASK_SHEET.planetHeight
}

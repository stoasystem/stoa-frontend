/*
 * Where the onboarding cards over the map sit ("About you", plan B's
 * question): in the band the map's own controls leave free, so no part of the
 * card is ever drawn over one (#625). Measured on the built app, 375-1440 px
 * wide, in all four languages:
 *
 *   top     the where-you-are line and the subject switcher, and on a wide
 *           stage the tally (the streak, and the score when there is one):
 *           down to 95 px on a phone (100 in a nebula), 64 on a wide stage.
 *           The band starts at 104 and 76, under the design preview's "Demo"
 *           line when the stage has one (`--starmap-notice-height`,
 *           `DEMO_NOTICE_HEIGHT`). On a wide stage a nebula's line takes a
 *           second row where its first column is narrow (beside four
 *           subjects' switcher): "Star map /" above, the nebula's name and
 *           its lit count under it, down to 104 in every language at 768-840
 *           and in French and Italian at 900 (one line, 64, from 900 or
 *           1000 up; the whole map, 60, never wraps). It ended at 83 in French at
 *           768-900 when "Carte du ciel" itself broke onto three lines. So the
 *           wide band starts 12 px (`TOP_LINE_GAP`) under the line as drawn
 *           when that is lower than 76: the stage measures it and hands it
 *           down as `--starmap-top-line` (`controlBands`, which keeps the map
 *           itself under it the same way).
 *   bottom  the "?" bottom left, 40 tall (a zoom button's size): 16 px up on
 *           a phone, 24 px up on a wide stage (no always-on legend there
 *           since #643, it was 89 tall); both over Ask's docked composer
 *           (`--page-bottom-inset`). The band ends 12 px over the "?". The
 *           zoom pair, bottom right, is taller (about 74), but on a wide
 *           stage a card (at most 400 wide, centred on a stage at least 768
 *           wide) ends 120 px or more short of it. Under 560 the card is wide
 *           enough to reach the phone's zoom pair: the band ends 12 px over
 *           the pair there (#645).
 *
 * The card is at most the band's height and scrolls inside itself when it is
 * taller (375 x 667, a laptop at 1280 x 640). The card, not the band: the band
 * lets pointers through to the map, and a wheel or a finger over a card whose
 * scroller does not take pointers scrolls nothing, so "Done" stayed out of
 * reach below the fold.
 *
 * "Wide" is the stage's own width, as `isWide` measures it (768, and narrower
 * with the Ask panel open beside it): the frame is a size container, the
 * stage's size, and the band asks it.
 */

/** Over the whole stage, above the "?" and the zoom pair (`z-10`); the help dialog (`z-20`) still covers it. */
export const CARD_FRAME = 'pointer-events-none absolute inset-0 z-10 @container'

/**
 * The band between the controls, the card in its middle (the card takes
 * `max-h-full overflow-y-auto`), the same room on both sides (#645).
 *
 * A phone kept 72 px on the right, for Ask's button on the right edge and the
 * zoom pair under it; the button is in the docked composer's row now. Under
 * 560 the card (400 at most) is wide enough to reach the zoom pair, so the
 * band ends 12 px over the pair (74 tall) rather than over the "?".
 */
export const CARD_BAND =
  'absolute inset-x-0 top-[calc(104px+var(--starmap-notice-height,0px))] bottom-[calc(1rem+var(--page-bottom-inset,0px)+52px)] max-[559px]:bottom-[calc(1rem+var(--page-bottom-inset,0px)+86px)] flex items-center justify-center px-4 @min-[768px]:top-[max(calc(76px+var(--starmap-notice-height,0px)),calc(var(--starmap-top-line,0px)+12px))] @min-[768px]:bottom-[calc(1.5rem+var(--page-bottom-inset,0px)+52px)]'

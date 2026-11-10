/*
 * Where the onboarding cards over the map sit ("About you", plan B's
 * question): in the band the map's own controls leave free, so no part of the
 * card is ever drawn over one (#625). Measured on the built app, 375-1440 px
 * wide, in all four languages:
 *
 *   top     the where-you-are line and the subject switcher, and on a wide
 *           stage the tally: down to 95 px on a phone, 74 on a wide stage
 *           (the German tally wraps at 840). The band starts at 104 and 76.
 *   bottom  a phone's "?" (16 px up, 50 tall); a wide stage's key (24 px up,
 *           89 tall with its two rows); both over Ask's docked composer
 *           (`--page-bottom-inset`), the zoom pair beside them. The band ends
 *           12 px over the "?" and 9 over the key.
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

/** Over the whole stage, above the key and the "?" (`z-10`); the help dialog (`z-20`) still covers it. */
export const CARD_FRAME = 'pointer-events-none absolute inset-0 z-10 @container'

/**
 * The band between the controls, the card in its middle (the card takes
 * `max-h-full overflow-y-auto`); a phone keeps the right edge for Ask's button
 * (`data-ask-reopen`).
 */
export const CARD_BAND =
  'absolute inset-x-0 top-[104px] bottom-[calc(1rem+var(--page-bottom-inset,0px)+62px)] flex items-center justify-center px-4 max-[559px]:pr-[72px] @min-[768px]:top-[76px] @min-[768px]:bottom-[calc(1.5rem+var(--page-bottom-inset,0px)+98px)]'

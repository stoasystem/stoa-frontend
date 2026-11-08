/*
 * Murmi beside the recommended star on a newcomer's first landing
 * (`firstLanding.ts`): one line on what a star is, and two ways on -- the
 * star's chapter, by the jump from where the star is drawn, or, for a student
 * who knows all this already, "Find my own star" (#586), which hands over to
 * Ask's docked composer with things to say -- and "Look around first", kept
 * as the quiet way out (Escape does the same).
 *
 * How Murmi stands on the map -- following its star, arriving once the
 * camera has landed, docking on a phone, going on Escape -- is the star
 * map's one bubble (`components/MurmiBubble.tsx`), which finding a star
 * says its line in too (#489).
 *
 * The same bubble closes the first landing after the student's first star is
 * lit (`next`): beside the star recommended now, it says what lighting did
 * and leads to that star's card.
 */
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/base'
import { MurmiBubble } from '@/features/starmap/components/MurmiBubble'
import type { FrameScheduler, StarOnScreen } from '@/features/starmap/engine/starMapEngine'
import type { Star } from '@/features/starmap/model/starMap'

export { BUBBLE_EXIT_MS, dockedPlace, REDUCED_EXIT_MS } from '@/features/starmap/components/MurmiBubble'

export type FirstLandingBubbleProps = {
  star: Star
  /** After the first lighting: the route of `star`, the next one, which the bubble leads to. */
  next?: string
  /** Whether `star` has a chapter to start: not the design preview's placeholder stars (as the star's card). */
  startable?: boolean
  /** Other stars to keep clear, glyph and name (`MurmiBubble`'s `avoid`): after the first lighting, the star just lit. */
  avoid?: readonly string[]
  /** On the first landing: "Find my own star" (#586); Murmi goes once it is taken. */
  onFindOwn?: () => void
  /** Where a star is drawn now, from the map's engine. */
  locate: (unitId: string) => StarOnScreen | null
  /** Calls `listener` when the map comes to rest; returns the way to stop. */
  watch?: (listener: () => void) => () => void
  onDismiss: () => void
  /** For tests: the frame clock. */
  scheduler?: FrameScheduler
}

export function FirstLandingBubble({ star, next, startable = true, avoid, onFindOwn, locate, watch, onDismiss, scheduler }: FirstLandingBubbleProps) {
  const { t } = useTranslation('starmap')
  const chapterTo = `/chapter/${encodeURIComponent(star.unitId)}`
  return (
    <MurmiBubble
      unitId={star.unitId}
      marker="data-first-landing"
      avoid={avoid}
      title={next ? t('firstReveal.title') : t('firstLanding.title', { name: star.name })}
      body={next ? t('firstReveal.body', { name: star.name }) : t('firstLanding.body')}
      locate={locate}
      watch={watch}
      onDismiss={onDismiss}
      scheduler={scheduler}
      stackDocked
      ways={({ leave, jumpFrom }) => (
        <>
          {next ? (
            <Button asChild lift variant="onSky" size="small">
              <Link to={next}>{t('firstReveal.show')}</Link>
            </Button>
          ) : (
            <>
              {startable && (
                <Button asChild lift variant="onSky" size="small">
                  <Link to={chapterTo} onClick={jumpFrom(star.unitId, chapterTo)}>
                    {t('firstLanding.start')}
                  </Link>
                </Button>
              )}
              {onFindOwn && (
                <Button
                  lift
                  variant="onSky"
                  size="small"
                  onClick={() => {
                    // Ask takes the focus first, so Murmi going does not hand it back to the star.
                    onFindOwn()
                    leave()
                  }}
                >
                  {t('firstLanding.findOwn')}
                </Button>
              )}
            </>
          )}
          <Button variant="onSkyPlain" size="small" onClick={leave}>
            {next ? t('firstReveal.later') : t('firstLanding.later')}
          </Button>
        </>
      )}
    />
  )
}

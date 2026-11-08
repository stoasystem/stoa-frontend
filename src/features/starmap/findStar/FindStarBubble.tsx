/*
 * Murmi beside a star found from Ask (#489, #478 point 3): it suggests the
 * first missing star and offers three ways on -- start that star (its
 * chapter), test it (its star quiz), or learn the star asked for straight
 * away (its chapter): a prerequisite is a suggestion, never a lock (ADR
 * 0004). In a row beside the star; docked across a phone's map, stacked.
 * Waved away by its ✕, Escape or a tap on the map, and the path goes with it.
 */
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/base'
import { chapterPath, starQuizPath } from '@/features/chapter/useChapter'
import { MurmiBubble } from '@/features/starmap/components/MurmiBubble'
import type { FrameScheduler, StarOnScreen } from '@/features/starmap/engine/starMapEngine'
import type { Star } from '@/features/starmap/model/starMap'

export type FindStarBubbleProps = {
  /** The star asked for: Murmi stands beside it. */
  star: Star
  /** The first missing star, which Murmi suggests. */
  first: Star
  /** The other stars on the path (`FindStarPath.missing`): kept clear, `first` before them all (#586). */
  path?: readonly string[]
  /** Whether a star has a chapter and a quiz to go to: not the design preview's placeholder stars (as the star's card). */
  startable?: (star: Star) => boolean
  locate: (unitId: string) => StarOnScreen | null
  watch?: (listener: () => void) => () => void
  onDismiss: () => void
  /** For tests: the frame clock. */
  scheduler?: FrameScheduler
}

export function FindStarBubble({ star, first, path = [], startable = () => true, locate, watch, onDismiss, scheduler }: FindStarBubbleProps) {
  const { t } = useTranslation('starmap')
  const firstChapter = chapterPath(first.unitId)
  const starChapter = chapterPath(star.unitId)
  return (
    <MurmiBubble
      unitId={star.unitId}
      marker="data-find-star"
      // Murmi stands beside the star asked for and names `first`: never over it, nor over the path if it can help it.
      avoid={[first.unitId, ...path.filter((unitId) => unitId !== first.unitId)]}
      title={t('findStar.suggest', { name: first.name })}
      closeLabel={t('help.close')}
      leaveOnTap
      stackDocked
      widthClass="w-[min(420px,calc(100%-32px))]"
      locate={locate}
      watch={watch}
      onDismiss={onDismiss}
      scheduler={scheduler}
      ways={({ jumpFrom }) => (
        <>
          {startable(first) && (
            <>
              <Button asChild lift variant="onSky" size="small">
                <Link to={firstChapter} onClick={jumpFrom(first.unitId, firstChapter)} data-find-star-way="start">
                  {t('findStar.start', { name: first.name })}
                </Link>
              </Button>
              <Button asChild variant="onSkyPlain" size="small">
                <Link to={starQuizPath(first.unitId)} data-find-star-way="quiz">
                  {t('findStar.quiz', { name: first.name })}
                </Link>
              </Button>
            </>
          )}
          {startable(star) && (
            <Button asChild variant="onSkyPlain" size="small">
              <Link to={starChapter} onClick={jumpFrom(star.unitId, starChapter)} data-find-star-way="direct">
                {t('findStar.direct', { name: star.name })}
              </Link>
            </Button>
          )}
        </>
      )}
    />
  )
}

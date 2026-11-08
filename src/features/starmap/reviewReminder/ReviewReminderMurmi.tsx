/*
 * The review reminder's Murmi (#593): in the map's bottom-right corner, above
 * the zoom buttons. While reviews are due it whistles (`calling`) beside the
 * count, and is a button: a tap flies to the star with the most cards due and
 * Murmi's bubble opens there (`ReviewReminderBubble`). While reviews are
 * scheduled but none is due it sleeps beside when the next one is, and is
 * only words. The figure is decorative; the words beside it say everything,
 * and are the button's name.
 *
 * `calling` animates on the first star map visit of the student's day, then
 * holds still (and under reduced motion it always holds still, as `Murmi`
 * does).
 */
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/base'
import { Murmi } from '@/components/brand/Murmi'
import { MurmiBubble } from '@/features/starmap/components/MurmiBubble'
import type { FrameScheduler, StarOnScreen } from '@/features/starmap/engine/starMapEngine'
import { subjectOfNebula, type Star, type StarMap } from '@/features/starmap/model/starMap'
import { pathForTarget } from '@/features/starmap/view/layers'
import type { ReviewReturnState } from '@/features/starmap/view/reviewReturn'
import { localDay, nextReview, readDay, reminderKeys, writeDay, type ReminderMood } from '@/features/starmap/reviewReminder/reviewReminder'
import { formattingLocale } from '@/i18n/languages'
import { cn } from '@/lib/utils'
import type { ReviewSummary } from '@/types/practice'

const GLASS = { background: 'var(--sky-glass)', backdropFilter: 'blur(var(--sky-glass-blur))', WebkitBackdropFilter: 'blur(var(--sky-glass-blur))' }

export type ReviewReminderCornerProps = {
  mood: ReminderMood
  summary: Pick<ReviewSummary, 'dueCount' | 'nextDueAt'>
  ownerId: string
  /** The tap, while reviews are due; absent when no star on the map says it has cards due. */
  onOpen?: () => void
}

/** What the reminder says: the count due, or when the next review is. */
export function useReminderWords(mood: ReminderMood, summary: Pick<ReviewSummary, 'dueCount' | 'nextDueAt'>): string {
  const { t, i18n } = useTranslation('starmap')
  if (mood === 'calling') return t('marker.reviewDue', { count: summary.dueCount })
  const next = nextReview(summary.nextDueAt, new Date(), formattingLocale(i18n.language))
  if (next.kind === 'today') return t('reviewReminder.nextToday')
  if (next.kind === 'tomorrow') return t('reviewReminder.nextTomorrow')
  if (next.kind === 'unknown') return t('reviewReminder.nextUnknown')
  return t('reviewReminder.next', { when: next.when })
}

export function ReviewReminderCorner({ mood, summary, ownerId, onOpen }: ReviewReminderCornerProps) {
  const words = useReminderWords(mood, summary)
  const { seen } = reminderKeys(ownerId)
  const [today] = useState(() => localDay(new Date()))
  // The first visit of the day, read once: the animation plays through this visit, not the next.
  const [animated] = useState(() => mood === 'calling' && readDay(seen) !== today)
  useEffect(() => {
    if (mood === 'calling') writeDay(seen, today)
  }, [mood, seen, today])

  const figure = <Murmi mood={mood} size={36} animated={animated} facing="left" />
  const text = <span className="min-w-0 text-[13px] font-semibold leading-tight">{words}</span>
  const shape = 'pointer-events-auto inline-flex min-h-11 max-w-[260px] items-center gap-2 rounded-full border border-solid border-[color:var(--sky-glass-border)] py-1 pl-2 pr-3.5 text-on-sky'

  return (
    <div className="pointer-events-none absolute inset-0 @container" data-review-reminder={mood}>
      <div
        data-starmap-overlay
        className={cn(
          'pointer-events-none absolute right-4 bottom-[calc(1rem+var(--page-bottom-inset,0px)+106px)]',
          '@3xl:right-6 @3xl:bottom-[calc(1.5rem+var(--page-bottom-inset,0px)+82px)]',
        )}
      >
        {mood === 'calling' && onOpen ? (
          <button
            type="button"
            data-review-reminder-open
            onClick={onOpen}
            className={cn(shape, 'cursor-pointer hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring')}
            style={GLASS}
          >
            {figure}
            {text}
          </button>
        ) : (
          <p className={cn(shape, 'm-0', mood === 'sleeping' && 'text-[color:var(--on-sky-text-body)]')} style={GLASS}>
            {figure}
            {text}
          </p>
        )}
      </div>
    </div>
  )
}

export type ReviewReminderBubbleProps = {
  star: Star
  /** For the review's way back to this star (#411). */
  map: Pick<StarMap, 'nebulae' | 'subject'>
  locate: (unitId: string) => StarOnScreen | null
  watch?: (listener: () => void) => () => void
  /** The bubble waved away: the corner Murmi comes back. */
  onDismiss: () => void
  /** "Got it", once the bubble has gone: the reminder is gone for the rest of today. */
  onWave: () => void
  /** For tests: the frame clock. */
  scheduler?: FrameScheduler
}

/** Murmi beside the star with the most cards due: its count, and the way into its review. */
export function ReviewReminderBubble({ star, map, locate, watch, onDismiss, onWave, scheduler }: ReviewReminderBubbleProps) {
  const { t } = useTranslation('starmap')
  const { search } = useLocation()
  // The review's way back is to this star, as from the star's card (#411).
  const reviewFrom: ReviewReturnState = {
    star: pathForTarget(subjectOfNebula(map, star.nebulaId), { layer: 'star', nebulaId: star.nebulaId, unitId: star.unitId }) + search,
  }
  // "Got it" goes with the same fade as the ✕, and only then for the day.
  const waving = useRef(false)
  return (
    <MurmiBubble
      unitId={star.unitId}
      marker="data-review-reminder-bubble"
      title={star.name}
      body={t('marker.reviewDue', { count: star.reviewDue })}
      announce={`${star.name}: ${t('marker.reviewDue', { count: star.reviewDue })}`}
      closeLabel={t('help.close')}
      leaveOnTap
      locate={locate}
      watch={watch}
      onDismiss={() => (waving.current ? onWave() : onDismiss())}
      scheduler={scheduler}
      ways={({ leave }) => (
        <>
          <Button asChild lift variant="onSky" size="small">
            <Link to={`/review/${encodeURIComponent(star.unitId)}`} state={reviewFrom} data-review-reminder-way="review">
              {t('star.review', { count: star.reviewDue })}
            </Link>
          </Button>
          <Button
            variant="onSkyPlain"
            size="small"
            data-review-reminder-way="got-it"
            onClick={() => {
              waving.current = true
              leave()
            }}
          >
            {t('reviewReminder.gotIt')}
          </Button>
        </>
      )}
    />
  )
}

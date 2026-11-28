/**
 * The questions that have come back round.
 *
 * A student answers here rather than being sent to the lesson they came from,
 * because the point is the question, not the lesson. Each answer reschedules
 * the question on the server, so the list shortens as it is worked through.
 *
 * Every kind of question has to be answerable here, not just the ones with
 * options: a review that drew only `multiple_choice` left a typed question
 * with nothing but a Check button under it, so the question could never leave
 * the list (card 124). Each card is the practice stage's own: its glass, its
 * `AnswerInput` and `FeedbackCard` (`@/features/chapter/answerControls`) and
 * its buttons, so a question that comes back looks and answers as it did in
 * its lesson (#181: the review had drawn outlined buttons and a grey box).
 *
 * Colour: nothing here names one. The page puts `data-surface="sky"` and
 * `data-review-surface` round this subtree, and the one remap in
 * brand-tokens.css points the light names these classes use at their sky
 * values, so the card, the options, the fields, the badge and the feedback
 * all darken together (#125). Where a class had an alpha the gate cannot
 * read (`bg-primary/10`, `bg-muted/40`), it is the whole token now, so what
 * `check:contrast` rates is what the screen shows.
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/base'
import { EmptyState } from '@/components/common/EmptyState'
import { answerFilled } from '@/components/practice/practiceLessonReducer'
import { AnswerInput, BankText, bodyOnSky, drawnOnGrid, FeedbackCard, figureChoices, glass, type AnswerValue } from '@/features/chapter/answerControls'
import { ExerciseFigure } from '@/features/chapter/ExerciseFigure'
import { GridDrawingFigure } from '@/features/chapter/GridDrawingInput'
import { submitChallengeAnswer } from '@/services/practice/practiceApi'
import { practiceQueryKeys } from '@/services/practice/practiceQueryKeys'
import { useDueReviewQuery } from '@/hooks/practice/useReviewQueries'
import { cn } from '@/lib/utils'
import type { PracticeAnswerResult, ReviewCard, ReviewReason } from '@/types/practice'

/** The kinds that are answered by picking from what the card carries. */
const FROM_OPTIONS = ['multiple_choice', 'multi_select', 'ordering']

/** Nothing picked yet: an empty order, an empty set of options (stoa-backend#593), or no text. */
const emptyAnswer = (type: string): AnswerValue => (type === 'ordering' || type === 'multi_select' ? [] : '')

export function ReviewSession({ unitId }: { unitId?: string } = {}) {
  const { t } = useTranslation('practice')
  const queryClient = useQueryClient()
  // With a knowledge point named, the server selects before it cuts a page,
  // so what opens here is what its star said was due (stoa-backend#70).
  const dueQuery = useDueReviewQuery({ unitId })
  const cards = dueQuery.data?.items ?? []

  // Every answer reschedules its question, so the list this session opened
  // with is out of date once one is sent. It stays on screen while the student
  // is here - each card keeps its feedback - but it must not outlive the
  // session: kept in the cache, a star opened again within the minute served
  // the same card from it and the student answered it a second time (#264).
  // Dropped rather than marked stale, because a stale list is still drawn
  // while it refetches, and a card drawn can be answered.
  const answered = useRef(false)
  const onAnswer = useCallback(() => {
    answered.current = true
  }, [])
  useEffect(
    () => () => {
      if (answered.current) {
        queryClient.removeQueries({ queryKey: [...practiceQueryKeys.all, 'review-due'] })
        // And the totals the map's review reminder reads (#593): back on the map it reads them again,
        // rather than whistling about cards just answered.
        queryClient.removeQueries({ queryKey: practiceQueryKeys.reviewSummary() })
      }
    },
    [queryClient],
  )

  if (dueQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">{t('review.loading')}</p>
  }

  // Only a list that never arrived is an error. One on screen stays when a
  // read behind it fails -- a language switch reads everything again, so does
  // a reconnect -- and with it the answers typed and the feedback (#457).
  if (dueQuery.isError && !dueQuery.data) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="m-0 text-sm text-destructive">{t('review.loadFailed')}</p>
        <Button
          lift
          variant="onSky"
          disabled={dueQuery.isFetching}
          onClick={() => void dueQuery.refetch()}
        >
          <RotateCcw size={16} aria-hidden="true" />
          {t('tryAgain')}
        </Button>
      </div>
    )
  }

  // No Try again here: a list read again drops the questions already
  // answered, and their feedback with them.
  const refreshFailed = dueQuery.isError ? (
    <p role="alert" className="m-0 text-sm text-destructive">{t('review.refreshFailed')}</p>
  ) : null

  if (cards.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState
          title={t('review.emptyTitle')}
          description={t('review.emptyBody')}
        />
        {refreshFailed}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t('review.due', { count: cards.length })}
      </p>
      {refreshFailed}
      {cards.map((card) => (
        <ReviewQuestion key={card.challengeId} card={card} onAnswer={onAnswer} />
      ))}
    </div>
  )
}

function ReviewQuestion({ card, onAnswer }: { card: ReviewCard; onAnswer: () => void }) {
  const { t } = useTranslation('practice')
  const { t: tStage } = useTranslation('chapter')
  const queryClient = useQueryClient()
  const promptId = useId()
  const [answerValue, setAnswerValue] = useState<AnswerValue>(() => emptyAnswer(card.type))
  const [result, setResult] = useState<PracticeAnswerResult | null>(null)
  // Check goes away with the verdict, and Try again with the next attempt, so
  // the keyboard was left on the page (#342): it goes to what took their
  // place -- Try again, or the verdict -- and back to the answer.
  const answerArea = useRef<HTMLDivElement>(null)
  const verdictArea = useRef<HTMLDivElement>(null)
  const tryAgain = useRef<HTMLButtonElement>(null)
  const retried = useRef(false)
  useEffect(() => {
    if (result) {
      ;(result.correct ? verdictArea.current : tryAgain.current)?.focus()
    } else if (retried.current) {
      retried.current = false
      answerArea.current?.querySelector<HTMLElement>('input:not([disabled]), textarea:not([disabled]), button:not([disabled])')?.focus()
    }
  }, [result])

  const answer = useMutation({
    mutationFn: (value: AnswerValue) => submitChallengeAnswer(card.challengeId, { answer: value }),
    // Counted when it is sent, not when it lands: a student who leaves before
    // the reply still moved the schedule.
    onMutate: onAnswer,
    onSuccess: (data) => {
      setResult(data)
      // The schedule moved, so what is due moved with it: the totals, and the
      // "Review N" on the star, which reads from the sky.
      void queryClient.invalidateQueries({ queryKey: practiceQueryKeys.reviewSummary() })
      void queryClient.invalidateQueries({ queryKey: [...practiceQueryKeys.all, 'knowledge-map'] })
    },
  })

  const options = card.options ?? []
  // A question that is answered by picking, but that arrived with nothing to
  // pick from. The stage would offer a text box; here that box would submit an
  // answer the question was never asking for and push its next date out, so
  // the review says plainly that this one belongs in its lesson.
  // A drawing on a grid that arrived without its grid is the same (#744).
  const unanswerable =
    (options.length === 0 && FROM_OPTIONS.includes(card.type)) || (card.type === 'grid_drawing' && !card.grid)
  // The set just checked stays picked beside its verdict, in the list and in
  // the figure alike, until Try again (stoa-backend#593).
  const answering = {
    challenge: card,
    value: answerValue,
    onChange: setAnswerValue,
    verdict: result ? (result.correct ? 'right' : 'wrong') : null,
    disabled: result !== null || answer.isPending,
  } as const

  return (
    <article data-review-card className="flex flex-col gap-4 rounded-[16px] border px-[18px] py-5 text-on-sky" style={glass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p id={promptId} className="m-0 min-w-0 flex-1 text-[17px] font-semibold leading-[1.4] text-on-sky">
          <BankText>{card.prompt}</BankText>
        </p>
        {card.lapses > 0 ? (
          <span className="whitespace-nowrap rounded-full bg-accent-tint px-2 py-1 text-xs font-medium text-primary">
            {t('review.missed', { count: card.lapses })}
          </span>
        ) : null}
      </div>

      <ReasonLabel reason={card.reason} />

      {/* A drawing on a grid shows its grid in the answer instead (#744). */}
      {card.figure && !drawnOnGrid(card) && (
        <ExerciseFigure svg={card.figure} labelledBy={promptId} choices={unanswerable ? undefined : figureChoices(answering)} />
      )}

      {unanswerable ? (
        <p className={cn('m-0 text-[15px]', bodyOnSky)}>{t('review.answerInLesson')}</p>
      ) : (
        <>
          <div ref={answerArea} className="contents">
            <AnswerInput {...answering} />
          </div>

          <div className="flex flex-col">
            {/* Here before the verdict, so a wrong one is read when it arrives,
                while the focus goes on to Try again (#408). */}
            <div
              role="status"
              aria-live="polite"
              data-review-feedback={result && !result.correct ? 'wrong' : undefined}
            >
              {/* The explanation states the answer, so the card holds it back
                  until the student has found it; the feedback points the way. */}
              {result && !result.correct && (
                <FeedbackCard correct={false} feedback={result.feedback} />
              )}
            </div>
            {/* A right one takes the focus, which reads it, so it stays out of
                the region: in it, it was read a second time (#453). */}
            {result?.correct && (
              <div ref={verdictArea} tabIndex={-1} data-review-feedback="correct" className="outline-none">
                <FeedbackCard correct feedback={result.feedback} explanation={result.explanation}>
                  {/* The student's drawing stays in the grid above; beside it, the
                      drawing the exercise keeps as right (#744). Held back from a
                      wrong answer, as the explanation is. */}
                  {card.grid && result.standardDrawing && (
                    <div data-review-standard-drawing className="mt-2 flex flex-col gap-1.5">
                      <p className="m-0 text-[13px] font-semibold">{tStage('stage.grid.standard')}</p>
                      <GridDrawingFigure grid={card.grid} drawing={result.standardDrawing} label={tStage('stage.grid.standard')} />
                      <p className={cn('m-0 text-[13px]', bodyOnSky)}>{tStage('stage.grid.standardNote')}</p>
                    </div>
                  )}
                  <p className={cn('m-0 text-[13px]', bodyOnSky)}>{t('review.comesBackLater')}</p>
                </FeedbackCard>
              </div>
            )}
            {result ? (
              !result.correct && (
                <Button
                  ref={tryAgain}
                  lift
                  variant="onSky"
                  className="mt-3 self-start"
                  onClick={() => {
                    retried.current = true
                    setResult(null)
                    setAnswerValue(emptyAnswer(card.type))
                  }}
                >
                  <RotateCcw size={16} aria-hidden="true" />
                  {tStage('stage.tryAgain')}
                </Button>
              )
            ) : (
              <Button
                lift
                variant="onSky"
                className="self-start"
                disabled={!answerFilled(answerValue) || answer.isPending}
                onClick={() => answerFilled(answerValue) && answer.mutate(answerValue)}
              >
                {answer.isPending ? tStage('stage.checking') : tStage('stage.check')}
              </Button>
            )}
          </div>
        </>
      )}

      {answer.isError ? (
        <p role="alert" className={cn('m-0 text-[13px]', bodyOnSky)}>{t('review.answerFailed')}</p>
      ) : null}
    </article>
  )
}

const BANDS = ['fresh', 'fading', 'forgetting', 'forgotten'] as const

/**
 * Why the question is back now (#684, from stoa-backend#447): how well it is
 * likely still remembered, in words, and how many days it has waited. Never
 * the chance of recall as a percentage: a child cannot act on "62 %".
 *
 * A miss comes back the next day while its recall is still high, so "still
 * fresh" would not say why it is here; that card says it was wrong last time
 * instead. A card from before the server sent a reason, or one with no answer
 * behind it (`band` null), shows nothing. A band this build does not know
 * falls back to the server's own label, which it sends in the request's
 * language.
 */
function ReasonLabel({ reason }: { reason?: ReviewReason | null }) {
  const { t } = useTranslation('practice')
  if (!reason?.band) return null
  const known = (BANDS as readonly string[]).includes(reason.band)
  const label =
    reason.latestWrong && reason.band === 'fresh'
      ? t('review.reason.latestWrong')
      : known
        ? t(`review.reason.${reason.band}`)
        : reason.bandLabel
  if (!label) return null
  const overdue = Math.floor(reason.daysOverdue ?? 0)
  return (
    <p data-review-reason={reason.band} className={cn('m-0 -mt-2 text-[13px]', bodyOnSky)}>
      {overdue > 0 ? `${label} · ${t('review.reason.overdue', { count: overdue })}` : label}
    </p>
  )
}

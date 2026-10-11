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
 * the list (card 124). What each kind is answered with is the practice
 * stage's `AnswerInput` (`@/features/chapter/LessonStage`), down to the
 * labels, which are read from its own `chapter` namespace so the two screens
 * cannot drift apart.
 */
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Check, RotateCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/common/EmptyState'
import { submitChallengeAnswer } from '@/services/practice/practiceApi'
import { practiceQueryKeys } from '@/services/practice/practiceQueryKeys'
import { useDueReviewQuery } from '@/hooks/practice/useReviewQueries'
import type { PracticeAnswerResult, ReviewCard } from '@/types/practice'

/** What is being typed or picked. An order is a list; everything else is text. */
type ReviewAnswer = string | string[]

/** The kinds that are answered by picking from what the card carries. */
const FROM_OPTIONS = ['multiple_choice', 'ordering']

const emptyAnswer = (type: string): ReviewAnswer => (type === 'ordering' ? [] : '')

/**
 * The rule the stage lights its Check button by (`useLessonRun`): an order
 * needs a first pick, anything typed needs a character that is not a space.
 */
const isFilled = (answer: ReviewAnswer) =>
  Array.isArray(answer) ? answer.length > 0 : answer.trim().length > 0

export function ReviewSession({ unitId }: { unitId?: string } = {}) {
  const { t } = useTranslation('practice')
  // With a knowledge point named, the server selects before it cuts a page,
  // so what opens here is what its star said was due (stoa-backend#70).
  const dueQuery = useDueReviewQuery({ unitId })
  const cards = dueQuery.data?.items ?? []

  if (dueQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">{t('review.loading')}</p>
  }

  if (dueQuery.isError) {
    return <p className="text-sm text-destructive">{t('review.loadFailed')}</p>
  }

  if (cards.length === 0) {
    return (
      <EmptyState
        title={t('review.emptyTitle')}
        description={t('review.emptyBody')}
      />
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t('review.due', { count: cards.length })}
      </p>
      {cards.map((card) => (
        <ReviewQuestion key={card.challengeId} card={card} />
      ))}
    </div>
  )
}

function ReviewQuestion({ card }: { card: ReviewCard }) {
  const { t } = useTranslation('practice')
  const queryClient = useQueryClient()
  const [answerValue, setAnswerValue] = useState<ReviewAnswer>(() => emptyAnswer(card.type))
  const [result, setResult] = useState<PracticeAnswerResult | null>(null)

  const answer = useMutation({
    mutationFn: (value: ReviewAnswer) => submitChallengeAnswer(card.challengeId, { answer: value }),
    onSuccess: (data) => {
      setResult(data)
      // The schedule moved, so what is due moved with it.
      void queryClient.invalidateQueries({ queryKey: practiceQueryKeys.reviewSummary() })
    },
  })

  const answered = result !== null
  const options = card.options ?? []
  // A question that is answered by picking, but that arrived with nothing to
  // pick from. The stage would offer a text box; here that box would submit an
  // answer the question was never asking for and push its next date out, so
  // the review says plainly that this one belongs in its lesson.
  const unanswerable = options.length === 0 && FROM_OPTIONS.includes(card.type)

  return (
    <Card className="border-border/70">
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="text-base font-medium leading-6 text-foreground">{card.prompt}</p>
          {card.lapses > 0 ? (
            <span className="whitespace-nowrap rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
              {t('review.missed', { count: card.lapses })}
            </span>
          ) : null}
        </div>

        {unanswerable ? (
          <p className="text-sm text-muted-foreground">{t('review.answerInLesson')}</p>
        ) : (
          <>
            <ReviewAnswerInput
              card={card}
              value={answerValue}
              onChange={setAnswerValue}
              disabled={answered || answer.isPending}
            />

            {answered ? (
              <ReviewFeedback result={result} onAgain={() => {
                setResult(null)
                setAnswerValue(emptyAnswer(card.type))
              }} />
            ) : (
              <Button
                type="button"
                disabled={!isFilled(answerValue) || answer.isPending}
                onClick={() => isFilled(answerValue) && answer.mutate(answerValue)}
              >
                {answer.isPending ? t('review.checking') : t('checkAnswer')}
              </Button>
            )}
          </>
        )}

        {answer.isError ? (
          <p className="text-sm text-destructive">{t('review.answerFailed')}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}

/**
 * The control a question of this kind is answered with, branch for branch as
 * the practice stage's `AnswerInput` has them, in this screen's light skin. A
 * kind neither screen knows is typed, which is what the backend itself falls
 * back to, so a new kind of question is answerable before anything is changed
 * here.
 */
function ReviewAnswerInput({
  card,
  value,
  onChange,
  disabled,
}: {
  card: ReviewCard
  value: ReviewAnswer
  onChange: (value: ReviewAnswer) => void
  disabled: boolean
}) {
  const { t } = useTranslation('chapter')
  const options = card.options ?? []

  if (card.type === 'multiple_choice' && options.length > 0) {
    const selected = Array.isArray(value) ? '' : value
    return (
      <div className="grid gap-2">
        {options.map((option) => (
          <Button
            key={option}
            type="button"
            variant={selected === option ? 'default' : 'outline'}
            className="h-auto justify-start whitespace-normal py-2 text-left"
            disabled={disabled}
            onClick={() => onChange(option)}
          >
            {option}
          </Button>
        ))}
      </div>
    )
  }

  if (card.type === 'ordering' && options.length > 0) {
    const chosen = Array.isArray(value) ? value : []
    const toggle = (option: string) =>
      onChange(chosen.includes(option) ? chosen.filter((item) => item !== option) : [...chosen, option])
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">{t('stage.order.available')}</p>
        <div className="flex flex-wrap gap-2">
          {options.map((option) => (
            <Button
              key={option}
              type="button"
              size="sm"
              variant={chosen.includes(option) ? 'default' : 'outline'}
              aria-pressed={chosen.includes(option)}
              disabled={disabled}
              onClick={() => toggle(option)}
            >
              {option}
            </Button>
          ))}
        </div>
        <p className="text-sm font-medium text-foreground">{t('stage.order.chosen')}</p>
        {chosen.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('stage.order.empty')}</p>
        ) : (
          <ol className="m-0 list-decimal space-y-1 pl-5 text-sm text-foreground">
            {chosen.map((option) => (
              <li key={option}>{option}</li>
            ))}
          </ol>
        )}
      </div>
    )
  }

  const text = Array.isArray(value) ? value.join(', ') : value
  const fieldId = `review-answer-${card.challengeId}`
  return (
    <div className="space-y-2">
      <label htmlFor={fieldId} className="block text-sm font-medium text-foreground">
        {t('stage.yourAnswer')}
      </label>
      {card.type === 'explanation' ? (
        <Textarea
          id={fieldId}
          rows={4}
          value={text}
          disabled={disabled}
          placeholder={t('stage.explainPlaceholder')}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <Input
          id={fieldId}
          type="text"
          value={text}
          disabled={disabled}
          autoComplete="off"
          placeholder={t('stage.answerPlaceholder')}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </div>
  )
}

function ReviewFeedback({
  result,
  onAgain,
}: {
  result: PracticeAnswerResult
  onAgain: () => void
}) {
  const { t } = useTranslation('practice')

  return (
    <div className="space-y-3 rounded-md border border-border/70 bg-muted/40 p-3">
      <p className="flex items-center gap-2 text-sm font-semibold">
        {result.correct ? (
          <Check className="h-4 w-4 text-primary" aria-hidden="true" />
        ) : (
          <X className="h-4 w-4 text-destructive" aria-hidden="true" />
        )}
        {result.feedback}
      </p>
      {/* The explanation states the answer, so it is held back until the
          student has found it; the feedback above points the way instead. */}
      {result.correct && result.explanation ? (
        <p className="text-sm leading-6 text-muted-foreground">{result.explanation}</p>
      ) : null}
      {result.correct ? (
        <p className="text-xs text-muted-foreground">
          {t('review.comesBackLater')}
        </p>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={onAgain}>
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          {t('tryAgain')}
        </Button>
      )}
    </div>
  )
}

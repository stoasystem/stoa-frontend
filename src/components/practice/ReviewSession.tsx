/**
 * The questions that have come back round.
 *
 * A student answers here rather than being sent to the lesson they came from,
 * because the point is the question, not the lesson. Each answer reschedules
 * the question on the server, so the list shortens as it is worked through.
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
  const { t } = useTranslation(['practice', 'chapter'])
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<string | null>(null)
  // A card with no options is answered in words: `text_input`, or an
  // explanation. Only the choices were drawn, so a typed card came back as a
  // prompt and a "Check" that could never be pressed (app.stoaedu.ch, 2026-10-10).
  const typedCard = card.options.length === 0
  const [typed, setTyped] = useState('')
  const [result, setResult] = useState<PracticeAnswerResult | null>(null)

  const answer = useMutation({
    mutationFn: (value: string) => submitChallengeAnswer(card.challengeId, { answer: value }),
    onSuccess: (data) => {
      setResult(data)
      // The schedule moved, so what is due moved with it.
      void queryClient.invalidateQueries({ queryKey: practiceQueryKeys.reviewSummary() })
    },
  })

  const answered = result !== null
  const value = typedCard ? typed.trim() : selected
  const fieldId = `review-answer-${card.challengeId}`

  function submit() {
    if (value && !answered && !answer.isPending) answer.mutate(value)
  }

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

        {typedCard ? (
          <div className="grid gap-1.5">
            <label htmlFor={fieldId} className="text-sm font-medium text-foreground">
              {t('ui.yourAnswer')}
            </label>
            {card.type === 'explanation' ? (
              <Textarea
                id={fieldId}
                rows={3}
                value={typed}
                disabled={answered || answer.isPending}
                placeholder={t('chapter:stage.answerPlaceholder')}
                onChange={(event) => setTyped(event.target.value)}
              />
            ) : (
              <Input
                id={fieldId}
                value={typed}
                autoComplete="off"
                disabled={answered || answer.isPending}
                placeholder={t('chapter:stage.answerPlaceholder')}
                onChange={(event) => setTyped(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    submit()
                  }
                }}
              />
            )}
          </div>
        ) : (
          <div className="grid gap-2">
            {card.options.map((option) => {
              const isChoice = selected === option
              return (
                <Button
                  key={option}
                  type="button"
                  variant={isChoice ? 'default' : 'outline'}
                  className="h-auto justify-start whitespace-normal py-2 text-left"
                  disabled={answered || answer.isPending}
                  onClick={() => setSelected(option)}
                >
                  {option}
                </Button>
              )
            })}
          </div>
        )}

        {answered ? (
          <ReviewFeedback result={result} onAgain={() => {
            setResult(null)
            setSelected(null)
            setTyped('')
          }} />
        ) : (
          <Button
            type="button"
            disabled={!value || answer.isPending}
            onClick={submit}
          >
            {answer.isPending ? t('review.checking') : t('checkAnswer')}
          </Button>
        )}

        {answer.isError ? (
          <p className="text-sm text-destructive">{t('review.answerFailed')}</p>
        ) : null}
      </CardContent>
    </Card>
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

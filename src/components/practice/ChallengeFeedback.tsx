import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import type { PracticeAnswerResult } from '@/types/practice'

export function ChallengeFeedback({
  result,
  onRetry,
  onContinue,
  onHint,
}: {
  result: PracticeAnswerResult
  onRetry: () => void
  onContinue: () => void
  onHint: () => void
}) {
  const { t } = useTranslation('practice')
  const Icon = result.correct ? CheckCircle2 : XCircle

  return (
    <div
      aria-live="polite"
      className="rounded-lg border border-primary/15 bg-[hsl(var(--platform-surface-app))] p-4"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <Icon className={result.correct ? 'mt-0.5 h-5 w-5 text-primary' : 'mt-0.5 h-5 w-5 text-amber-700'} />
          <div>
            <p className="font-semibold">{result.correct ? t('correct') : t('notQuite')}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{result.feedback}</p>
            {result.correct && result.explanation && (
              <p className="mt-2 text-sm leading-6">{result.explanation}</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!result.correct && (
            <>
              <Button onClick={onHint} type="button" variant="outline">
                {t('showHint')}
              </Button>
              <Button onClick={onRetry} type="button" variant="secondary">
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                {t('tryAgain')}
              </Button>
            </>
          )}
          {result.correct && (
            <Button onClick={onContinue} type="button">
              {t('continuePractice')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

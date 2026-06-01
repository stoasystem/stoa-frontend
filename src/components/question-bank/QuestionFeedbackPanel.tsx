import { CheckCircle2, HelpCircle, RotateCcw, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { QuestionBankFeedback } from '@/types/questionBank'

export function QuestionFeedbackPanel({
  feedback,
  onAskLearningAssistant,
  onTrySimilar,
}: {
  feedback?: QuestionBankFeedback
  onAskLearningAssistant: () => void
  onTrySimilar?: () => void
}) {
  if (!feedback) {
    return (
      <div className="rounded-lg border border-dashed bg-card/70 p-5 text-sm text-muted-foreground">
        Check your answer when you are ready. Feedback appears here before you move on.
      </div>
    )
  }

  const positive = feedback.state === 'correct'
  const skipped = feedback.state === 'skipped'

  return (
    <section className="rounded-lg border bg-card/95 p-5 shadow-[var(--platform-shadow-soft)]" aria-live="polite">
      <div className="flex items-start gap-3">
        <div className={positive ? 'text-primary' : skipped ? 'text-muted-foreground' : 'text-destructive'}>
          {positive ? <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> : <XCircle className="h-5 w-5" aria-hidden="true" />}
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">{feedback.title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{feedback.message}</p>
        </div>
      </div>
      {feedback.studentAnswer && feedback.state !== 'correct' && (
        <p className="mt-4 rounded-md border bg-[hsl(var(--platform-surface-app))] p-3 text-sm">
          Your answer: <span className="font-semibold">{answerToText(feedback.studentAnswer)}</span>
        </p>
      )}
      {feedback.state !== 'correct' && feedback.correctAnswer && (
        <p className="mt-3 rounded-md border bg-[hsl(var(--platform-surface-app))] p-3 text-sm">
          Correct answer: <span className="font-semibold">{answerToText(feedback.correctAnswer)}</span>
        </p>
      )}
      {feedback.explanation && (
        <div className="mt-4 rounded-md border border-primary/15 bg-[hsl(var(--stoa-brand-burgundy-soft))] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">Explanation</p>
          <p className="mt-2 text-sm leading-6">{feedback.explanation}</p>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {feedback.state !== 'correct' && onTrySimilar && (
          <Button type="button" variant="outline" onClick={onTrySimilar}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Try Similar Question
          </Button>
        )}
        <Button type="button" variant="outline" onClick={onAskLearningAssistant}>
          <HelpCircle className="h-4 w-4" aria-hidden="true" />
          Ask Learning Assistant
        </Button>
      </div>
    </section>
  )
}

function answerToText(answer: string | string[]) {
  return Array.isArray(answer) ? answer.join(' / ') : answer
}

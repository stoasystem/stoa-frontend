import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { QuestionBankQuestion } from '@/types/questionBank'

export function QuestionAnswerInput({
  question,
  value,
  onChange,
}: {
  question: QuestionBankQuestion
  value: string | string[]
  onChange: (value: string | string[]) => void
}) {
  if (question.type === 'multiple_choice') {
    const selected = typeof value === 'string' ? value : ''
    return (
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">Choose one answer</legend>
        {question.options?.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              'flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              selected === option
                ? 'border-primary bg-[hsl(var(--stoa-brand-burgundy-soft))] text-foreground'
                : 'border-border/80 bg-card hover:border-primary/35',
            )}
            aria-pressed={selected === option}
          >
            <span>{option}</span>
            <span className="h-3 w-3 rounded-full border border-current" aria-hidden="true" />
          </button>
        ))}
      </fieldset>
    )
  }

  if (question.type === 'step_by_step') {
    const parts = Array.isArray(value) ? value : ['', '', '']
    return (
      <div className="space-y-4">
        {['Step 1', 'Step 2', 'Final answer'].map((label, index) => (
          <div key={label} className="space-y-2">
            <Label htmlFor={`question-step-${index}`}>{label}</Label>
            <Textarea
              id={`question-step-${index}`}
              value={parts[index] ?? ''}
              onChange={(event) => {
                const next = [...parts]
                next[index] = event.target.value
                onChange(next)
              }}
              className="min-h-20 resize-none"
            />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="question-bank-answer">Your answer</Label>
      <Input
        id="question-bank-answer"
        value={typeof value === 'string' ? value : value.join(' ')}
        onChange={(event) => onChange(event.target.value)}
        inputMode={question.type === 'numeric' ? 'decimal' : 'text'}
        placeholder={question.type === 'numeric' ? 'Enter a number' : 'Write your answer'}
      />
    </div>
  )
}

import { ArrowLeft, LibraryBig } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { QuestionBankChatContext } from '@/types/questionBank'

export function QuestionBankContextCard({
  context,
  onBack,
}: {
  context: QuestionBankChatContext
  onBack?: () => void
}) {
  return (
    <div className="border-b bg-[hsl(var(--platform-surface-app)_/_0.88)] px-4 py-3 md:px-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-lg border border-primary/15 bg-card/95 p-4 shadow-[var(--platform-shadow-soft)] sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <LibraryBig className="h-4 w-4" aria-hidden="true" />
            Question Bank context
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {context.setTitle} · <span className="font-medium text-foreground">{context.topic}</span>
          </p>
          <p className="mt-2 line-clamp-2 text-sm leading-6">
            Question: {context.challengePrompt}
          </p>
          {context.studentAnswer && (
            <p className="mt-2 text-xs text-muted-foreground">
              Recent answer: {context.studentAnswer}
            </p>
          )}
        </div>
        {context.returnTo && onBack && (
          <Button onClick={onBack} type="button" variant="outline">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to set
          </Button>
        )}
      </div>
    </div>
  )
}

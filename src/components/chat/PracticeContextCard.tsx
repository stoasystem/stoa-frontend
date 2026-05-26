import { ArrowLeft, BookOpenCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import type { PracticeChatContext } from '@/types/practice'

export function PracticeContextCard({
  context,
  onBackToLesson,
}: {
  context: PracticeChatContext
  onBackToLesson?: () => void
}) {
  const { t } = useTranslation('chat')

  return (
    <div className="border-b bg-[hsl(var(--platform-surface-app)_/_0.88)] px-4 py-3 md:px-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-lg border border-primary/15 bg-card/95 p-4 shadow-[var(--platform-shadow-soft)] sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
            {t('practiceContext.title')}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('practiceContext.topic')}: <span className="font-medium text-foreground">{context.topic}</span>
          </p>
          <p className="mt-2 line-clamp-2 text-sm leading-6">
            {t('practiceContext.question')}: {context.challengePrompt}
          </p>
          {context.studentAnswer && (
            <p className="mt-2 text-xs text-muted-foreground">
              {t('practiceContext.recentAnswer')}: {context.studentAnswer}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {typeof context.attempts === 'number' && (
              <span className="rounded-full border bg-[hsl(var(--platform-surface-app))] px-2.5 py-1">
                Attempts: {context.attempts}
              </span>
            )}
            {context.hintViewed && (
              <span className="rounded-full border bg-[hsl(var(--platform-surface-app))] px-2.5 py-1">
                Hint viewed
              </span>
            )}
          </div>
        </div>
        {context.returnTo && onBackToLesson && (
          <Button onClick={onBackToLesson} type="button" variant="outline">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t('practiceContext.backToLesson')}
          </Button>
        )}
      </div>
    </div>
  )
}

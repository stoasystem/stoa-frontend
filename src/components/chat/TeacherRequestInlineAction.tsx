import { GraduationCap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

export function TeacherRequestInlineAction({
  onRequestTeacher,
  isRequesting,
  feedback,
  feedbackTone = 'info',
}: {
  onRequestTeacher?: () => void
  isRequesting?: boolean
  feedback?: string | null
  feedbackTone?: 'info' | 'error'
}) {
  const { t } = useTranslation('chat')
  const failed = feedbackTone === 'error'

  return (
    <div className="mt-4 rounded-lg border border-border/70 bg-secondary/40 p-3">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-2">
          <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--accent))]" aria-hidden="true" />
          <div className="min-w-0">
            <div className="break-words text-sm font-medium text-foreground">
              {t('teacher.title')}
            </div>
            <p className="mt-1 break-words text-xs leading-5 text-muted-foreground">
              {t('teacher.description')}
            </p>
            {feedback && (
              <p
                className={
                  failed
                    ? 'mt-2 break-words text-xs leading-5 text-destructive'
                    : 'mt-2 break-words text-xs leading-5 text-[hsl(var(--accent))]'
                }
                role={failed ? 'alert' : undefined}
              >
                {feedback}
              </p>
            )}
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-auto min-h-9 shrink-0 whitespace-normal py-2 text-center leading-5"
            onClick={onRequestTeacher}
            disabled={!onRequestTeacher || isRequesting}
            aria-busy={isRequesting}
          >
          {isRequesting ? t('status.pending') : failed ? t('teacher.retry') : t('teacher.cta')}
        </Button>
      </div>
    </div>
  )
}

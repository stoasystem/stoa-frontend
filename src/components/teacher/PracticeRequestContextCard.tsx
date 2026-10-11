import { BookOpenCheck, CheckCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PracticeTeacherRequestContext } from '@/types/practice'

export function PracticeRequestContextCard({
  context,
}: {
  context: PracticeTeacherRequestContext
}) {
  const { t } = useTranslation('teacher')
  return (
    <Card className="border-primary/15 bg-card/95">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] p-2 text-primary">
            <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="brand-section-kicker">
              {t('practiceContext.source', {
                source: context.source === 'question-bank' ? t('practiceContext.library') : t('practiceContext.path'),
              })}
            </p>
            <CardTitle className="text-xl">{t('practiceContext.title')}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <ContextItem label={t('practiceContext.topic')} value={context.topic} />
          <ContextItem label={t('practiceContext.attempts')} value={`${context.attempts}`} />
          <ContextItem label={t('practiceContext.answer')} value={context.studentAnswer || t('practiceContext.notRecorded')} />
          <ContextItem label={t('practiceContext.hint')} value={context.hintViewed ? t('practiceContext.yes') : t('practiceContext.no')} />
        </div>
        {context.challengePrompt && (
          <div className="rounded-md border bg-[hsl(var(--platform-surface-app))] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{t('practiceContext.question')}</p>
            <p className="mt-2 text-sm leading-6">{context.challengePrompt}</p>
          </div>
        )}
        <div className="flex gap-2 rounded-md border bg-[hsl(var(--platform-surface-app))] p-3 text-sm leading-6 text-muted-foreground">
          <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <p>
            {t('practiceContext.help')}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function ContextItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-[hsl(var(--platform-surface-app))] p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  )
}

import { CircleAlert, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MathRenderer } from '@/components/ui/MathRenderer'
import { settleTruncatedMarkdown } from '@/lib/truncatedMarkdown'
import type { TeacherAssistanceSummary } from '@/types/teacher'

type Props = {
  summary?: TeacherAssistanceSummary
  isLoading: boolean
  isError: boolean
}

/*
 * The card's own wording is translated here. The summary bodies inside it are
 * not: `studentContextSummary`, `questionSummary`, `aiAnswerSummary`,
 * `suggestedFocus` and `weakTopics` are written by the backend
 * (teacher_assistance_service.py) and arrive in whatever language it used.
 *
 * `aiAnswerSummary` is the start of the assistant's latest answer, its own
 * Markdown cut at 360 characters (stoa-backend#181): drawn as Ask draws it,
 * once a formula or emphasis the cut left half open is taken out (#545).
 * `questionSummary` is the student's own words, shown as they are.
 */
export function TeacherAssistanceSummaryCard({ summary, isLoading, isError }: Props) {
  const { t } = useTranslation('teacher')

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              {t('assistance.title')}
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{t('assistance.description')}</p>
          </div>
          {summary && (
            <Badge variant="secondary">{t('assistance.sources', { count: summary.sourceCount })}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <p className="text-sm text-muted-foreground">{t('assistance.loading')}</p>}
        {isError && (
          <p className="flex items-center gap-2 text-sm text-destructive">
            <CircleAlert className="h-4 w-4" aria-hidden="true" />
            {t('assistance.error')}
          </p>
        )}
        {!isLoading && !isError && !summary && (
          <p className="text-sm text-muted-foreground">{t('assistance.empty')}</p>
        )}
        {summary && (
          <>
            <div className="grid gap-3 lg:grid-cols-2">
              <SummaryBlock title={t('assistance.studentContext')} value={summary.studentContextSummary} />
              <SummaryBlock title={t('assistance.suggestedFocus')} value={summary.suggestedFocus} />
            </div>
            <SummaryBlock title={t('assistance.question')} value={summary.questionSummary || t('assistance.noQuestion')} />
            <SummaryBlock title={t('assistance.assistantAnswer')}>
              {summary.aiAnswerSummary ? (
                <MathRenderer>{settleTruncatedMarkdown(summary.aiAnswerSummary)}</MathRenderer>
              ) : (
                t('assistance.noAnswer')
              )}
            </SummaryBlock>
            <div className="flex flex-wrap gap-2">
              {summary.weakTopics.length === 0 && (
                <Badge variant="outline">{t('assistance.noWeakTopics')}</Badge>
              )}
              {summary.weakTopics.map((topic) => (
                <Badge key={topic} variant="outline">{topic}</Badge>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function SummaryBlock({ title, value, children }: { title: string; value?: string; children?: ReactNode }) {
  return (
    <div className="rounded-md border border-border/70 p-3">
      <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">{title}</p>
      <p className="mt-2 break-words text-sm leading-6">{children ?? value}</p>
    </div>
  )
}

import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getSubjectLabel } from '@/lib/displayLabels'
import { formatDayAndMonth } from '@/lib/formatDateTime'
import type { RecentQuestion } from '@/types/dashboard'

export function RecentQuestionsCard({ questions }: { questions: RecentQuestion[] }) {
  const { t } = useTranslation('practice')
  return (
    <Card className="border-border/70 bg-card/90 shadow-[var(--platform-shadow-card)]">
      <CardHeader>
        <CardTitle className="text-base">{t('dashboard.recentQuestions')}</CardTitle>
        <CardDescription>{t('progress.recentQuestions')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {questions.map((question) => (
          <div
            key={question.id}
            className="flex items-start justify-between gap-4 rounded-md border border-border/70 bg-[hsl(var(--platform-surface-app))] p-4"
          >
            <div className="min-w-0">
              <div className="text-sm font-medium leading-5">{question.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {getSubjectLabel(question.subject, t)} · {formatDayAndMonth(question.createdAt)}
              </div>
            </div>
            <Badge className="shrink-0" variant="secondary">
              {t(`dashboard.questionStatus.${question.status}`)}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useReportsTrail } from '@/hooks/parent/useReportsTrail'
import type { ChildLearningSummary } from '@/types/parent'

export function ChildSummaryHeader({ summary }: { summary: ChildLearningSummary }) {
  const { t } = useTranslation('parent')
  // Opened from Reports, the child's other pages are still Reports' (#411).
  const { keep } = useReportsTrail()
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold">{summary.student.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{summary.student.grade}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link to={keep(`/parent/children/${summary.student.id}/report`)}>{t('summary.weeklyReportLink')}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to={keep(`/parent/children/${summary.student.id}/history`)}>{t('summary.learningHistoryLink')}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to={keep(`/parent/children/${summary.student.id}/progress`)}>{t('summary.progressLink')}</Link>
        </Button>
      </div>
    </div>
  )
}

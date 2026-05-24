import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { PageSkeleton } from '@/components/common/PageSkeleton'
import { ParentReportRecommendations } from '@/components/parent/ParentReportRecommendations'
import { ParentReportStats } from '@/components/parent/ParentReportStats'
import { ParentReportSubjects } from '@/components/parent/ParentReportSubjects'
import { ParentReportSummaryCard } from '@/components/parent/ParentReportSummaryCard'
import { Button } from '@/components/ui/button'
import { useChildReportQuery } from '@/hooks/parent/useChildReportQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { trackEvent } from '@/services/analytics/analyticsClient'

export function ChildReportPage() {
  const { childId } = useParams()
  const reportQuery = useChildReportQuery(childId)
  const report = reportQuery.data

  useEffect(() => {
    if (!report) return

    trackEvent('parent_report_viewed', {
      childId: report.student.id,
      reportId: report.id,
      periodLabel: report.period.label,
    })
  }, [report])

  return (
    <DashboardLayout>
      <PageContainer className="p-0">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <PageHeader
            className="mb-0"
            title="Weekly Report"
            description="Parent-visible progress, topic risks, and next steps for the selected child."
          />
          {childId && (
            <Button asChild variant="outline">
              <Link to={`/parent/children/${childId}`}>Child summary</Link>
            </Button>
          )}
        </div>
        {reportQuery.isLoading && <PageSkeleton rows={4} />}
        {reportQuery.isError && <p className="text-sm text-destructive">Failed to load report.</p>}
        {report && (
          <div className="space-y-6">
            <ParentReportSummaryCard report={report} />
            <ParentReportStats stats={report.stats} />
            <ParentReportSubjects subjects={report.topSubjects} weakTopics={report.weakTopics} />
            <ParentReportRecommendations recommendations={report.recommendations} />
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}

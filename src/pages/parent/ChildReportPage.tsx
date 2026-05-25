import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BackButton } from '@/components/common/BackButton'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import { PageContainer } from '@/components/common/PageContainer'
import { PageActions } from '@/components/common/PageActions'
import { PageHeader } from '@/components/common/PageHeader'
import { PageSkeleton } from '@/components/common/PageSkeleton'
import { ParentReportRecommendations } from '@/components/parent/ParentReportRecommendations'
import { ParentReportStats } from '@/components/parent/ParentReportStats'
import { ParentReportSubjects } from '@/components/parent/ParentReportSubjects'
import { ParentReportSummaryCard } from '@/components/parent/ParentReportSummaryCard'
import { ParentValueCard } from '@/components/parent/ParentValueCard'
import { UpgradePromptCard } from '@/components/parent/UpgradePromptCard'
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
          <div className="space-y-3">
            <Breadcrumbs
              items={[
                { label: 'Parent', to: '/parent' },
                { label: report?.student.name ?? 'Child', to: childId ? `/parent/children/${childId}` : undefined },
                { label: 'Weekly report' },
              ]}
            />
            <PageHeader
              className="mb-0"
              title="Weekly Report"
              description="Parent-visible progress, topic risks, and next steps for the selected child."
            />
          </div>
          <PageActions
            primary={
              childId && (
                <Button asChild>
                  <Link to={`/parent/children/${childId}/monthly-report`}>Monthly report</Link>
                </Button>
              )
            }
            secondary={childId && <BackButton label="Child summary" to={`/parent/children/${childId}`} />}
          />
        </div>
        {reportQuery.isLoading && <PageSkeleton rows={4} />}
        {reportQuery.isError && <p className="text-sm text-destructive">Failed to load report.</p>}
        {report && (
          <div className="space-y-6">
            <ParentReportSummaryCard report={report} />
            <ParentReportStats stats={report.stats} />
            <ParentReportSubjects subjects={report.topSubjects} weakTopics={report.weakTopics} />
            <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
              <ParentValueCard />
              <UpgradePromptCard source="parent_report" />
            </div>
            <ParentReportRecommendations recommendations={report.recommendations} />
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}

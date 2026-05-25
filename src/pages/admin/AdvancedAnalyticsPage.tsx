import { useEffect } from 'react'
import { FunnelChart } from '@/components/analytics/FunnelChart'
import { MetricCard } from '@/components/analytics/MetricCard'
import { RetentionTable } from '@/components/analytics/RetentionTable'
import { SubjectBarChart } from '@/components/analytics/SubjectBarChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { useAdvancedAnalyticsOverviewQuery } from '@/hooks/admin/useAdvancedAnalyticsOverviewQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { trackEvent } from '@/services/analytics/analyticsClient'

export function AdvancedAnalyticsContent({ scope = 'platform' }: { scope?: string }) {
  const analyticsQuery = useAdvancedAnalyticsOverviewQuery(scope)

  if (!analyticsQuery.data) return null

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Weekly active students" value={analyticsQuery.data.weeklyActiveStudents} />
        <MetricCard label="Weekly active parents" value={analyticsQuery.data.weeklyActiveParents} />
        <MetricCard label="Teacher help rate" value={`${Math.round(analyticsQuery.data.teacherHelpRequestRate * 100)}%`} />
        <MetricCard label="File upload rate" value={`${Math.round(analyticsQuery.data.fileUploadRate * 100)}%`} />
        <MetricCard label="Report view rate" value={`${Math.round(analyticsQuery.data.parentReportViewRate * 100)}%`} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Questions by subject</CardTitle>
          </CardHeader>
          <CardContent>
            <SubjectBarChart data={analyticsQuery.data.questionsBySubject} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Conversion funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <FunnelChart data={analyticsQuery.data.conversionFunnel} />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Retention cohorts</CardTitle>
        </CardHeader>
        <CardContent>
          <RetentionTable cohorts={analyticsQuery.data.retentionCohorts} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Churn-risk signals</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {analyticsQuery.data.churnRiskStudents.map((student) => (
            <div key={student.id} className="rounded-md border p-3">
              <p className="font-medium">{student.name}</p>
              <p className="text-sm text-muted-foreground">{student.riskReason}</p>
              <p className="mt-2 text-sm">{student.suggestedAction}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  )
}

export function AdvancedAnalyticsPage() {
  useEffect(() => {
    trackEvent('advanced_analytics_viewed', { scope: 'platform' })
  }, [])

  return (
    <DashboardLayout>
      <PageContainer size="wide" className="p-0">
        <PageHeader
          eyebrow="Admin"
          title="Advanced analytics"
          description="Review operational analytics across learning activity, retention, conversion, and teacher support."
        />
        <AdvancedAnalyticsContent />
      </PageContainer>
    </DashboardLayout>
  )
}

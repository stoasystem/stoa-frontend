import { useEffect } from 'react'
import { toast } from 'sonner'
import { Link, useParams } from 'react-router-dom'
import { BackButton } from '@/components/common/BackButton'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import { PageActions } from '@/components/common/PageActions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { useParentMonthlyReportQuery } from '@/hooks/learning/useParentMonthlyReportQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { trackEvent } from '@/services/analytics/analyticsClient'

export function ParentMonthlyReportPage() {
  const { childId = 'student-anna' } = useParams()
  const reportQuery = useParentMonthlyReportQuery(childId)

  useEffect(() => {
    trackEvent('parent_monthly_report_viewed', { childId })
  }, [childId])

  return (
    <DashboardLayout>
      <PageContainer size="wide" className="p-0">
        <PageHeader
          eyebrow="Parent report"
          title="Monthly learning report"
          description="A higher-level report that connects usage, weak-point trends, teacher support, and parent actions."
          actions={
            <PageActions
              primary={
                <Button asChild>
                  <Link to={`/parent/children/${childId}/report`}>Weekly report</Link>
                </Button>
              }
              secondary={<BackButton label="Child summary" to={`/parent/children/${childId}`} />}
              tertiary={
                <Button variant="outline" onClick={() => toast.info('PDF export will be available later.')}>
                  Download PDF
                </Button>
              }
            />
          }
        />
        <Breadcrumbs
          className="mb-6"
          items={[
            { label: 'Parent', to: '/parent' },
            { label: reportQuery.data?.student.name ?? 'Child', to: `/parent/children/${childId}` },
            { label: 'Monthly report' },
          ]}
        />
        {reportQuery.data && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{reportQuery.data.monthLabel} · {reportQuery.data.student.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">
                {reportQuery.data.summary}
              </CardContent>
            </Card>
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Subject breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {reportQuery.data.subjectBreakdown.map((subject) => (
                    <div key={subject.subject} className="rounded-md border p-3">
                      <p className="font-medium">{subject.subject}</p>
                      <p className="text-sm text-muted-foreground">{subject.summary}</p>
                      <p className="mt-2 text-sm">
                        {subject.questionsAnswered} questions · {subject.teacherHelpRequests} teacher-help requests
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Weak-point trend</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {reportQuery.data.weakPointTrend.map((trend) => (
                    <div key={trend.topic} className="rounded-md border p-3">
                      <p className="font-medium">{trend.topic}</p>
                      <p className="text-sm text-muted-foreground">{trend.subject} · {trend.trend}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{trend.summary}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {reportQuery.data.recommendations.map((item) => (
                    <p key={item} className="rounded-md border p-3 text-sm text-muted-foreground">{item}</p>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Suggested parent actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {reportQuery.data.suggestedParentActions.map((item) => (
                    <p key={item} className="rounded-md border p-3 text-sm text-muted-foreground">{item}</p>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}

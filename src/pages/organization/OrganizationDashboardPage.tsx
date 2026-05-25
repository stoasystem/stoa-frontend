import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { OrganizationMetricCards } from '@/components/organization/OrganizationMetricCards'
import { OrganizationSelector } from '@/components/organization/OrganizationSelector'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { useOrganizationsQuery } from '@/hooks/organization/useOrganizationsQuery'
import { useOrganizationSummaryQuery } from '@/hooks/organization/useOrganizationSummaryQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { trackEvent } from '@/services/analytics/analyticsClient'

export function OrganizationDashboardPage() {
  const organizationsQuery = useOrganizationsQuery()
  const organizations = organizationsQuery.data?.items ?? []
  const [organizationId, setOrganizationId] = useState('')
  const summaryQuery = useOrganizationSummaryQuery(organizationId)

  useEffect(() => {
    trackEvent('organization_dashboard_viewed', { organizationId })
  }, [organizationId])

  return (
    <DashboardLayout>
      <PageContainer size="wide" className="p-0">
        <PageHeader
          eyebrow="Organization"
          title="Workspace dashboard"
          description="Frontend-only organization overview for school and tutoring center demos."
          actions={<Button asChild><Link to="/organization/students">View students</Link></Button>}
        />
        <OrganizationSelector
          organizations={organizations}
          selectedOrganizationId={organizationId}
          onSelect={setOrganizationId}
        />
        {summaryQuery.data && <OrganizationMetricCards summary={summaryQuery.data} />}
        {summaryQuery.data && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Weak topics across workspace</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {summaryQuery.data.weakTopics.map((topic) => (
                  <div key={topic.id} className="rounded-md border p-3">
                    <p className="font-medium">{topic.topic}</p>
                    <p className="text-sm text-muted-foreground">
                      {topic.subject} · {topic.affectedStudents} students affected
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Tutor workload</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {summaryQuery.data.tutorWorkload.map((tutor) => (
                  <div key={tutor.tutorId} className="rounded-md border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{tutor.name}</p>
                      <p className="text-sm text-muted-foreground">{tutor.pendingRequests} pending</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{tutor.resolvedThisWeek} resolved this week</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}

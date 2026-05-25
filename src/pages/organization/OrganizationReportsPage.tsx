import { useState } from 'react'
import { Link } from 'react-router-dom'
import { OrganizationSelector } from '@/components/organization/OrganizationSelector'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { useOrganizationsQuery } from '@/hooks/organization/useOrganizationsQuery'
import { useOrganizationReportsQuery } from '@/hooks/organization/useOrganizationReportsQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function OrganizationReportsPage() {
  const organizationsQuery = useOrganizationsQuery()
  const organizations = organizationsQuery.data?.items ?? []
  const [organizationId, setOrganizationId] = useState('')
  const reportsQuery = useOrganizationReportsQuery(organizationId)

  return (
    <DashboardLayout>
      <PageContainer size="wide" className="p-0">
        <PageHeader
          eyebrow="Organization"
          title="Reports overview"
          description="Weekly and monthly report entry points for parent-facing value demos."
        />
        <OrganizationSelector
          organizations={organizations}
          selectedOrganizationId={organizationId}
          onSelect={setOrganizationId}
        />
        {reportsQuery.data && (
          <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {[
                ['Weekly sent', reportsQuery.data.weeklyReportsSent],
                ['Monthly ready', reportsQuery.data.monthlyReportsReady],
                ['Parent views', reportsQuery.data.parentViewsThisWeek],
              ].map(([label, value]) => (
                <Card key={label}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-semibold">{value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Report highlights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reportsQuery.data.reportHighlights.map((highlight) => (
                  <p key={highlight} className="rounded-md border p-3 text-sm text-muted-foreground">
                    {highlight}
                  </p>
                ))}
                <Button asChild>
                  <Link to="/parent/children/student-anna/monthly-report">Open monthly report demo</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}

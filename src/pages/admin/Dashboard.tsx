import { AdminTeacherSlaCard } from '@/components/admin/AdminTeacherSlaCard'
import { AdminOperationCard } from '@/components/admin/AdminOperationCard'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAdminPlatformStatsQuery } from '@/hooks/admin/useAdminPlatformStatsQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function AdminDashboardPage() {
  const platformStatsQuery = useAdminPlatformStatsQuery()

  return (
    <DashboardLayout>
      <PageContainer className="p-0">
        <PageHeader
          eyebrow="Admin operations"
          title="Pilot operations"
          description="Monitor the minimum operational signals needed for pilot readiness."
          actions={<Badge variant="secondary">Basic operations</Badge>}
        />
        <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Operations scope</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                Admin operations are limited to platform status, usage summary, and feedback
                triage boundaries for the pilot.
              </p>
              <p>
                Full user management, role changes, account status controls, support cases, and
                platform content administration remain explicitly deferred.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Service readiness</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>Use these views to monitor learning support, usage patterns, and feedback triage.</p>
              <p>Configuration diagnostics are available only in the internal debug panel.</p>
            </CardContent>
          </Card>
        </div>
        <AdminTeacherSlaCard stats={platformStatsQuery.data?.teacher_sla} />
        <div className="grid gap-4 md:grid-cols-2">
          <AdminOperationCard
            title="Usage summary"
            description="Review active users, role counts, messages, help requests, uploads, and feedback totals."
            to="/admin/usage"
          />
          <AdminOperationCard
            title="Feedback triage"
            description="Review pilot feedback items without adding full support workflow controls."
            to="/admin/feedback"
          />
          <AdminOperationCard
            title="Help requests"
            description="Monitor teacher-help request volume and launch-time service status."
            to="/admin/help-requests"
          />
          <AdminOperationCard
            title="Billing interest"
            description="Review plan interest before real payment collection is enabled."
            to="/admin/billing-interest"
          />
        </div>
      </PageContainer>
    </DashboardLayout>
  )
}

export default AdminDashboardPage

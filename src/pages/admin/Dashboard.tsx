import { AdminEnvironmentCard } from '@/components/admin/AdminEnvironmentCard'
import { AdminOperationCard } from '@/components/admin/AdminOperationCard'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiBaseUrl, appEnv } from '@/lib/env'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import packageJson from '../../../package.json'

export function AdminDashboardPage() {
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
              <CardTitle className="text-base">Phase 45 scope</CardTitle>
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
          <AdminEnvironmentCard
            environment={appEnv}
            apiBaseUrl={apiBaseUrl}
            version={packageJson.version}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <AdminOperationCard
            title="Usage summary"
            description="Review active users, role counts, messages, help requests, uploads, and feedback totals when the backend endpoint is available."
            to="/admin/usage"
          />
          <AdminOperationCard
            title="Feedback triage"
            description="Review the feedback list contract and any returned pilot feedback items without adding full support workflow controls."
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

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AdminUsageSummary } from '@/services/admin/adminApi'

type AdminUsageSummaryCardsProps = {
  summary: AdminUsageSummary
}

export function AdminUsageSummaryCards({ summary }: AdminUsageSummaryCardsProps) {
  const metrics = [
    { label: 'Active users', value: summary.activeUsers },
    { label: 'Messages', value: summary.messages },
    { label: 'Help requests', value: summary.helpRequests },
    { label: 'Uploads', value: summary.uploads },
    { label: 'Feedback', value: summary.feedback },
  ]

  const roles = [
    { label: 'Students', value: summary.roleCounts.student },
    { label: 'Parents', value: summary.roleCounts.parent },
    { label: 'Tutors', value: summary.roleCounts.tutor },
    { label: 'Admins', value: summary.roleCounts.admin },
  ]

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-2xl font-semibold">{metric.value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Role counts</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {roles.map((role) => (
            <div key={role.label} className="rounded-md border p-3">
              <p className="text-sm text-muted-foreground">{role.label}</p>
              <p className="mt-1 text-xl font-semibold">{role.value.toLocaleString()}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      {summary.generatedAt && (
        <p className="text-xs text-muted-foreground">
          Generated {new Date(summary.generatedAt).toLocaleString()}
        </p>
      )}
    </div>
  )
}

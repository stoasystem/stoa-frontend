import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { OrganizationSummary } from '@/types/organization'

export function OrganizationMetricCards({ summary }: { summary: OrganizationSummary }) {
  const metrics = [
    { label: 'Active students', value: summary.activeStudents, helper: `${summary.totalStudents} total` },
    { label: 'Questions this week', value: summary.questionsAskedThisWeek, helper: 'Across the workspace' },
    { label: 'Teacher help', value: summary.teacherHelpRequestsThisWeek, helper: 'Requests this week' },
    { label: 'Parent views', value: summary.parentReportViewsThisWeek, helper: 'Report views this week' },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{metric.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{metric.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{metric.helper}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

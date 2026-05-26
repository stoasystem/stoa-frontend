import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ParentWeeklyReport } from '@/types/parentReport'

export function ParentReportSummaryCard({ report }: { report: ParentWeeklyReport }) {
  return (
    <Card className="border-primary/15 bg-card/90">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="editorial-heading text-2xl">{report.student.name}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{report.student.grade}</p>
          </div>
          <Badge variant="secondary">{report.period.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6">{report.summary}</p>
        <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
          <div>
            <p className="font-medium text-foreground">Period</p>
            <p>
              {formatDate(report.period.startDate)} - {formatDate(report.period.endDate)}
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">Generated</p>
            <p>{formatDateTime(report.generatedAt)}</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Report ID</p>
            <p>{report.id}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString()
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString()
}

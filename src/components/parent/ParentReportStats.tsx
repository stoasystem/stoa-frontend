import { Card, CardContent } from '@/components/ui/card'
import type { ParentReportStat } from '@/types/parentReport'

export function ParentReportStats({ stats }: { stats: ParentReportStat[] }) {
  if (stats.length === 0) {
    return <p className="text-sm text-muted-foreground">No report stats are available yet.</p>
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

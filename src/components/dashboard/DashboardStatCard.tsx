import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DashboardStat } from '@/types/dashboard'

export function DashboardStatCard({ stat }: { stat: DashboardStat }) {
  return (
    <Card className="stoa-card-quiet">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-[hsl(var(--stoa-brand-burgundy))]">{stat.value}</div>
        <p className="mt-1 text-sm text-muted-foreground">{stat.description}</p>
      </CardContent>
    </Card>
  )
}

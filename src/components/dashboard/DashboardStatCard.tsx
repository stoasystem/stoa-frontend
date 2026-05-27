import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DashboardStat } from '@/types/dashboard'

export function DashboardStatCard({ stat }: { stat: DashboardStat }) {
  return (
    <Card className="h-full border-border/70 bg-card/85 shadow-[var(--platform-shadow-card)]">
      <CardHeader className="p-4 pb-1 sm:p-6 sm:pb-2">
        <CardTitle className="text-[0.7rem] font-semibold leading-4 text-muted-foreground sm:text-sm">
          {stat.label}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
        <div className="text-xl font-semibold leading-none text-[hsl(var(--stoa-brand-burgundy))] sm:text-2xl">
          {stat.value}
        </div>
        <p className="mt-2 text-xs leading-4 text-muted-foreground sm:text-sm sm:leading-5">{stat.description}</p>
      </CardContent>
    </Card>
  )
}

import { Clock, Inbox, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { TutorStats } from '@/types/tutor'

const fallbackStats: TutorStats = {
  pendingRequests: 0,
  resolvedToday: 0,
  averageResponseTimeMinutes: 0,
}

export function TutorStatsCards({ stats = fallbackStats }: { stats?: TutorStats }) {
  const items = [
    { label: 'Pending', value: stats.pendingRequests, icon: Inbox },
    { label: 'Resolved today', value: stats.resolvedToday, icon: CheckCircle2 },
    { label: 'Avg response', value: `${stats.averageResponseTimeMinutes}m`, icon: Clock },
  ]

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <Card key={item.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

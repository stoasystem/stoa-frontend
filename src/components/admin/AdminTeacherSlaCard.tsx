import { AlertTriangle, CheckCircle2, Clock3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AdminTeacherSlaStats } from '@/services/admin/adminApi'

export function AdminTeacherSlaCard({ stats }: { stats?: AdminTeacherSlaStats }) {
  const averageMinutes = toMinutes(stats?.first_reply.average_seconds)
  const targetMinutes = toMinutes(stats?.targets.first_reply_seconds) ?? 30
  const buckets = stats?.buckets ?? { within_target: 0, at_risk: 0, breached: 0, unknown: 0 }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Teacher SLA</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCell label="Tracked" value={stats?.tracked_questions ?? 0} />
          <MetricCell label="Avg reply" value={averageMinutes === null ? '-' : `${averageMinutes}m`} />
          <MetricCell label="Target" value={`${targetMinutes}m`} />
        </div>
        <div className="grid gap-2 text-sm sm:grid-cols-3">
          <BucketCell icon={CheckCircle2} label="Within" value={buckets.within_target} className="text-emerald-700" />
          <BucketCell icon={Clock3} label="At risk" value={buckets.at_risk} className="text-amber-700" />
          <BucketCell icon={AlertTriangle} label="Breached" value={buckets.breached} className="text-red-700" />
        </div>
      </CardContent>
    </Card>
  )
}

function MetricCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="text-xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function BucketCell({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: typeof CheckCircle2
  label: string
  value: number
  className: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-2">
      <Icon className={`h-4 w-4 ${className}`} aria-hidden="true" />
      <span className="font-medium">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  )
}

function toMinutes(seconds?: number | null) {
  if (typeof seconds !== 'number') return null
  return Math.round(seconds / 60)
}

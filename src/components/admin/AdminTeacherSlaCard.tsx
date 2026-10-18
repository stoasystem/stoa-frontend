import { AlertTriangle, CheckCircle2, Clock3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AdminTeacherSlaStats } from '@/services/admin/adminApi'

/*
 * The figures are shown only once the stats have been read. A failed or
 * pending read used to fall through to "0 tracked, 0 breached" and an
 * invented 30-minute target, which reads as a healthy system (#262).
 */
export function AdminTeacherSlaCard({
  stats,
  isLoading = false,
  isError = false,
}: {
  stats?: AdminTeacherSlaStats
  isLoading?: boolean
  isError?: boolean
}) {
  const { t } = useTranslation('admin')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('sla.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isError ? (
          <p role="alert" className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            {t('sla.unavailable')}
          </p>
        ) : !stats ? (
          <p className="text-sm text-muted-foreground">{isLoading ? t('sla.loading') : t('sla.unavailable')}</p>
        ) : (
          <SlaFigures stats={stats} />
        )}
      </CardContent>
    </Card>
  )
}

function SlaFigures({ stats }: { stats: AdminTeacherSlaStats }) {
  const { t } = useTranslation('admin')
  const averageMinutes = toMinutes(stats.first_reply.average_seconds)
  const targetMinutes = toMinutes(stats.targets.first_reply_seconds)
  const buckets = stats.buckets

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCell label={t('sla.tracked')} value={stats.tracked_questions} />
        <MetricCell
          label={t('sla.averageReply')}
          value={averageMinutes === null ? '-' : t('sla.minutes', { count: averageMinutes })}
        />
        <MetricCell label={t('sla.target')} value={targetMinutes === null ? '-' : t('sla.minutes', { count: targetMinutes })} />
      </div>
      <div className="grid gap-2 text-sm sm:grid-cols-3">
        <BucketCell icon={CheckCircle2} label={t('sla.within')} value={buckets.within_target} className="text-emerald-700" />
        <BucketCell icon={Clock3} label={t('sla.atRisk')} value={buckets.at_risk} className="text-amber-700" />
        <BucketCell icon={AlertTriangle} label={t('sla.breached')} value={buckets.breached} className="text-red-700" />
      </div>
    </>
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

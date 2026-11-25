import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Sparkline } from '@/components/admin/systemHealth/charts'
import { featureName, formatCount, formatMs, formatRate, systemFeaturePath } from '@/components/admin/systemHealth/format'
import { StatusBadge } from '@/components/admin/systemHealth/StatusBadge'
import type { FeatureHealth, SystemWindow } from '@/services/admin/systemHealthApi'

/** One feature on the overview; the whole card is the link to its details. */
export function FeatureCard({ feature, window }: { feature: FeatureHealth; window: SystemWindow }) {
  const { t } = useTranslation('admin')
  const name = featureName(t, feature.key)
  return (
    <Link
      to={systemFeaturePath(feature.key, window)}
      data-feature-card={feature.key}
      className="flex flex-col gap-3 rounded-card border border-hairline bg-surface p-4 text-ink no-underline transition-colors ease-out hover:bg-ground"
      style={{ transitionDuration: 'var(--motion-press)' }}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="min-w-0" style={{ font: 'var(--t-headline)' }}>
          {name}
        </span>
        <StatusBadge status={feature.status} />
      </span>
      <Sparkline
        points={feature.spark}
        status={feature.status}
        limitMs={feature.p95LimitMs}
        label={t('systemHealth.sparkLabel', { name })}
      />
      <dl className="m-0 grid grid-cols-3 gap-2 text-sm">
        <Figure label={t('systemHealth.metric.requests')} value={formatCount(feature.requests)} />
        <Figure label={t('systemHealth.metric.errorRate')} value={formatRate(feature.errorRate)} />
        <Figure label={t('systemHealth.metric.p95')} value={formatMs(t, feature.p95Ms)} />
      </dl>
    </Link>
  )
}

export function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col-reverse gap-0.5">
      <dt className="truncate text-xs text-caption">{label}</dt>
      <dd className="m-0 truncate font-semibold text-ink">{value}</dd>
    </div>
  )
}

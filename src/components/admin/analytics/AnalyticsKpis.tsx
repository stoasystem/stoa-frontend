import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { formattingLocale } from '@/i18n/languages'
import { formatCount, formatDuration, formatPercent, MISSING } from '@/components/admin/analytics/format'
import { cn } from '@/lib/utils'
import type { AnalyticsKpis as Kpis } from '@/services/admin/analyticsApi'

type Tile = { key: string; label: string; value: string; note?: ReactNode }

export function AnalyticsKpis({ kpis }: { kpis: Kpis }) {
  const { t, i18n } = useTranslation('admin')
  const locale = formattingLocale(i18n.language)

  const change = kpis.dauChange
  const changeNote =
    change === null || !Number.isFinite(change) ? null : (
      <span className={cn(change > 0 && 'text-green', change < 0 && 'text-red')}>
        {t('usageAnalytics.kpis.dauChange', { change: formatPercent(change, locale, true) })}
      </span>
    )

  const tiles: Tile[] = [
    { key: 'dau', label: t('usageAnalytics.kpis.dau'), value: formatCount(kpis.dau, locale), note: changeNote },
    { key: 'wau', label: t('usageAnalytics.kpis.wau'), value: formatCount(kpis.wau, locale) },
    { key: 'mau', label: t('usageAnalytics.kpis.mau'), value: formatCount(kpis.mau, locale) },
    {
      key: 'questions',
      label: t('usageAnalytics.kpis.questionsPerDay'),
      value: formatCount(kpis.questionsPerDay, locale),
      note:
        kpis.escalationRate === null
          ? null
          : t('usageAnalytics.kpis.escalation', { rate: formatPercent(kpis.escalationRate, locale) }),
    },
    { key: 'ai', label: t('usageAnalytics.kpis.aiP50'), value: formatDuration(kpis.aiP50Ms, t, locale) },
    {
      key: 'teacher',
      label: t('usageAnalytics.kpis.teacherP50'),
      value: formatDuration(kpis.teacherResponseP50Ms, t, locale),
    },
  ]

  return (
    <dl className="m-0 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {tiles.map((tile) => (
        <div key={tile.key} data-kpi={tile.key} className="flex flex-col gap-1 rounded-card border border-hairline bg-surface p-4">
          <dt className="text-sm text-caption">{tile.label}</dt>
          <dd className="m-0 text-2xl font-semibold text-ink">{tile.value}</dd>
          {tile.value === MISSING ? (
            <dd className="m-0 text-xs text-caption">{t('usageAnalytics.missing')}</dd>
          ) : tile.note ? (
            <dd className="m-0 text-xs text-caption">{tile.note}</dd>
          ) : null}
        </div>
      ))}
    </dl>
  )
}

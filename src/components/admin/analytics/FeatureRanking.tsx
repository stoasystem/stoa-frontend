import { useTranslation } from 'react-i18next'
import { formattingLocale } from '@/i18n/languages'
import { eventLabel, formatCount } from '@/components/admin/analytics/format'

export function FeatureRanking({ rows }: { rows: { event: string; count: number; uniqueUsers: number }[] }) {
  const { t, i18n } = useTranslation('admin')
  const locale = formattingLocale(i18n.language)

  if (rows.length === 0) {
    return <p className="m-0 text-sm text-caption">{t('usageAnalytics.noData')}</p>
  }

  const sorted = [...rows].sort((a, b) => b.count - a.count)
  const max = Math.max(1, sorted[0].count)

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="text-left text-xs text-caption">
          <th className="pb-2 font-medium">{t('usageAnalytics.ranking.feature')}</th>
          <th className="pb-2 text-right font-medium">{t('usageAnalytics.ranking.uses')}</th>
          <th className="pb-2 text-right font-medium">{t('usageAnalytics.ranking.people')}</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((row) => (
          <tr key={row.event} data-event={row.event} title={row.event}>
            <td className="w-full py-1.5 pr-3">
              <span className="block text-ink">{eventLabel(row.event, t)}</span>
              <span aria-hidden="true" className="mt-1 block h-2 rounded-full bg-fill">
                <span className="block h-2 rounded-full bg-accent" style={{ width: `${(row.count / max) * 100}%` }} />
              </span>
            </td>
            <td className="py-1.5 pl-3 text-right tabular-nums text-ink">{formatCount(row.count, locale)}</td>
            <td className="py-1.5 pl-3 text-right tabular-nums text-caption">{formatCount(row.uniqueUsers, locale)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

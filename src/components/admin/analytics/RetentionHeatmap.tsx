import { useTranslation } from 'react-i18next'
import { formattingLocale } from '@/i18n/languages'
import { formatCount, formatDay, formatPercent, MISSING } from '@/components/admin/analytics/format'
import { cn } from '@/lib/utils'

const WEEKS = [0, 1, 2, 3, 4]
// From this share up the cell is dark enough to carry --on-accent text.
const DARK_FROM = 0.55

export function RetentionHeatmap({ rows }: { rows: { cohortWeek: string; size: number; weeks: (number | null)[] }[] }) {
  const { t, i18n } = useTranslation('admin')
  const locale = formattingLocale(i18n.language)

  if (rows.length === 0) {
    return <p className="m-0 text-sm text-caption">{t('usageAnalytics.noData')}</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-1 text-sm">
        <thead>
          <tr className="text-left text-xs text-caption">
            <th className="font-medium">{t('usageAnalytics.retention.cohort')}</th>
            <th className="text-right font-medium">{t('usageAnalytics.retention.size')}</th>
            {WEEKS.map((week) => (
              <th key={week} className="text-center font-medium">
                {t('usageAnalytics.retention.week', { n: week })}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.cohortWeek} data-cohort={row.cohortWeek}>
              <th scope="row" className="whitespace-nowrap pr-2 text-left font-normal text-ink">
                {formatDay(row.cohortWeek, locale)}
              </th>
              <td className="pr-2 text-right tabular-nums text-caption">{formatCount(row.size, locale)}</td>
              {WEEKS.map((week) => {
                const value = row.weeks[week] ?? null
                if (value === null) {
                  return (
                    <td
                      key={week}
                      data-week={week}
                      title={t('usageAnalytics.retention.noValue')}
                      className="rounded-small bg-fill px-2 py-1.5 text-center text-caption"
                    >
                      {MISSING}
                    </td>
                  )
                }
                const share = Math.max(0, Math.min(1, value))
                return (
                  <td
                    key={week}
                    data-week={week}
                    className={cn(
                      'rounded-small px-2 py-1.5 text-center tabular-nums',
                      share >= DARK_FROM ? 'text-on-accent' : 'text-ink',
                    )}
                    style={{
                      background: `color-mix(in oklab, var(--accent) ${Math.round(share * 100)}%, var(--surface))`,
                    }}
                  >
                    {formatPercent(share, locale)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

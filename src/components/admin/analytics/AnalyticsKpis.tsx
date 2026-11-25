import type { TFunction } from 'i18next'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { formattingLocale } from '@/i18n/languages'
import { formatCount, formatDay, formatDuration, formatPercent, MISSING } from '@/components/admin/analytics/format'
import { cn } from '@/lib/utils'
import {
  COST_SERVICES,
  type AnalyticsKpis as Kpis,
  type CostPerActiveUser,
} from '@/services/admin/analyticsApi'

type Tile = { key: string; label: string; value: string; notes: ReactNode[]; wide?: boolean; explainsMissing?: boolean }

function formatUsd(value: number | null | undefined, locale: string) {
  if (value === null || value === undefined || !Number.isFinite(value)) return MISSING
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function changeNote(change: number | null | undefined, text: (change: string) => string, locale: string) {
  if (change === null || change === undefined || !Number.isFinite(change)) return null
  return (
    <span data-change className={cn(change > 0 && 'text-green', change < 0 && 'text-red')}>
      {text(formatPercent(change, locale, true))}
    </span>
  )
}

function serviceRank(service: string) {
  const index = (COST_SERVICES as readonly string[]).indexOf(service)
  return index < 0 ? COST_SERVICES.length : index
}

function costNotes(cost: CostPerActiveUser | null | undefined, t: TFunction, locale: string): ReactNode[] {
  if (!cost) return [<span data-cost-state="unavailable">{t('usageAnalytics.kpis.costUnavailable')}</span>]
  const notes: ReactNode[] = []
  if (cost.amountUsd === null || !Number.isFinite(cost.amountUsd)) {
    notes.push(<span data-cost-state="no-active">{t('usageAnalytics.kpis.costNoActiveUsers')}</span>)
  } else {
    const items = cost.breakdown.filter((item) => Number.isFinite(item.amountUsd) && item.amountUsd > 0)
    const sum = items.reduce((total, item) => total + item.amountUsd, 0)
    if (sum > 0) {
      const ordered = [...items].sort((a, b) => serviceRank(a.service) - serviceRank(b.service))
      notes.push(
        <span data-cost-breakdown>
          {ordered
            .map(
              (item) =>
                `${t(`usageAnalytics.kpis.costServices.${item.service}`, { defaultValue: item.service })} ${formatPercent(item.amountUsd / sum, locale)}`,
            )
            .join(' · ')}
        </span>,
      )
    }
  }
  notes.push(
    <span data-cost-total>
      {t('usageAnalytics.kpis.costTotal', {
        total: formatUsd(cost.totalUsd, locale),
        people: formatCount(cost.activeUsers, locale),
      })}
    </span>,
  )
  notes.push(
    <span data-cost-period>
      {t('usageAnalytics.kpis.costPeriod', {
        start: formatDay(cost.periodStart, locale),
        end: formatDay(cost.periodEnd, locale),
      })}
    </span>,
  )
  return notes
}

export function AnalyticsKpis({ kpis, days }: { kpis: Kpis; days: number }) {
  const { t, i18n } = useTranslation('admin')
  const locale = formattingLocale(i18n.language)

  const tiles: Tile[] = [
    {
      key: 'dau',
      label: t('usageAnalytics.kpis.dau'),
      value: formatCount(kpis.dau, locale),
      notes: [changeNote(kpis.dauChange, (change) => t('usageAnalytics.kpis.dauChange', { change }), locale)],
    },
    {
      key: 'wau',
      label: t('usageAnalytics.kpis.wau'),
      value: formatCount(kpis.wau, locale),
      notes: [changeNote(kpis.wauChange, (change) => t('usageAnalytics.kpis.wauChange', { change }), locale)],
    },
    {
      key: 'mau',
      label: t('usageAnalytics.kpis.mau'),
      value: formatCount(kpis.mau, locale),
      notes: [changeNote(kpis.mauChange, (change) => t('usageAnalytics.kpis.mauChange', { change }), locale)],
    },
    {
      key: 'questions',
      label: t('usageAnalytics.kpis.questionsPerDay'),
      value: formatCount(kpis.questionsPerDay, locale),
      notes: [
        changeNote(
          kpis.questionsPerDayChange,
          (change) => t('usageAnalytics.kpis.questionsPerDayChange', { change, days }),
          locale,
        ),
        kpis.escalationRate === null
          ? null
          : t('usageAnalytics.kpis.escalation', { rate: formatPercent(kpis.escalationRate, locale) }),
      ],
    },
    { key: 'ai', label: t('usageAnalytics.kpis.aiP50'), value: formatDuration(kpis.aiP50Ms, t, locale), notes: [] },
    {
      key: 'teacher',
      label: t('usageAnalytics.kpis.teacherP50'),
      value: formatDuration(kpis.teacherResponseP50Ms, t, locale),
      notes: [],
    },
    {
      key: 'cost',
      label: t('usageAnalytics.kpis.costPerActiveUser'),
      value: formatUsd(kpis.costPerActiveUser?.amountUsd, locale),
      notes: costNotes(kpis.costPerActiveUser, t, locale),
      wide: true,
      explainsMissing: true,
    },
  ]

  return (
    <dl className="m-0 grid grid-cols-2 gap-3 md:grid-cols-4">
      {tiles.map((tile) => {
        const notes = tile.notes.filter((note) => note !== null && note !== undefined)
        return (
          <div
            key={tile.key}
            data-kpi={tile.key}
            className={cn(
              'flex flex-col gap-1 rounded-card border border-hairline bg-surface p-4',
              tile.wide && 'col-span-2',
            )}
          >
            <dt className="text-sm text-caption">{tile.label}</dt>
            <dd className="m-0 text-2xl font-semibold text-ink">{tile.value}</dd>
            {tile.value === MISSING && !tile.explainsMissing ? (
              <dd className="m-0 text-xs text-caption">{t('usageAnalytics.missing')}</dd>
            ) : (
              notes.map((note, index) => (
                <dd key={index} className="m-0 text-xs text-caption">
                  {note}
                </dd>
              ))
            )}
          </div>
        )
      })}
    </dl>
  )
}

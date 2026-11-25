import { useTranslation } from 'react-i18next'
import { formattingLocale } from '@/i18n/languages'
import { formatCount, formatDay } from '@/components/admin/analytics/format'

// Chart geometry in viewBox units; the SVG scales uniformly with its width.
const VIEW = { width: 600, height: 160, pad: 8, endRadius: 5, endRing: 3 }

export function ActiveTrendChart({ series }: { series: { day: string; active: number }[] }) {
  const { t, i18n } = useTranslation('admin')
  const locale = formattingLocale(i18n.language)

  if (series.length === 0) {
    return <p className="m-0 text-sm text-caption">{t('usageAnalytics.noData')}</p>
  }

  const max = Math.max(1, ...series.map((point) => point.active))
  const innerW = VIEW.width - VIEW.pad * 2
  const innerH = VIEW.height - VIEW.pad * 2
  const step = series.length > 1 ? innerW / (series.length - 1) : 0
  const points = series.map((point, index) => ({
    ...point,
    x: VIEW.pad + (series.length > 1 ? index * step : innerW / 2),
    y: VIEW.pad + innerH - (point.active / max) * innerH,
  }))
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const baseline = VIEW.pad + innerH
  const area = `${line} L${points[points.length - 1].x},${baseline} L${points[0].x},${baseline} Z`
  const last = points[points.length - 1]
  const first = points[0]
  const hitWidth = Math.max(step, 1)

  return (
    <figure className="m-0 flex flex-col gap-2">
      <svg
        viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
        className="block h-auto w-full"
        role="img"
        aria-label={t('usageAnalytics.trend.summary', {
          count: formatCount(last.active, locale),
          day: formatDay(last.day, locale),
        })}
      >
        <line x1={VIEW.pad} x2={VIEW.width - VIEW.pad} y1={baseline} y2={baseline} className="stroke-hairline" />
        <path d={area} className="fill-accent-tint" />
        <path d={line} className="fill-none stroke-accent stroke-2" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={last.x} cy={last.y} r={VIEW.endRadius + VIEW.endRing} className="fill-surface" />
        <circle cx={last.x} cy={last.y} r={VIEW.endRadius} className="fill-accent" />
        {points.map((p) => (
          <rect
            key={p.day}
            data-day={p.day}
            x={p.x - hitWidth / 2}
            y={0}
            width={hitWidth}
            height={VIEW.height}
            className="fill-transparent"
          >
            <title>{`${formatDay(p.day, locale)}: ${formatCount(p.active, locale)}`}</title>
          </rect>
        ))}
      </svg>
      <figcaption className="flex justify-between text-xs text-caption">
        <span>{formatDay(first.day, locale)}</span>
        <span className="font-semibold text-ink">
          {t('usageAnalytics.trend.latest', { count: formatCount(last.active, locale) })}
        </span>
        <span>{formatDay(last.day, locale)}</span>
      </figcaption>
    </figure>
  )
}

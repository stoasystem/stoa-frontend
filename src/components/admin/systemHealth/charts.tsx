import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { FeatureSeriesPoint, FeatureStatus, SparkPoint, SystemWindow } from '@/services/admin/systemHealthApi'
import { formatBucket, formatCount, formatMs } from '@/components/admin/systemHealth/format'

const SPARK_STROKE: Record<FeatureStatus, string> = {
  ok: 'stroke-green',
  warn: 'stroke-gold',
  bad: 'stroke-red',
  unknown: 'stroke-tertiary',
}

const SPARK = { width: 100, height: 32, pad: 2 }

function niceCeil(value: number) {
  if (value <= 0) return 1
  const step = 10 ** Math.floor(Math.log10(value))
  for (const factor of [1, 2, 2.5, 5, 10]) {
    if (factor * step >= value) return factor * step
  }
  return 10 * step
}

/** p95 over the window as a line, with the limit dashed where it fits. */
export function Sparkline({
  points,
  status,
  limitMs,
  label,
}: {
  points: SparkPoint[] | null
  status: FeatureStatus
  limitMs: number | null
  label: string
}) {
  const values = (points ?? []).map((point) => point.p95Ms)
  const known = values.filter((value): value is number => value !== null)
  if (known.length < 2) {
    return <div aria-hidden="true" data-spark="empty" className="h-8 w-full rounded-small bg-fill" />
  }
  const top = Math.max(...known, limitMs ?? 0) || 1
  const step = (SPARK.width - SPARK.pad * 2) / (values.length - 1)
  const y = (value: number) => SPARK.height - SPARK.pad - (value / top) * (SPARK.height - SPARK.pad * 2)
  const path = values
    .map((value, index) => (value === null ? null : `${SPARK.pad + index * step},${y(value)}`))
    .filter(Boolean)
    .join(' ')
  return (
    <svg
      role="img"
      aria-label={label}
      data-spark="line"
      viewBox={`0 0 ${SPARK.width} ${SPARK.height}`}
      preserveAspectRatio="none"
      className="h-8 w-full"
    >
      {limitMs !== null && limitMs <= top ? (
        <line
          x1={0}
          x2={SPARK.width}
          y1={y(limitMs)}
          y2={y(limitMs)}
          className="stroke-tertiary"
          strokeDasharray="3 3"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      <polyline
        points={path}
        fill="none"
        className={SPARK_STROKE[status] ?? SPARK_STROKE.unknown}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

const CHART = { width: 640, height: 220, left: 48, right: 64, top: 12, bottom: 28, label: 11 }

/** Requests as bars (errors drawn at their foot), p95 as a line on its own axis, the limit dashed. */
export function FeatureTimeline({
  series,
  window,
  limitMs,
}: {
  series: FeatureSeriesPoint[]
  window: SystemWindow
  limitMs: number | null
}) {
  const { t } = useTranslation('admin')
  const plotW = CHART.width - CHART.left - CHART.right
  const plotH = CHART.height - CHART.top - CHART.bottom
  const maxRequests = niceCeil(Math.max(0, ...series.map((point) => point.requests ?? 0)))
  const maxLatency = niceCeil(Math.max(0, limitMs ?? 0, ...series.map((point) => point.p95Ms ?? 0)))
  const slot = plotW / Math.max(series.length, 1)
  const barW = Math.max(slot * 0.7, 1)
  const xMid = (index: number) => CHART.left + slot * index + slot / 2
  const yReq = (value: number) => CHART.top + plotH - (value / maxRequests) * plotH
  const yLat = (value: number) => CHART.top + plotH - (value / maxLatency) * plotH
  const line = series
    .map((point, index) => (point.p95Ms === null ? null : `${xMid(index)},${yLat(point.p95Ms)}`))
    .filter(Boolean)
    .join(' ')
  const ticks = [0, 0.5, 1]
  const xLabels = series.length > 2 ? [0, Math.floor((series.length - 1) / 2), series.length - 1] : series.map((_, i) => i)

  return (
    <div className="overflow-x-auto">
      <svg
        role="img"
        aria-label={t('systemHealth.detail.chart.label')}
        viewBox={`0 0 ${CHART.width} ${CHART.height}`}
        className="h-auto w-full min-w-md"
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={CHART.left}
              x2={CHART.width - CHART.right}
              y1={CHART.top + plotH - tick * plotH}
              y2={CHART.top + plotH - tick * plotH}
              className="stroke-hairline"
            />
            <text
              x={CHART.left - 6}
              y={CHART.top + plotH - tick * plotH}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={CHART.label}
              className="fill-caption"
            >
              {formatCount(tick * maxRequests)}
            </text>
            <text
              x={CHART.width - CHART.right + 6}
              y={CHART.top + plotH - tick * plotH}
              dominantBaseline="middle"
              fontSize={CHART.label}
              className="fill-caption"
            >
              {formatMs(t, tick * maxLatency)}
            </text>
          </g>
        ))}
        {series.map((point, index) => {
          const requests = point.requests ?? 0
          const errors = Math.min(point.errors ?? 0, requests)
          return (
            <g key={point.t} data-bar>
              <rect
                x={xMid(index) - barW / 2}
                y={yReq(requests)}
                width={barW}
                height={CHART.top + plotH - yReq(requests)}
                className="fill-accent-tint"
              />
              {errors > 0 ? (
                <rect
                  x={xMid(index) - barW / 2}
                  y={yReq(errors)}
                  width={barW}
                  height={CHART.top + plotH - yReq(errors)}
                  className="fill-red"
                />
              ) : null}
            </g>
          )
        })}
        {limitMs !== null ? (
          <line
            data-limit
            x1={CHART.left}
            x2={CHART.width - CHART.right}
            y1={yLat(limitMs)}
            y2={yLat(limitMs)}
            className="stroke-red"
            strokeDasharray="6 4"
          />
        ) : null}
        {line ? (
          <polyline points={line} fill="none" className="stroke-accent" strokeWidth={2} strokeLinejoin="round" />
        ) : null}
        {xLabels.map((index) => (
          <text
            key={index}
            x={xMid(index)}
            y={CHART.height - 8}
            textAnchor="middle"
            fontSize={CHART.label}
            className="fill-caption"
          >
            {formatBucket(window, series[index].t)}
          </text>
        ))}
      </svg>
      <ul className="m-0 mt-2 flex list-none flex-wrap gap-4 p-0 text-xs text-caption">
        <LegendItem swatch="bg-accent-tint" label={t('systemHealth.detail.chart.requests')} />
        <LegendItem swatch="bg-red" label={t('systemHealth.detail.chart.errors')} />
        <LegendItem swatch="bg-accent" label={t('systemHealth.detail.chart.p95')} />
        {limitMs !== null ? <LegendItem swatch="bg-red" dashed label={t('systemHealth.detail.chart.limit')} /> : null}
      </ul>
    </div>
  )
}

function LegendItem({ swatch, label, dashed }: { swatch: string; label: string; dashed?: boolean }) {
  return (
    <li className="flex items-center gap-1.5">
      <span aria-hidden="true" className={cn('inline-block w-3', dashed ? 'h-0.5' : 'h-3 rounded-sm', swatch)} />
      {label}
    </li>
  )
}

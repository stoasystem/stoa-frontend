/*
 * The star cluster overview (prototype): a subject as a few large clusters,
 * each with its name, how many of its stars are lit and where to go on. A
 * cluster opens its learning route (`ClusterRouteView`).
 */
import { useTranslation } from 'react-i18next'
import { StarGlyph } from '@/features/starmap/components/StarGlyph'
import { starLook, type Star } from '@/features/starmap/model/starMap'
import type { StarCluster } from '@/features/starmap/route/clusters'
import '@/features/starmap/route/clusterRoute.css'

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

/** The cluster's stars as a little swirl of dots: lit ones warm, the next one ringed. */
function ClusterSwirl({ cluster, size }: { cluster: StarCluster; size: number }) {
  const n = cluster.stars.length
  const half = size / 2
  const spread = half - 10
  return (
    <svg width={size} height={size} viewBox={`${-half} ${-half} ${size} ${size}`} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`swirl-${cluster.clusterId}`}>
          <stop offset={0} style={{ stopColor: 'var(--starmap-rim)' }} stopOpacity={0.28} />
          <stop offset={1} style={{ stopColor: 'var(--starmap-rim)' }} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle r={half} fill={`url(#swirl-${cluster.clusterId})`} />
      {cluster.stars.map((star, i) => {
        const r = spread * Math.sqrt((i + 0.5) / n)
        const a = i * GOLDEN_ANGLE
        return <SwirlDot key={star.unitId} star={star} x={r * Math.cos(a)} y={r * Math.sin(a)} next={star.unitId === cluster.next?.unitId} />
      })}
    </svg>
  )
}

function SwirlDot({ star, x, y, next }: { star: Star; x: number; y: number; next: boolean }) {
  const look = starLook(star)
  if (look === 'lit') {
    return (
      <g transform={`translate(${x} ${y})`}>
        <circle r={6} fill="var(--lit)" fillOpacity={0.18} />
        <circle r={3} fill="var(--lit-core)" />
      </g>
    )
  }
  if (look === 'in_progress' || next) {
    return (
      <g transform={`translate(${x} ${y})`}>
        <circle r={6.5} fill="none" stroke="var(--lit)" strokeWidth={1.5} />
        <circle r={2.6} fill="var(--lit)" />
      </g>
    )
  }
  if (look === 'ready') return <circle cx={x} cy={y} r={2.4} fill="var(--starmap-ice)" fillOpacity={0.75} />
  return <circle cx={x} cy={y} r={2.2} fill="none" stroke="var(--on-sky-text)" strokeOpacity={0.4} strokeWidth={1} />
}

export function ClusterOverview({
  subjectName,
  clusters,
  onOpen,
}: {
  subjectName: string
  clusters: readonly StarCluster[]
  onOpen: (clusterId: string) => void
}) {
  const { t } = useTranslation('starmap')
  return (
    <main data-surface="sky" data-cluster-overview className="cluster-page px-4 pb-12 pt-8 sm:px-10">
      <header className="mx-auto mb-6 max-w-[960px]">
        <h1 className="text-[28px] font-semibold leading-tight sm:text-[34px]">{subjectName}</h1>
        <p className="mt-1 text-[15px]" style={{ color: 'var(--on-sky-text-body)' }}>
          {t('clusters.pick')}
        </p>
      </header>
      <ul className="mx-auto grid max-w-[960px] grid-cols-1 gap-4 sm:grid-cols-2" role="list">
        {clusters.map((cluster) => (
          <li key={cluster.clusterId}>
            <button
              type="button"
              data-cluster={cluster.clusterId}
              onClick={() => onOpen(cluster.clusterId)}
              className="cluster-tile cluster-focus flex w-full items-center gap-4 p-4 text-left sm:p-5"
            >
              <ClusterSwirl cluster={cluster} size={112} />
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-[19px] font-semibold leading-snug sm:text-[21px]">{cluster.name}</span>
                <span className="text-[14px]" style={{ color: 'var(--on-sky-text-body)' }}>
                  {t('summary.lit', { lit: cluster.lit, total: cluster.total })}
                </span>
                <span
                  className="mt-1 h-1.5 w-full overflow-hidden rounded-full"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                  aria-hidden="true"
                >
                  <span className="block h-full rounded-full" style={{ width: `${(cluster.lit / Math.max(1, cluster.total)) * 100}%`, background: 'var(--lit)' }} />
                </span>
                {cluster.next ? (
                  <span className="mt-2 flex items-center gap-2 text-[14px]">
                    <StarGlyph state={starLook(cluster.next)} size={22} progress={cluster.next.progress} />
                    <span className="min-w-0">
                      <span style={{ color: 'var(--on-sky-text-caption)' }}>{t('clusters.next')} </span>
                      <span className="font-medium">{cluster.next.name}</span>
                    </span>
                  </span>
                ) : (
                  <span className="mt-2 text-[14px]" style={{ color: 'var(--lit)' }}>
                    {t('clusters.allLit')}
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </main>
  )
}

import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { FeatureTimeline } from '@/components/admin/systemHealth/charts'
import { Figure } from '@/components/admin/systemHealth/FeatureCard'
import {
  NO_VALUE,
  alarmTitle,
  featureName,
  formatCount,
  formatMs,
  formatRate,
  formatWhen,
} from '@/components/admin/systemHealth/format'
import { DataTable, Section, SectionEmpty, type Column } from '@/components/admin/systemHealth/Section'
import { AlarmStateBadge, StatusBadge } from '@/components/admin/systemHealth/StatusBadge'
import { WindowSwitch, useWindowParam } from '@/components/admin/systemHealth/WindowSwitch'
import { Pill } from '@/components/base'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Skeleton } from '@/components/common/Skeleton'
import { useSystemFeatureQuery } from '@/hooks/admin/useSystemHealth'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { toUserFacingError } from '@/lib/userFacingText'
import {
  isSystemFeature,
  type FeatureFrontendError,
  type FeatureProbeRun,
  type FeatureRecentError,
  type FeatureRoute,
  type SystemAlarm,
  type SystemFeatureResponse,
} from '@/services/admin/systemHealthApi'

function routeColumns(t: TFunction, limitMs: number | null): Column<FeatureRoute>[] {
  return [
    { key: 'method', header: t('systemHealth.detail.routes.method'), cell: (row) => <span className="font-mono">{row.method}</span> },
    {
      key: 'route',
      header: t('systemHealth.detail.routes.route'),
      cell: (row) => (
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-mono break-all">{row.route}</span>
          {limitMs !== null && row.p95Ms !== null && row.p95Ms > limitMs ? (
            <Pill tone="gold">{t('systemHealth.detail.routes.overLimit')}</Pill>
          ) : null}
        </span>
      ),
    },
    { key: 'requests', header: t('systemHealth.metric.requests'), numeric: true, cell: (row) => formatCount(row.requests) },
    { key: 'errorRate', header: t('systemHealth.metric.errorRate'), numeric: true, cell: (row) => formatRate(row.errorRate) },
    { key: 'p50', header: t('systemHealth.metric.p50'), numeric: true, cell: (row) => formatMs(t, row.p50Ms) },
    { key: 'p95', header: t('systemHealth.metric.p95'), numeric: true, cell: (row) => formatMs(t, row.p95Ms) },
  ]
}

function errorColumns(t: TFunction): Column<FeatureRecentError>[] {
  return [
    {
      key: 'route',
      header: t('systemHealth.detail.routes.route'),
      cell: (row) => <span className="font-mono break-all">{`${row.method} ${row.route}`}</span>,
    },
    { key: 'status', header: t('systemHealth.detail.recentErrors.status'), numeric: true, cell: (row) => row.status },
    { key: 'count', header: t('systemHealth.detail.count'), numeric: true, cell: (row) => formatCount(row.count) },
    { key: 'at', header: t('systemHealth.detail.at'), numeric: true, cell: (row) => formatWhen(row.at) },
  ]
}

function frontendColumns(t: TFunction): Column<FeatureFrontendError>[] {
  return [
    {
      key: 'message',
      header: t('systemHealth.detail.frontendErrors.message'),
      cell: (row) => <span className="break-words">{row.message || t('systemHealth.detail.frontendErrors.noMessage')}</span>,
    },
    { key: 'route', header: t('systemHealth.detail.routes.route'), cell: (row) => <span className="font-mono break-all">{row.route ?? NO_VALUE}</span> },
    { key: 'release', header: t('systemHealth.detail.frontendErrors.release'), cell: (row) => <span className="font-mono">{row.release ?? NO_VALUE}</span> },
    { key: 'count', header: t('systemHealth.detail.count'), numeric: true, cell: (row) => formatCount(row.count) },
    { key: 'lastAt', header: t('systemHealth.detail.frontendErrors.lastAt'), numeric: true, cell: (row) => formatWhen(row.lastAt) },
  ]
}

function probeColumns(t: TFunction): Column<FeatureProbeRun>[] {
  return [
    { key: 'at', header: t('systemHealth.detail.at'), cell: (row) => formatWhen(row.at) },
    {
      key: 'ok',
      header: t('systemHealth.detail.probes.result'),
      cell: (row) => (
        <Pill tone={row.ok ? 'green' : 'danger'}>{row.ok ? t('systemHealth.detail.probes.ok') : t('systemHealth.detail.probes.failed')}</Pill>
      ),
    },
    { key: 'latency', header: t('systemHealth.detail.probes.latency'), numeric: true, cell: (row) => formatMs(t, row.latencyMs) },
    { key: 'step', header: t('systemHealth.detail.probes.step'), cell: (row) => <span className="font-mono">{row.step ?? NO_VALUE}</span> },
  ]
}

function alarmColumns(t: TFunction): Column<SystemAlarm>[] {
  return [
    { key: 'state', header: t('systemHealth.detail.alarmState'), cell: (row) => <AlarmStateBadge state={row.state} /> },
    { key: 'name', header: t('systemHealth.detail.alarmName'), cell: (row) => alarmTitle(t, row) },
    { key: 'since', header: t('systemHealth.detail.at'), numeric: true, cell: (row) => formatWhen(row.since) },
  ]
}

function FeatureDetail({ data }: { data: SystemFeatureResponse }) {
  const { t } = useTranslation('admin')
  const feature = data.feature
  const series = data.series ?? []
  const routes = [...(data.routes ?? [])].sort((a, b) => (b.p95Ms ?? -1) - (a.p95Ms ?? -1))
  const alarms = data.alarms ?? []
  const openAlarms = feature.openAlarms ?? alarms.filter((alarm) => alarm.state === 'ALARM').length
  const hasRequests = series.some((point) => (point.requests ?? 0) > 0)
  const usage = data.usage ?? []

  return (
    <>
      <dl className="m-0 grid grid-cols-2 gap-4 rounded-card border border-hairline bg-surface p-4 sm:grid-cols-3 lg:grid-cols-6">
        <Figure label={t('systemHealth.metric.requests')} value={formatCount(feature.requests)} />
        <Figure label={t('systemHealth.metric.errorRate')} value={formatRate(feature.errorRate)} />
        <Figure label={t('systemHealth.metric.p50')} value={formatMs(t, feature.p50Ms)} />
        <Figure label={t('systemHealth.metric.p95')} value={formatMs(t, feature.p95Ms)} />
        <Figure label={t('systemHealth.metric.p95Limit')} value={formatMs(t, feature.p95LimitMs)} />
        <Figure label={t('systemHealth.metric.openAlarms')} value={formatCount(openAlarms)} />
      </dl>

      <Section title={t('systemHealth.detail.chart.title')}>
        {hasRequests ? (
          <FeatureTimeline series={series} window={data.window} limitMs={feature.p95LimitMs} />
        ) : (
          <EmptyState title={t('systemHealth.detail.chart.empty')} description={t('systemHealth.detail.chart.emptyHint')} />
        )}
      </Section>

      <Section title={t('systemHealth.detail.routes.title')}>
        {routes.length === 0 ? (
          <SectionEmpty>{t('systemHealth.detail.routes.empty')}</SectionEmpty>
        ) : (
          <DataTable
            columns={routeColumns(t, feature.p95LimitMs)}
            rows={routes}
            rowKey={(row) => `${row.method} ${row.route}`}
            rowClassName={(row) =>
              feature.p95LimitMs !== null && row.p95Ms !== null && row.p95Ms > feature.p95LimitMs ? 'bg-gold-tint' : undefined
            }
          />
        )}
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title={t('systemHealth.detail.recentErrors.title')}>
          {(data.recentErrors ?? []).length === 0 ? (
            <SectionEmpty>{t('systemHealth.detail.recentErrors.empty')}</SectionEmpty>
          ) : (
            <DataTable
              columns={errorColumns(t)}
              rows={data.recentErrors ?? []}
              rowKey={(row, index) => `${row.at}-${row.route}-${row.status}-${index}`}
            />
          )}
        </Section>
        <Section title={t('systemHealth.detail.alarms.title')}>
          {alarms.length === 0 ? (
            <SectionEmpty>{t('systemHealth.detail.alarms.empty')}</SectionEmpty>
          ) : (
            <DataTable columns={alarmColumns(t)} rows={alarms} rowKey={(row) => row.name} />
          )}
        </Section>
      </div>

      <Section title={t('systemHealth.detail.frontendErrors.title')}>
        {(data.frontendErrors ?? []).length === 0 ? (
          <SectionEmpty>{t('systemHealth.detail.frontendErrors.empty')}</SectionEmpty>
        ) : (
          <DataTable columns={frontendColumns(t)} rows={data.frontendErrors ?? []} rowKey={(row) => row.messageHash} />
        )}
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title={t('systemHealth.detail.probes.title')}>
          {(data.probes ?? []).length === 0 ? (
            <SectionEmpty>{t('systemHealth.detail.probes.empty')}</SectionEmpty>
          ) : (
            <DataTable columns={probeColumns(t)} rows={data.probes ?? []} rowKey={(row, index) => `${row.at}-${index}`} />
          )}
        </Section>
        <Section title={t('systemHealth.detail.usage.title')}>
          {usage.length === 0 ? (
            <SectionEmpty>{t('systemHealth.detail.usage.empty')}</SectionEmpty>
          ) : (
            <DataTable
              columns={[
                { key: 'event', header: t('systemHealth.detail.usage.event'), cell: (row) => <span className="font-mono">{row.event}</span> },
                { key: 'count', header: t('systemHealth.detail.count'), numeric: true, cell: (row) => formatCount(row.count) },
              ]}
              rows={usage}
              rowKey={(row) => row.event}
            />
          )}
        </Section>
      </div>
    </>
  )
}

export function AdminSystemFeaturePage() {
  const { t } = useTranslation('admin')
  const { feature: param } = useParams()
  const feature = isSystemFeature(param) ? param : null
  const [window, setWindow] = useWindowParam()
  const query = useSystemFeatureQuery(feature, window)
  const name = feature ? featureName(t, feature) : t('systemHealth.detail.unknownFeature')
  const overview = `/admin/system?window=${window}`

  return (
    <DashboardLayout>
      <PageContainer className="p-0">
        <Breadcrumbs items={[{ label: t('systemHealth.title'), to: overview }, { label: name }]} />
        <PageHeader
          title={name}
          actions={
            feature ? (
              <>
                {query.data ? <StatusBadge status={query.data.feature.status} /> : null}
                {query.data ? (
                  <span className="text-xs text-caption">
                    {t('systemHealth.generatedAt', { time: formatWhen(query.data.generatedAt) })}
                  </span>
                ) : null}
                <WindowSwitch value={window} onChange={setWindow} />
              </>
            ) : null
          }
        />
        {!feature ? (
          <EmptyState
            title={t('systemHealth.detail.unknownFeature')}
            description={t('systemHealth.detail.unknownFeatureHint')}
            action={
              <Link className="text-sm text-accent underline" to={overview}>
                {t('systemHealth.detail.back')}
              </Link>
            }
          />
        ) : query.isPending ? (
          <div role="status" aria-label={t('systemHealth.loading')} className="flex flex-col gap-4">
            <Skeleton className="h-20 rounded-card" />
            <Skeleton className="h-64 rounded-card" />
            <Skeleton className="h-40 rounded-card" />
          </div>
        ) : query.isError && !query.data ? (
          <ErrorState
            title={t('systemHealth.detail.loadFailed')}
            message={toUserFacingError(query.error, t('systemHealth.detail.loadFailed'))}
          />
        ) : query.data ? (
          <FeatureDetail data={query.data} />
        ) : null}
      </PageContainer>
    </DashboardLayout>
  )
}

export default AdminSystemFeaturePage

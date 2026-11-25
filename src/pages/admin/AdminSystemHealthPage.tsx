import { useTranslation } from 'react-i18next'
import { FeatureCard } from '@/components/admin/systemHealth/FeatureCard'
import { alarmTitle, formatCount, formatWhen } from '@/components/admin/systemHealth/format'
import { Section, SectionEmpty } from '@/components/admin/systemHealth/Section'
import { AlarmStateBadge } from '@/components/admin/systemHealth/StatusBadge'
import { WindowSwitch, useWindowParam } from '@/components/admin/systemHealth/WindowSwitch'
import { ErrorState } from '@/components/common/ErrorState'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Skeleton } from '@/components/common/Skeleton'
import { useSystemHealthQuery } from '@/hooks/admin/useSystemHealth'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { toUserFacingError } from '@/lib/userFacingText'
import { SYSTEM_FEATURES, type FeatureHealth } from '@/services/admin/systemHealthApi'

function emptyFeature(key: string): FeatureHealth {
  return {
    key,
    status: 'unknown',
    requests: null,
    errorRate: null,
    p95Ms: null,
    p95LimitMs: null,
    spark: null,
    probe: null,
    openAlarms: null,
  }
}

export function AdminSystemHealthPage() {
  const { t } = useTranslation('admin')
  const [window, setWindow] = useWindowParam()
  const query = useSystemHealthQuery(window)
  const data = query.data
  const features = SYSTEM_FEATURES.map((key) => data?.features.find((item) => item.key === key) ?? emptyFeature(key))
  const alarms = (data?.alarms ?? []).filter((alarm) => alarm.state === 'ALARM')
  const deploys = data?.deploys ?? []

  return (
    <DashboardLayout>
      <PageContainer className="p-0">
        <PageHeader
          title={t('systemHealth.title')}
          description={t('systemHealth.description')}
          actions={
            <>
              {data ? (
                <span className="text-xs text-caption">{t('systemHealth.generatedAt', { time: formatWhen(data.generatedAt) })}</span>
              ) : null}
              <WindowSwitch value={window} onChange={setWindow} />
            </>
          }
        />
        {query.isPending ? (
          <div role="status" aria-label={t('systemHealth.loading')} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {SYSTEM_FEATURES.map((key) => (
              <Skeleton key={key} className="h-40 rounded-card" />
            ))}
          </div>
        ) : query.isError && !data ? (
          <ErrorState title={t('systemHealth.loadFailed')} message={toUserFacingError(query.error, t('systemHealth.loadFailed'))} />
        ) : (
          <>
            <section aria-label={t('systemHealth.featureGrid')} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {features.map((feature) => (
                <FeatureCard key={feature.key} feature={feature} window={window} />
              ))}
            </section>
            <div className="grid gap-4 lg:grid-cols-2">
              <Section title={t('systemHealth.alarms.title')}>
                {alarms.length === 0 ? (
                  <SectionEmpty>{t('systemHealth.alarms.empty')}</SectionEmpty>
                ) : (
                  <ul className="m-0 flex list-none flex-col p-0">
                    {alarms.map((alarm) => (
                      <li key={alarm.name} className="flex items-center gap-3 border-t border-hairline py-2 first:border-t-0">
                        <AlarmStateBadge state={alarm.state} />
                        <span className="min-w-0 flex-1 text-sm text-ink">{alarmTitle(t, alarm)}</span>
                        <span className="text-xs whitespace-nowrap text-caption">
                          {t('systemHealth.alarms.since', { time: formatWhen(alarm.since) })}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
              <Section title={t('systemHealth.deploys.title')}>
                {deploys.length === 0 ? (
                  <SectionEmpty>{t('systemHealth.deploys.empty')}</SectionEmpty>
                ) : (
                  <ul className="m-0 flex list-none flex-col p-0">
                    {deploys.map((deploy) => (
                      <li
                        key={`${deploy.at}-${deploy.release}`}
                        className="flex items-center justify-between gap-3 border-t border-hairline py-2 text-sm first:border-t-0"
                      >
                        <span className="min-w-0 truncate font-mono text-ink">{deploy.release}</span>
                        <span className="text-xs whitespace-nowrap text-caption">{formatWhen(deploy.at)}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="m-0 flex items-baseline justify-between gap-3 border-t border-hairline pt-3 text-sm">
                  <span className="text-caption">{t('systemHealth.frontendErrors24h')}</span>
                  <span data-frontend-errors className="font-semibold text-ink tabular-nums">
                    {formatCount(data?.frontendErrors?.total)}
                  </span>
                </p>
              </Section>
            </div>
          </>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}

export default AdminSystemHealthPage

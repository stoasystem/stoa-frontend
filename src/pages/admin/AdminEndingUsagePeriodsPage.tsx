import { Fragment } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Group, Row } from '@/components/base'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { usagePeriodPathFor } from '@/app/router/routeManifest'
import { useEndingUsagePeriodsQuery } from '@/hooks/admin/useAdminUsagePeriods'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { toUserFacingError } from '@/lib/userFacingText'
import { UsagePeriodStateBadge, periodDay } from '@/pages/admin/UsagePeriodPanel'
import { daysBetween, zurichToday } from '@/pages/admin/usagePeriodRules'
import { ENDING_WITHIN_DAYS } from '@/services/admin/usagePeriodApi'

/**
 * Students and parents whose period ends within two weeks or ended in the
 * last thirty days (#614), so an administrator can contact the family before
 * or after. A parent's row lists the children the period also covers.
 */
export function AdminEndingUsagePeriodsPage() {
  const { t } = useTranslation('admin')
  const endingQuery = useEndingUsagePeriodsQuery(ENDING_WITHIN_DAYS)
  const items = endingQuery.data?.items ?? []
  const today = zurichToday()

  return (
    <DashboardLayout>
      <PageContainer className="p-0">
        <PageHeader
          eyebrow={t('usagePeriod.eyebrow')}
          title={t('usagePeriod.endingTitle')}
          description={t('usagePeriod.endingDescription', { days: ENDING_WITHIN_DAYS })}
          actions={endingQuery.data ? <Badge variant="secondary">{t('usagePeriod.endingCount', { count: items.length })}</Badge> : null}
        />
        <Group>
          <Row to="/admin/users" leading={{ kind: 'icon', icon: ArrowLeft }} title={t('usagePeriod.backToUsers')} />
        </Group>
        <Card className="mb-4">
          <CardContent className="overflow-x-auto pt-6">
            {endingQuery.isPending ? (
              <p role="status" className="text-sm text-muted-foreground">
                {t('usagePeriod.loading')}
              </p>
            ) : endingQuery.isError && !endingQuery.data ? (
              <p role="alert" className="text-sm text-destructive">
                {toUserFacingError(endingQuery.error, t('usagePeriod.endingLoadFailed'))}
              </p>
            ) : items.length === 0 ? (
              <p className="text-sm">{t('usagePeriod.endingEmpty')}</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    <th className="p-2">{t('accounts.columnNumber')}</th>
                    <th className="p-2">{t('accounts.columnName')}</th>
                    <th className="p-2">{t('accounts.columnRole')}</th>
                    <th className="p-2">{t('usagePeriod.columnEndsOn')}</th>
                    <th className="p-2">{t('usagePeriod.columnState')}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const days = daysBetween(today, item.endsOn)
                    return (
                      <Fragment key={item.userId}>
                        <tr className="border-t">
                          <td className="p-2 font-mono">
                            <Link className="underline" to={usagePeriodPathFor(item.userId)}>
                              {item.accountNumber || item.userId}
                            </Link>
                          </td>
                          <td className="p-2">{item.name || '—'}</td>
                          <td className="p-2">{t(`accounts.roleSingular.${item.role}`, { defaultValue: item.role })}</td>
                          <td className="p-2 whitespace-nowrap">{periodDay(item.endsOn)}</td>
                          <td className="p-2">
                            <span className="flex flex-wrap items-center gap-2">
                              <UsagePeriodStateBadge state={item.state} />
                              <span className="text-muted-foreground">
                                {item.state === 'expired'
                                  ? t('usagePeriod.daysAgo', { count: -days })
                                  : t('usagePeriod.daysLeft', { count: days })}
                              </span>
                            </span>
                          </td>
                        </tr>
                        {item.children.length > 0 ? (
                          <tr className="bg-muted/30">
                            <td className="p-2" />
                            <td className="p-2 text-xs" colSpan={4}>
                              {t('usagePeriod.childrenCovered')}{' '}
                              {item.children.map((child, index) => (
                                <Fragment key={child.userId}>
                                  {index > 0 ? ', ' : null}
                                  <Link className="underline" to={usagePeriodPathFor(child.userId)}>
                                    {child.name ? `${child.name} (${child.accountNumber})` : child.accountNumber || child.userId}
                                  </Link>
                                </Fragment>
                              ))}
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </PageContainer>
    </DashboardLayout>
  )
}

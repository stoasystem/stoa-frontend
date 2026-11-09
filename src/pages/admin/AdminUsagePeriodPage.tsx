import { ArrowLeft, CalendarClock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { Group, Row } from '@/components/base'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { useAdminAccountsQuery } from '@/hooks/admin/useAdminAccounts'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { accountLabel } from '@/pages/admin/AccountActionDialog'
import { UsagePeriodPanel } from '@/pages/admin/UsagePeriodPanel'

const ALL_ACCOUNTS = {}

/**
 * One account's usage period (#614), `/admin/users/:userId/usage-period`:
 * where the users list, the ending-soon list and a newly opened account lead.
 *
 * The period read names people by id (who made each change, which parent's
 * period a student is on); the account list, read once, puts names to them.
 */
export function AdminUsagePeriodPage() {
  const { t } = useTranslation('admin')
  const { userId = '' } = useParams()
  const accountsQuery = useAdminAccountsQuery(ALL_ACCOUNTS)
  const accounts = accountsQuery.data?.items ?? []
  const account = accounts.find((row) => row.userId === userId)

  return (
    <DashboardLayout>
      <PageContainer className="p-0">
        <PageHeader
          eyebrow={t('usagePeriod.eyebrow')}
          title={account ? accountLabel(account) : t('usagePeriod.title')}
          description={
            account
              ? [t(`accounts.roleSingular.${account.role}`, { defaultValue: account.role }), account.email].filter(Boolean).join(' · ')
              : userId
          }
        />
        <Group>
          <Row to="/admin/users" leading={{ kind: 'icon', icon: ArrowLeft }} title={t('usagePeriod.backToUsers')} />
          <Row
            to="/admin/usage-periods"
            leading={{ kind: 'icon', icon: CalendarClock }}
            title={t('usagePeriod.endingTitle')}
          />
        </Group>
        <Card className="mb-4">
          <CardContent className="pt-6">
            <UsagePeriodPanel userId={userId} accounts={accounts} />
          </CardContent>
        </Card>
      </PageContainer>
    </DashboardLayout>
  )
}

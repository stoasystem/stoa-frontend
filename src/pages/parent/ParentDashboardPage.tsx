import { UsersRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Group, Row } from '@/components/base'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { ParentDashboardSkeleton } from '@/components/parent/ParentDashboardSkeleton'
import { ParentValueCard } from '@/components/parent/ParentValueCard'
// Card 007: payments and billing are frozen; the upgrade prompt and the
// subscription operations card are withdrawn. Both components are kept.
// import { UpgradePromptCard } from '@/components/parent/UpgradePromptCard'
// import { ParentSubscriptionOperationsCard } from '@/components/parent/ParentSubscriptionOperationsCard'
import { useParentAccountOperationsQuery } from '@/hooks/parent/useParentAccountOperationsQuery'
import { useParentChildrenQuery } from '@/hooks/parent/useParentChildrenQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import type { ParentChild } from '@/types/parent'

/*
 * Parent board, Overview (#52): the children as a grouped list, each row the
 * way into that child's detail; then "More", where the account and family
 * row carries the account's state as its subtitle. Reports is the other
 * segment; billing and payments are in the avatar menu (#46), while frozen
 * nowhere.
 */
export function ParentDashboardPage() {
  const { t } = useTranslation('parent')
  const childrenQuery = useParentChildrenQuery()
  const children = childrenQuery.data?.items ?? []

  return (
    <DashboardLayout>
      <PageContainer className="max-w-[880px] space-y-6 p-0">
        <PageHeader title={t('dashboardTitle')} description={t('dashboardDescription')} />
        {childrenQuery.isLoading && <ParentDashboardSkeleton showHeader={false} />}
        {childrenQuery.isError && <p className="text-sm text-red">{t('loadChildrenFailed')}</p>}
        {childrenQuery.data && children.length === 0 && (
          <p className="m-0 text-[15px] text-caption">{t('noChildren')}</p>
        )}
        {children.length > 0 && (
          <Group title={t('overview.children')}>
            {children.map((child) => (
              <ChildRow key={child.id} child={child} />
            ))}
          </Group>
        )}
        <Group title={t('overview.more')}>
          <AccountRow />
        </Group>
        <ParentValueCard />
      </PageContainer>
    </DashboardLayout>
  )
}

function ChildRow({ child }: { child: ParentChild }) {
  const { t } = useTranslation('parent')
  return (
    <Row
      to={`/parent/children/${child.id}`}
      leading={{ kind: 'avatar', name: child.name, tone: 'accent' }}
      title={child.name}
      subtitle={t('overview.childSubtitle', {
        grade: child.grade ?? t('reports.gradeNotSet'),
        subjects: child.subjects.length > 0 ? child.subjects.join(', ') : t('reports.noSubjects'),
      })}
    />
  )
}

/* The account and family: what the summary card used to say, as one row. */
function AccountRow() {
  const { t } = useTranslation('parent')
  const query = useParentAccountOperationsQuery()
  const state = query.data?.supportState
  const issues = (state?.blockers.length ?? 0) + (state?.warnings.length ?? 0)
  const subtitle = query.isLoading
    ? t('overview.accountLoading')
    : query.isError
      ? t('accountOps.loadFailed')
      : issues > 0
        ? t('overview.accountAttention', { count: issues })
        : t('overview.accountReady')

  return (
    <Row
      to="/parent/account-operations"
      leading={{ kind: 'icon', icon: UsersRound }}
      title={t('overview.account')}
      subtitle={subtitle}
    />
  )
}


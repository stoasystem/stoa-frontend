import { UsersRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Group, Pill, Row } from '@/components/base'
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
import { getSubjectLabel } from '@/lib/displayLabels'
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
        subjects:
          child.subjects.length > 0
            ? child.subjects.map((subject) => getSubjectLabel(subject, t)).join(', ')
            : t('reports.noSubjects'),
      })}
    />
  )
}

/*
 * The account and family: what the summary card used to say, as one row --
 * the account's state (ready, needs attention, blocked) and, when it is not
 * ready, the first thing to fix. Billing codes are not named (card 007: billing
 * is frozen and named nowhere a family can read).
 */
const ISSUE_KEYS = [
  'parent_email_unverified',
  'no_linked_children',
  'child_email_unverified',
  'usage_unreconciled',
] as const

function issueKey(code: string) {
  if (code.startsWith('child_binding_')) return 'child_binding'
  return (ISSUE_KEYS as readonly string[]).includes(code) ? code : null
}

function AccountRow() {
  const { t } = useTranslation('parent')
  const query = useParentAccountOperationsQuery()
  const data = query.data
  const state = data?.supportState
  const codes = [...(state?.blockers ?? []), ...(state?.warnings ?? [])]
  const firstKey = codes.map(issueKey).find((key) => key !== null)
  const issue = firstKey ? t(`overview.issues.${firstKey}`) : t('overview.accountSeeDetails')
  const count = Math.max(codes.length, 1)

  // The state is said twice, as the summary card said it (#78 review): as a
  // pill in the row's tone -- red for blocked, gold for attention -- and in
  // the subtitle, which is a live region so a reader hears the answer arrive
  // (or the failure, as an alert) without the row being read again.
  type AccountState = 'loading' | 'failed' | 'blocked' | 'attention' | 'ready'
  let kind: AccountState
  let subtitle: string
  if (query.isLoading) {
    kind = 'loading'
    subtitle = t('overview.accountLoading')
  } else if (query.isError || !state) {
    kind = 'failed'
    subtitle = t('accountOps.loadFailed')
  } else if (state.state === 'blocked') {
    kind = 'blocked'
    subtitle = t('overview.accountBlocked', { count, issue })
  } else if (state.state === 'attention' || codes.length > 0) {
    kind = 'attention'
    subtitle = t('overview.accountAttention', { count, issue })
  } else {
    kind = 'ready'
    subtitle = t('overview.accountReady', { count: data?.children.length ?? 0 })
  }
  const pill =
    kind === 'blocked' ? (
      <Pill tone="danger">{t('overview.state.blocked')}</Pill>
    ) : kind === 'attention' ? (
      <Pill tone="gold">{t('overview.state.attention')}</Pill>
    ) : undefined

  return (
    <Row
      to="/parent/account-operations"
      leading={{ kind: 'icon', icon: UsersRound }}
      title={t('overview.account')}
      subtitle={
        <span role={kind === 'failed' ? 'alert' : 'status'} data-account-state={kind}>
          {subtitle}
        </span>
      }
      trailing={pill}
    />
  )
}

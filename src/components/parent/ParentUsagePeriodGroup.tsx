import { CalendarDays } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Group, Pill, Row } from '@/components/base'
import { ParentRenewalLine } from '@/components/usagePeriod/ParentRenewalLine'
import { childDaysLeft, periodNotice, type PeriodNotice } from '@/features/usage-period/usagePeriodNotice'
import { useParentUsagePeriodQuery } from '@/hooks/parent/useParentUsagePeriodQuery'
import { formatDate } from '@/lib/formatDateTime'
import { zurichToday } from '@/lib/zurichDay'
import type { ChildUsagePeriodPaidBy, UsagePeriodState } from '@/types/usagePeriod'

/*
 * The usage periods on the parent's Overview (#616): the parent's own, then
 * each linked child's with who pays for it -- the parent reading, the child,
 * or another parent, who is never named (stoa-backend#343). A period ending
 * within a week or over carries a pill; the renewal contact closes the group.
 */
export function ParentUsagePeriodGroup() {
  const { t } = useTranslation('parent')
  const query = useParentUsagePeriodQuery()
  const data = query.data
  const today = zurichToday()

  return (
    <div className="space-y-2" data-usage-periods>
      <Group title={t('overview.period.title')}>
        {query.isLoading && (
          <Row title={t('overview.period.own')} subtitle={<span role="status">{t('overview.period.loading')}</span>} />
        )}
        {!data && query.isError && (
          <Row title={t('overview.period.own')} subtitle={<span role="alert">{t('overview.period.loadFailed')}</span>} />
        )}
        {data && (
          <>
            <PeriodRow
              title={t('overview.period.own')}
              endsAt={data.own.endsAt}
              state={data.own.state}
              notice={periodNotice(data.own)}
            />
            {data.children.map((child) => (
              <PeriodRow
                key={child.studentId}
                title={child.name}
                endsAt={child.endsAt}
                state={child.state}
                paidBy={child.paidBy}
                notice={periodNotice({ ...child, daysLeft: childDaysLeft(child, today) })}
                isChild
              />
            ))}
          </>
        )}
      </Group>
      {data?.renewalContactEmail && (
        <p className="px-4 text-sm text-caption">
          <ParentRenewalLine t={t} i18nKey="overview.period.renew" email={data.renewalContactEmail} />
        </p>
      )}
    </div>
  )
}

function PeriodRow({
  title,
  endsAt,
  state,
  paidBy,
  notice,
  isChild = false,
}: {
  title: string
  endsAt: string | null
  state: UsagePeriodState
  paidBy?: ChildUsagePeriodPaidBy
  notice: PeriodNotice | null
  isChild?: boolean
}) {
  const { t } = useTranslation('parent')
  const when =
    state === 'none' || !endsAt
      ? t('overview.period.none')
      : state === 'expired'
        ? t('overview.period.ended', { date: formatDate(endsAt) })
        : t('overview.period.until', { date: formatDate(endsAt) })
  const payer = isChild && paidBy ? t(`overview.period.paidBy.${paidBy}`) : null

  return (
    <Row
      leading={isChild ? { kind: 'avatar', name: title, tone: 'accent' } : { kind: 'icon', icon: CalendarDays }}
      title={title}
      subtitle={payer ? `${when} · ${payer}` : when}
      trailing={<NoticePill notice={notice} />}
    />
  )
}

function NoticePill({ notice }: { notice: PeriodNotice | null }) {
  const { t } = useTranslation('parent')
  if (!notice) return null
  if (notice.kind === 'expired') return <Pill tone="danger">{t('overview.period.expired')}</Pill>
  if (notice.daysLeft === 0) return <Pill tone="gold">{t('overview.period.lastDay')}</Pill>
  return <Pill tone="gold">{t('overview.period.daysLeft', { count: notice.daysLeft })}</Pill>
}

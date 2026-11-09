import type { TFunction } from 'i18next'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ICON } from '@/components/base/sizes'
import { Murmi } from '@/components/brand/Murmi'
import { ParentRenewalLine } from '@/components/usagePeriod/ParentRenewalLine'
import { UsagePeriodRenewalLine } from '@/components/usagePeriod/UsagePeriodRenewal'
import {
  noticeSignature,
  parentNotices,
  periodNotice,
  type ParentNotice,
  type PeriodNotice,
} from '@/features/usage-period/usagePeriodNotice'
import { useParentUsagePeriodQuery } from '@/hooks/parent/useParentUsagePeriodQuery'
import { useStudentEntitlementQuery } from '@/hooks/student/useStudentEntitlementQuery'
import { formatDate, formatDayAndMonth } from '@/lib/formatDateTime'
import { cn } from '@/lib/utils'
import { zurichToday } from '@/lib/zurichDay'
import { useAuthStore } from '@/store/authStore'
import { useUsagePeriodBannerStore } from '@/store/usagePeriodBannerStore'

/*
 * The usage period reminder at the top of every page (#616): a student's or a
 * parent's, from seven days before the last day and once it is over. It says
 * which account, which day and whom to ask for more time; the Ask box says
 * what an expired period stops (#615). Closing it hides it for this visit.
 *
 * Nothing is shown while the period is read or when it cannot be: the
 * reminder is not worth an error on every page.
 */
export function UsagePeriodBanner({ sky = false }: { sky?: boolean }) {
  const role = useAuthStore((state) => state.user?.role)
  if (role === 'student') return <StudentUsagePeriodBanner sky={sky} />
  if (role === 'parent') return <ParentUsagePeriodBanner sky={sky} />
  return null
}

function StudentUsagePeriodBanner({ sky }: { sky: boolean }) {
  const { t } = useTranslation('common')
  const userId = useAuthStore((state) => state.user?.id ?? '')
  const query = useStudentEntitlementQuery()
  const entitlement = query.data
  const notice = periodNotice(entitlement?.usagePeriod)
  if (!notice || !entitlement) return null

  return (
    <Banner
      sky={sky}
      dismissKey={`${userId}#${noticeSignature([notice])}`}
      tone={notice.kind}
      lines={[noticeText(t, 'usagePeriodBanner.student', notice)]}
      renewal={
        <UsagePeriodRenewalLine
          paidBy={entitlement.usagePeriod.paidBy}
          renewalContactEmail={entitlement.renewalContactEmail}
        />
      }
    />
  )
}

function ParentUsagePeriodBanner({ sky }: { sky: boolean }) {
  // A parent is addressed formally (Sie, vous, Lei): their lines live in `parent`.
  const { t } = useTranslation('parent')
  const userId = useAuthStore((state) => state.user?.id ?? '')
  const query = useParentUsagePeriodQuery()
  const notices = parentNotices(query.data, zurichToday())
  if (notices.length === 0) return null
  const anyExpired = notices.some((entry) => entry.notice.kind === 'expired')

  return (
    <Banner
      sky={sky}
      dismissKey={`${userId}#${noticeSignature(notices)}`}
      tone={anyExpired ? 'expired' : 'endsSoon'}
      lines={notices.map((entry) => parentNoticeText(t, entry))}
      renewal={<ParentRenewalLine t={t} i18nKey="usagePeriodBanner.renew" email={query.data?.renewalContactEmail ?? ''} />}
    />
  )
}

/** `prefix`: the student's lines, the parent's own or a child's. */
function noticeText(
  t: TFunction,
  prefix: 'usagePeriodBanner.student' | 'usagePeriodBanner.own' | 'usagePeriodBanner.child',
  notice: PeriodNotice,
  name?: string,
) {
  if (notice.kind === 'expired') {
    return notice.endsAt
      ? t(`${prefix}.expired`, { date: formatDate(notice.endsAt), name })
      : t(`${prefix}.expiredNoDate`, { name })
  }
  if (notice.daysLeft === 0) {
    return t(`${prefix}.endsToday`, { date: formatDayAndMonth(notice.endsAt), name })
  }
  return t(`${prefix}.endsSoon`, { count: notice.daysLeft, date: formatDayAndMonth(notice.endsAt), name })
}

function parentNoticeText(t: TFunction, entry: ParentNotice) {
  if (entry.account === 'own') return noticeText(t, 'usagePeriodBanner.own', entry.notice)
  const text = noticeText(t, 'usagePeriodBanner.child', entry.notice, entry.name)
  // Whose period it is; another parent is never named (stoa-backend#343).
  if (entry.paidBy === 'self') return `${text} ${t('usagePeriodBanner.child.paidBySelf')}`
  if (entry.paidBy === 'other_parent') return `${text} ${t('usagePeriodBanner.child.paidByOtherParent')}`
  return text
}

function Banner({
  sky,
  dismissKey,
  tone,
  lines,
  renewal,
}: {
  /** Over a sky page: the strip is the sky too, as the bar above it is (#183 review). */
  sky: boolean
  dismissKey: string
  tone: PeriodNotice['kind']
  lines: string[]
  renewal: ReactNode
}) {
  const { t } = useTranslation('common')
  const dismissed = useUsagePeriodBannerStore((state) => Boolean(state.dismissed[dismissKey]))
  const dismiss = useUsagePeriodBannerStore((state) => state.dismiss)
  if (dismissed) return null
  const close = t('usagePeriodBanner.close')

  return (
    <aside
      data-usage-period-banner={tone}
      data-surface={sky ? 'sky' : undefined}
      aria-label={t('usagePeriodBanner.label')}
      className={cn(
        'border-b',
        sky
          ? 'border-[color:var(--sky-glass-border)] bg-sky-2 text-on-sky'
          : 'border-hairline bg-surface text-ink',
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl items-start gap-3 px-4 py-3">
        {/*
          Murmi comes with the banner (#616): an hourglass while the period runs
          out, a letter held out once it is over -- for a parent, the most urgent
          account's. The entrance plays once on mount, so a new message (the key)
          plays it again. Decoration: aria-hidden, the text says it all.
        */}
        <Murmi
          key={dismissKey}
          mood={tone === 'expired' ? 'letter' : 'hourglass'}
          entrance
          size={40}
          className="-my-1"
        />
        <div className="min-w-0 flex-1 space-y-1 text-sm leading-6" role="status">
          {lines.map((line) => (
            <p key={line} className="font-semibold">
              {line}
            </p>
          ))}
          <p className={sky ? 'text-[color:var(--on-sky-text-body)]' : 'text-caption'}>{renewal}</p>
        </div>
        {/* A 44 target around a 28 face (Sizes), drawn in the strip's own colours. */}
        <button
          type="button"
          aria-label={close}
          title={close}
          onClick={() => dismiss(dismissKey)}
          className="group -my-2 -mr-2 inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 focus-visible:outline-none"
        >
          <span
            aria-hidden="true"
            className={cn(
              'inline-flex h-7 w-7 items-center justify-center rounded-full group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-ring',
              sky
                ? 'text-[color:var(--on-sky-text-body)] group-hover:bg-[color:var(--on-sky-selected)]'
                : 'text-caption group-hover:bg-fill',
            )}
          >
            <X size={16} strokeWidth={ICON.stroke} />
          </span>
        </button>
      </div>
    </aside>
  )
}

/*
 * What a student whose usage period has ended is told to do about it
 * (stoa-frontend#615, #616): a parent's period covers them -> 「请让家长续期」;
 * their own, or none -> 「请联系 STOA 续期：{renewalContactEmail}」, the address a
 * link to write to.
 */
import { Trans, useTranslation } from 'react-i18next'
import type { StudentEntitlement, StudentUsagePeriodPaidBy } from '@/types/student'

export function UsagePeriodRenewalLine({
  paidBy,
  renewalContactEmail,
  className,
}: {
  /** `usagePeriod.paidBy` from the student's entitlement. */
  paidBy: StudentUsagePeriodPaidBy | null
  /** `renewalContactEmail` from the student's entitlement. */
  renewalContactEmail: string
  className?: string
}) {
  const { t } = useTranslation('common')
  return (
    <span data-usage-period-renewal={paidBy === 'parent' ? 'parent' : 'contact'} className={className}>
      {paidBy === 'parent' ? (
        t('usagePeriod.renewal.parent')
      ) : (
        <Trans
          t={t}
          i18nKey="usagePeriod.renewal.contact"
          values={{ email: renewalContactEmail }}
          components={{
            // Trans fills it with the address.
            email: <a href={`mailto:${renewalContactEmail}`} className="underline underline-offset-2" />,
          }}
        />
      )}
    </span>
  )
}

/**
 * The period has ended: asking and asking a teacher are paused, history and
 * practice are not, and how to get it renewed. One paragraph; `id` for a
 * control it explains (`aria-describedby`).
 */
export function UsagePeriodPausedNotice({
  entitlement,
  id,
  className,
}: {
  entitlement: Pick<StudentEntitlement, 'usagePeriod' | 'renewalContactEmail'>
  id?: string
  className?: string
}) {
  const { t } = useTranslation('common')
  return (
    <p id={id} data-usage-period-paused className={className}>
      {t('usagePeriod.paused')}{' '}
      <UsagePeriodRenewalLine
        paidBy={entitlement.usagePeriod.paidBy}
        renewalContactEmail={entitlement.renewalContactEmail}
      />
    </p>
  )
}

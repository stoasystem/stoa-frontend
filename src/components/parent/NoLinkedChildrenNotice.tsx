import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'

/**
 * What a parent with no linked child is actually told.
 *
 * The empty state used to be one sentence saying no student account was
 * linked, with no way anywhere on the parent board to change that. Card 008 is
 * why there is none: a self-service request is refused whenever either side is
 * a minor, and on this platform the student nearly always is. The link is made
 * by an administrator, so the screen says so, and shows the account number the
 * administrator needs in order to find this parent.
 */
export function NoLinkedChildrenNotice({ headline }: { headline: string }) {
  const { t } = useTranslation('parent')
  const accountNumber = useAuthStore((state) => state.user?.accountNumber ?? '')

  return (
    <section className="rounded-[16px] border border-[color:var(--card-border)] bg-surface px-6 py-5">
      <h2 className="m-0 text-ink" style={{ font: 'var(--t-headline)' }}>
        {headline}
      </h2>
      <div className="mt-2 space-y-2 text-[15px] leading-[1.45] text-caption">
        <p className="m-0">{t('noChildrenNotice.body')}</p>
        {accountNumber ? (
          <p className="m-0">
            {t('noChildrenNotice.accountNumberLabel')}{' '}
            <span className="font-semibold text-ink" data-testid="parent-account-number">
              {accountNumber}
            </span>
          </p>
        ) : (
          <p className="m-0">{t('noChildrenNotice.accountNumberMissing')}</p>
        )}
        <p className="m-0">{t('noChildrenNotice.hint')}</p>
      </div>
    </section>
  )
}

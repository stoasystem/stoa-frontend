import type { TFunction } from 'i18next'
import { Trans } from 'react-i18next'

/**
 * Where a parent asks for more time (#616): a sentence from the `parent`
 * namespace, which addresses them formally, with `<email>` the address as a
 * link to write to -- as the student's line does (`UsagePeriodRenewalLine`, #615).
 */
export function ParentRenewalLine({ t, i18nKey, email }: { t: TFunction; i18nKey: string; email: string }) {
  return (
    <Trans
      t={t}
      i18nKey={i18nKey}
      values={{ email }}
      components={{ email: <a href={`mailto:${email}`} className="underline underline-offset-2" /> }}
    />
  )
}


import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { AccountFormField } from '@/pages/admin/AccountFormFields'
import { periodDay } from '@/pages/admin/UsagePeriodPanel'
import {
  type ExtensionDraft,
  MAX_EXTENSION_AMOUNT,
  TRIAL_EXTENSION,
  extendedEnd,
  extensionAmount,
  zurichToday,
} from '@/pages/admin/usagePeriodRules'
import type { UsagePeriodSource, UsagePeriodUnit } from '@/services/admin/usagePeriodApi'

type Props = {
  idPrefix: string
  period: ExtensionDraft
  onChange: (patch: Partial<ExtensionDraft>) => void
  onTouch: () => void
}

/**
 * The usage period a new student's or parent's account starts with, chosen in
 * the form that opens it. Prefilled with the trial, so an administrator who
 * leaves it alone opens an account that can be used for three days. The
 * controls and their words are the period panel's extension, laid out as the
 * account fields above them are.
 */
export function NewAccountPeriodFields({ idPrefix, period, onChange, onTouch }: Props) {
  const { t } = useTranslation('admin')
  const amount = extensionAmount(period)
  // A new account has no end date yet, so the period counts from today.
  const endsOn = amount === null ? null : extendedEnd(null, zurichToday(), period.unit, amount)
  const trial = t(`usagePeriod.amount.${TRIAL_EXTENSION.unit}`, { count: Number(TRIAL_EXTENSION.amount) })

  return (
    <fieldset className="flex w-full flex-col gap-2 rounded-md border p-3" aria-describedby={`${idPrefix}-period-hint`}>
      <legend className="px-1 text-sm font-semibold">{t('usagePeriod.newAccount.legend')}</legend>
      <p id={`${idPrefix}-period-hint`} className="text-xs text-muted-foreground">
        {t('usagePeriod.newAccount.hint', { trial })}
      </p>
      <div className="flex flex-wrap items-start gap-3">
        <AccountFormField id={`${idPrefix}-period-source`} label={t('usagePeriod.sourceLabel')} required={false}>
          <select
            id={`${idPrefix}-period-source`}
            className="h-9 rounded-md border px-2"
            value={period.source}
            onChange={(event) => onChange({ source: event.target.value as UsagePeriodSource })}
          >
            <option value="gifted">{t('usagePeriod.source.gifted')}</option>
            <option value="paid">{t('usagePeriod.source.paid')}</option>
          </select>
        </AccountFormField>
        <AccountFormField id={`${idPrefix}-period-amount`} label={t('usagePeriod.amountLabel')} required={false}>
          <Input
            id={`${idPrefix}-period-amount`}
            inputMode="numeric"
            value={period.amount}
            onChange={(event) => onChange({ amount: event.target.value })}
            onBlur={onTouch}
          />
        </AccountFormField>
        <AccountFormField id={`${idPrefix}-period-unit`} label={t('usagePeriod.unitLabel')} required={false}>
          <select
            id={`${idPrefix}-period-unit`}
            className="h-9 rounded-md border px-2"
            value={period.unit}
            onChange={(event) => onChange({ unit: event.target.value as UsagePeriodUnit })}
          >
            <option value="days" disabled={period.source === 'paid'}>
              {t('usagePeriod.unit.days')}
            </option>
            <option value="months">{t('usagePeriod.unit.months')}</option>
          </select>
        </AccountFormField>
        {period.source === 'paid' ? (
          <AccountFormField id={`${idPrefix}-period-reference`} label={t('usagePeriod.paymentReferenceLabel')} required>
            <Input
              id={`${idPrefix}-period-reference`}
              aria-required="true"
              value={period.paymentReference}
              onChange={(event) => onChange({ paymentReference: event.target.value })}
              onBlur={onTouch}
            />
          </AccountFormField>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        {period.source === 'paid' ? t('usagePeriod.paidHint') : t('usagePeriod.giftedHint', { max: MAX_EXTENSION_AMOUNT })}
      </p>
      <p className="text-sm" data-testid="new-account-period-preview">
        {endsOn ? t('usagePeriod.newAccount.preview', { date: periodDay(endsOn) }) : null}
      </p>
    </fieldset>
  )
}

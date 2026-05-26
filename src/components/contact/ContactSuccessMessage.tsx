import { CheckCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type ContactSuccessMessageProps = {
  requestId?: string
}

export function ContactSuccessMessage({ requestId }: ContactSuccessMessageProps) {
  const { t } = useTranslation('contact')

  return (
    <div
      className="rounded-md border border-emerald-900/15 bg-emerald-50 px-4 py-3 text-sm text-emerald-950"
      role="status"
      aria-live="polite"
    >
      <div className="flex gap-3">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <div className="space-y-1">
          <p className="font-semibold">{t('form.success')}</p>
          {requestId && (
            <p className="text-emerald-900/75">
              {t('form.requestId')}: {requestId}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

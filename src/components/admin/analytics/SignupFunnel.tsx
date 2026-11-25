import { useTranslation } from 'react-i18next'
import { formattingLocale } from '@/i18n/languages'
import { formatCount, formatPercent } from '@/components/admin/analytics/format'

export function SignupFunnel({ steps }: { steps: { step: string; count: number }[] }) {
  const { t, i18n } = useTranslation('admin')
  const locale = formattingLocale(i18n.language)
  const top = steps[0]?.count ?? 0

  if (steps.length === 0 || top === 0) {
    return <p className="m-0 text-sm text-caption">{t('usageAnalytics.noData')}</p>
  }

  return (
    <ol className="m-0 flex list-none flex-col gap-3 p-0">
      {steps.map((step) => {
        const share = step.count / top
        return (
          <li key={step.step} data-step={step.step} className="flex flex-col gap-1">
            <span className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-ink">
                {t(`usageAnalytics.funnel.steps.${step.step}`, { defaultValue: step.step })}
              </span>
              <span className="tabular-nums text-ink">
                {formatCount(step.count, locale)}{' '}
                <span data-share className="text-caption">
                  {formatPercent(share, locale)}
                </span>
              </span>
            </span>
            <span aria-hidden="true" className="block h-2 rounded-full bg-fill">
              <span className="block h-2 rounded-full bg-accent" style={{ width: `${Math.min(1, share) * 100}%` }} />
            </span>
          </li>
        )
      })}
    </ol>
  )
}

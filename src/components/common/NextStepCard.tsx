import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

export function NextStepCard({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action: ReactNode
}) {
  const { t } = useTranslation('common')

  return (
    <article className="rounded-lg border bg-card p-4 shadow-[var(--platform-shadow-soft)]">
      <p className="brand-section-kicker">{t('nextStep')}</p>
      <h3 className="mt-2 text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      <div className="mt-4">{action}</div>
    </article>
  )
}

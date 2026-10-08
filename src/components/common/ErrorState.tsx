import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Murmi } from '@/components/brand/Murmi'

type ErrorStateProps = {
  title?: string
  message: string
  action?: ReactNode
  /**
   * «Das liegt nicht an dir.» On by default, because most of what reaches a
   * reader here is ours. Turn it off where the reader is the cause — a form
   * they filled in wrongly, a record they asked for that does not exist.
   */
  reassure?: boolean
}

export function ErrorState({ title, message, action, reassure = true }: ErrorStateProps) {
  const { t } = useTranslation('common')

  return (
    <div
      className="mx-auto flex flex-col items-center text-center"
      style={{ gap: 'var(--state-gap)', maxWidth: 'var(--state-measure)' }}
    >
      <Murmi mood="thinking" size="var(--murmi-state)" />
      <div
        className="w-full rounded-[var(--r-card)] px-4 py-3"
        style={{
          background: 'var(--state-error-surface)',
          border: '1px solid var(--state-error-rule)',
        }}
      >
        {title && <p className="m-0 text-base font-semibold text-foreground">{title}</p>}
        <p className={`${title ? 'mt-2 ' : 'm-0 '}text-sm leading-6 text-destructive`}>{message}</p>
        {reassure && (
          <p className="mt-2 mb-0 text-sm leading-6 text-muted-foreground">{t('state.notYourFault')}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

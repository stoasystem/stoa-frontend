import { useTranslation } from 'react-i18next'
import { Murmi } from '@/components/brand/Murmi'

/**
 * Waiting, inline.
 *
 * It sits inside a section as often as it replaces a page, so the marmot here
 * is small enough to stand beside one line of text rather than be the picture.
 */
export function LoadingState({ message }: { message?: string }) {
  const { t } = useTranslation('common')

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
      <Murmi mood="thinking" size="var(--murmi-inline)" />
      <span>{message ?? t('status.loading')}</span>
    </div>
  )
}

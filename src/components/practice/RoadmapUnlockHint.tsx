import { LockKeyhole } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function RoadmapUnlockHint({ condition }: { condition: string }) {
  const { t } = useTranslation('practice')
  const label = condition === 'Complete the previous lesson first.'
    ? t('roadmap.lockedHint')
    : condition || t('roadmap.lockedHint')

  return (
    <div
      className="mt-3 flex items-start gap-2 rounded-md border border-border/70 bg-muted/45 px-3 py-2 text-xs leading-5 text-muted-foreground"
      role="status"
    >
      <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

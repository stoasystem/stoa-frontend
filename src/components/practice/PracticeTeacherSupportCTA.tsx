import { UserRoundCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

export function PracticeTeacherSupportCTA({
  onTeacherHelp,
}: {
  onTeacherHelp: () => void
}) {
  const { t } = useTranslation('practice')

  return (
    <div className="flex flex-col gap-2 rounded-md border bg-card/70 p-3">
      <p className="text-sm font-medium">{t('teacherSupportCta.title')}</p>
      <p className="text-xs leading-5 text-muted-foreground">{t('teacherSupportCta.body')}</p>
      <Button onClick={onTeacherHelp} type="button" variant="secondary">
        <UserRoundCheck className="h-4 w-4" aria-hidden="true" />
        {t('teacherSupportCta.action')}
      </Button>
    </div>
  )
}

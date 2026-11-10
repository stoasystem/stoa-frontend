import { useTranslation } from 'react-i18next'
import { Toggle } from '@/components/base/Toggle'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  useNotificationPreferencesQuery,
  useUpdateWeeklyReportEmailMutation,
} from '@/hooks/notifications/useNotificationPreferences'

/*
 * A parent's email settings (#621, stoa-backend#363): the weekly report email,
 * on by default. Off stops only the email; the report is still made and is
 * still under Reports in the app, which the line beside the switch says. The
 * same switch is what the link at the foot of that email turns off.
 *
 * Solid `bg-card` (--surface), the background the contrast gate rates the off
 * toggle against, as the teacher's card.
 */
export function ParentNotificationSettingsCard() {
  const { t } = useTranslation('parent')
  const query = useNotificationPreferencesQuery()
  const update = useUpdateWeeklyReportEmailMutation()
  const titleId = 'parent-weekly-report-email-title'

  return (
    <Card className="border-border/70 bg-card shadow-[var(--platform-shadow-card)]">
      <CardHeader>
        <CardTitle className="text-base">{t('notificationSettings.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {query.isLoading && <p className="text-sm text-muted-foreground">{t('notificationSettings.loading')}</p>}
        {query.isError && <p className="text-sm text-muted-foreground">{t('notificationSettings.unavailable')}</p>}
        {query.data && (
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p id={titleId} className="text-sm font-semibold text-foreground">
                {t('notificationSettings.weeklyReportEmail.title')}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{t('notificationSettings.weeklyReportEmail.body')}</p>
            </div>
            <Toggle
              // Absent from an older answer: on, the backend's default.
              checked={query.data.weeklyReportEmail !== false}
              aria-labelledby={titleId}
              disabled={update.isPending}
              onCheckedChange={(next) => update.mutate(next)}
            />
          </div>
        )}
        {update.isError && (
          <p className="text-sm text-destructive" role="alert">
            {t('notificationSettings.saveFailed')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

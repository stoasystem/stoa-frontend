import { useTranslation } from 'react-i18next'
import { Toggle } from '@/components/base/Toggle'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  useNotificationPreferencesQuery,
  useUpdateWeeklyReportEmailMutation,
} from '@/hooks/notifications/useNotificationPreferences'

/*
 * A parent's notification settings (#621, stoa-backend#363). The weekly
 * report email can be switched off here as well as from the link in the
 * email; off, only the email stops, and the switch's own sentence says so:
 * the report is still made and readable in STOA.
 *
 * Shown whether or not the rest of the account page loads, like the
 * teacher's card. Solid `bg-card` (--surface), the background the contrast
 * gate rates the off toggle against.
 */
export function ParentNotificationSettingsCard() {
  const { t } = useTranslation('parent')
  const query = useNotificationPreferencesQuery()
  const update = useUpdateWeeklyReportEmailMutation()
  const titleId = 'parent-weekly-report-email-title'

  return (
    <Card className="border-border/70 bg-card shadow-[var(--platform-shadow-card)]">
      <CardHeader>
        <CardTitle className="text-base">{t('notifications.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {query.isLoading && <p className="text-sm text-muted-foreground">{t('notifications.loading')}</p>}
        {query.isError && <p className="text-sm text-muted-foreground">{t('notifications.unavailable')}</p>}
        {query.data && (
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p id={titleId} className="text-sm font-semibold text-foreground">
                {t('notifications.weeklyReportEmail.title')}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{t('notifications.weeklyReportEmail.body')}</p>
            </div>
            <Toggle
              // Left out by a backend from before #363: on, its default.
              checked={query.data.weeklyReportEmail !== false}
              aria-labelledby={titleId}
              disabled={update.isPending}
              onCheckedChange={(next) => update.mutate(next)}
            />
          </div>
        )}
        {update.isError && (
          <p className="text-sm text-destructive" role="alert">
            {t('notifications.saveFailed')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

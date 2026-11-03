import { useTranslation } from 'react-i18next'
import { Toggle } from '@/components/base/Toggle'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  useNotificationPreferencesQuery,
  useUpdateDispatchEmailMutation,
} from '@/hooks/notifications/useNotificationPreferences'

/*
 * A teacher's notification settings (stoa-backend#141). Every help request
 * offered to a teacher leaves a notification in the bell, which cannot be
 * switched off, since the offer lapses unanswered; the reminder email that
 * goes with it can. The card is named as the bell is in each language
 * ("Mitteilungen"), like the student's group on /me.
 *
 * Solid `bg-card` (--surface), the background the contrast gate rates the off
 * toggle against.
 */
export function TeacherNotificationSettingsCard() {
  const { t } = useTranslation('teacher')
  const query = useNotificationPreferencesQuery()
  const update = useUpdateDispatchEmailMutation()
  const titleId = 'teacher-dispatch-email-title'

  return (
    <Card className="border-border/70 bg-card shadow-[var(--platform-shadow-card)]">
      <CardHeader>
        <CardTitle className="text-base">{t('profile.notifications.title')}</CardTitle>
        <CardDescription>{t('profile.notifications.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {query.isLoading && <p className="text-sm text-muted-foreground">{t('profile.notifications.loading')}</p>}
        {query.isError && <p className="text-sm text-muted-foreground">{t('profile.notifications.unavailable')}</p>}
        {query.data && (
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p id={titleId} className="text-sm font-semibold text-foreground">
                {t('profile.notifications.dispatchEmail.title')}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{t('profile.notifications.dispatchEmail.body')}</p>
            </div>
            <Toggle
              checked={query.data.dispatchEmail !== false}
              aria-labelledby={titleId}
              disabled={update.isPending}
              onCheckedChange={(next) => update.mutate(next)}
            />
          </div>
        )}
        {update.isError && (
          <p className="text-sm text-destructive" role="alert">
            {t('profile.notifications.saveFailed')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

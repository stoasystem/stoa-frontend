import { Bell, CircleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAdminNotificationsQuery } from '@/hooks/notifications/useNotificationsQuery'
import { notificationText } from '@/lib/notificationCopy'

/*
 * The system page's recent operational events. Every line of it was English
 * on a German admin page, down to the raw status and event type (#162). The
 * title and summary go through the same mapping as the bell; an event type the
 * labels do not know yet is shown as the server names it, spaced out.
 */
export function AdminOperationalNotificationsCard() {
  const { t } = useTranslation('admin')
  const { t: tCommon } = useTranslation(['common', 'chat'])
  const query = useAdminNotificationsQuery()
  const items = query.data?.items ?? []
  const label = (group: 'eventTypes' | 'targetTypes', value: string) =>
    t(`operationalNotifications.${group}.${value}`, { defaultValue: value.replace(/_/g, ' ') })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4" aria-hidden="true" />
            {t('operationalNotifications.title')}
          </CardTitle>
          <Badge variant="secondary">{t('operationalNotifications.count', { count: items.length })}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {query.isLoading && <p className="text-sm text-muted-foreground">{t('operationalNotifications.loading')}</p>}
        {query.isError && (
          <p className="flex items-center gap-2 text-sm text-destructive">
            <CircleAlert className="h-4 w-4" aria-hidden="true" />
            {t('operationalNotifications.unavailable')}
          </p>
        )}
        {!query.isLoading && !query.isError && items.length === 0 && (
          <p className="text-sm text-muted-foreground">{t('operationalNotifications.empty')}</p>
        )}
        {items.length > 0 && (
          <div className="space-y-3">
            {items.slice(0, 5).map((event) => {
              const text = notificationText(event, tCommon)
              return (
                <div key={event.eventId} className="rounded-md border border-border/70 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium">{text.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{text.summary}</p>
                    </div>
                    <Badge variant={event.status === 'created' ? 'default' : 'secondary'}>
                      {tCommon(`common:notifications.itemStatus.${event.status}`, { defaultValue: event.status })}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {label('eventTypes', event.eventType)} · {label('targetTypes', event.targetType)}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

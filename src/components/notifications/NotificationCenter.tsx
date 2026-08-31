import { useState } from 'react'
import { Archive, Bell, Check, CircleAlert, Radio, WifiOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  useArchiveNotificationMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from '@/hooks/notifications/useNotificationsQuery'
import {
  type RealtimeNotificationStatus,
  useRealtimeNotifications,
} from '@/hooks/notifications/useRealtimeNotifications'

const connectionKeys: Record<RealtimeNotificationStatus, string> = {
  disabled: 'notifications.connection.checking',
  connecting: 'notifications.connection.connecting',
  live: 'notifications.connection.live',
  reconnecting: 'notifications.connection.reconnecting',
  fallback: 'notifications.connection.checking',
  offline: 'notifications.connection.offline',
}

export function NotificationCenter() {
  const { t } = useTranslation('common')
  const [open, setOpen] = useState(false)
  const query = useNotificationsQuery()
  const realtime = useRealtimeNotifications()
  const markRead = useMarkNotificationReadMutation()
  const archive = useArchiveNotificationMutation()
  const items = query.data?.items ?? []
  const unread = items.filter((item) => item.status === 'created').length
  const RealtimeIcon = realtime.status === 'offline' ? WifiOff : Radio

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="relative"
        aria-label={
          unread
            ? t('notifications.openLabelUnread', { count: unread })
            : t('notifications.openLabel')
        }
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
        )}
      </Button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-border/80 bg-card p-3 shadow-[var(--platform-shadow-soft)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{t('notifications.title')}</p>
              <p className="text-xs text-muted-foreground">{t('notifications.subtitle')}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge
                variant={realtime.isLive ? 'default' : 'secondary'}
                className="inline-flex max-w-32 items-center gap-1 truncate"
              >
                <RealtimeIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span className="truncate">{t(connectionKeys[realtime.status])}</span>
              </Badge>
              <Badge variant="secondary">{t('notifications.unread', { count: unread })}</Badge>
            </div>
          </div>
          <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
            {query.isLoading && (
              <p className="text-sm text-muted-foreground">{t('notifications.loading')}</p>
            )}
            {query.isError && (
              <p className="flex items-center gap-2 text-sm text-destructive">
                <CircleAlert className="h-4 w-4" aria-hidden="true" />
                {t('notifications.unavailable')}
              </p>
            )}
            {!query.isLoading && !query.isError && items.length === 0 && (
              <p className="text-sm text-muted-foreground">{t('notifications.empty')}</p>
            )}
            {items.map((event) => (
              <div key={event.eventId} className="rounded-md border border-border/70 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{event.summary}</p>
                  </div>
                  <Badge variant={event.status === 'created' ? 'default' : 'secondary'}>
                    {t(`notifications.itemStatus.${event.status}`, { defaultValue: event.status })}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {event.status === 'created' && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={markRead.isPending}
                      onClick={() => markRead.mutate(event.eventId)}
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      {t('notifications.markRead')}
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={archive.isPending}
                    onClick={() => archive.mutate(event.eventId)}
                  >
                    <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                    {t('notifications.archive')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

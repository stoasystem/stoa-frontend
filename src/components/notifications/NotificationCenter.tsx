import { useEffect, useRef, useState } from 'react'
import { Archive, Bell, ChevronRight, CircleAlert, Radio, WifiOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { IconButton } from '@/components/base/IconButton'
import { ICON } from '@/components/base/sizes'
import { notificationTargetPath } from '@/components/notifications/notificationTargets'
import { Badge } from '@/components/ui/badge'
import {
  useArchiveNotificationMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from '@/hooks/notifications/useNotificationsQuery'
import {
  type RealtimeNotificationStatus,
  useRealtimeNotifications,
} from '@/hooks/notifications/useRealtimeNotifications'
import { useAuthStore } from '@/store/authStore'
import type { NotificationEvent } from '@/types/notification'

const connectionKeys: Record<RealtimeNotificationStatus, string> = {
  disabled: 'notifications.connection.checking',
  connecting: 'notifications.connection.connecting',
  live: 'notifications.connection.live',
  reconnecting: 'notifications.connection.reconnecting',
  fallback: 'notifications.connection.checking',
  offline: 'notifications.connection.offline',
}

export function NotificationCenter({ hitSize }: { hitSize?: number } = {}) {
  const { t } = useTranslation('common')
  const [open, setOpen] = useState(false)
  const shell = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const role = useAuthStore((state) => state.user?.role)
  const query = useNotificationsQuery()
  const realtime = useRealtimeNotifications()
  const markRead = useMarkNotificationReadMutation()
  const archive = useArchiveNotificationMutation()
  const items = query.data?.items ?? []
  const unread = items.filter((item) => item.status === 'created').length
  const RealtimeIcon = realtime.status === 'offline' ? WifiOff : Radio
  const targetOf = (event: NotificationEvent) => (role ? notificationTargetPath(event, role) : null)

  // Every item can be chosen (#46): it is marked read, and one with a target
  // opens it and closes the panel.
  function choose(event: NotificationEvent) {
    if (event.status === 'created') markRead.mutate(event.eventId)
    const target = targetOf(event)
    if (!target) return
    setOpen(false)
    navigate(target)
  }

  // A panel anchored to the bell closes the way every other one does: a click
  // outside it, or Escape.
  useEffect(() => {
    if (!open) return

    function onPointerDown(event: PointerEvent) {
      if (!shell.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className="relative" ref={shell}>
      {/* Sizes board: the bell in the bar is a 36 icon button with a 22 glyph. */}
      <IconButton
        icon={Bell}
        size={36}
        hitSize={hitSize}
        label={
          unread
            ? t('notifications.openLabelUnread', { count: unread })
            : t('notifications.openLabel')
        }
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        badge={
          unread > 0 ? (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
          ) : undefined
        }
      />
      {open && (
        <div className="absolute right-0 top-11 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-border/80 bg-card p-3 shadow-[var(--platform-shadow-soft)]">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
            <div className="min-w-40 flex-1">
              <p className="text-sm font-semibold">{t('notifications.title')}</p>
              <p className="text-xs text-muted-foreground">{t('notifications.subtitle')}</p>
            </div>
            {/* German says the same thing in half again the width, so these
                wrap rather than sit on a fixed one and cut the word off. */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={realtime.isLive ? 'default' : 'secondary'}
                className="inline-flex items-center gap-1 text-left"
              >
                <RealtimeIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span>{t(connectionKeys[realtime.status])}</span>
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
            {items.map((event) => {
              const target = targetOf(event)
              return (
                <div
                  key={event.eventId}
                  data-notification={event.eventId}
                  className="flex items-start gap-1 rounded-md border border-border/70 p-1"
                >
                  <button
                    type="button"
                    data-notification-target={target ?? undefined}
                    onClick={() => choose(event)}
                    className="flex min-w-0 flex-1 cursor-pointer items-start gap-2 rounded-[6px] border-0 bg-transparent p-2 text-left text-ink hover:bg-ground"
                  >
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-sm font-medium">{event.title}</span>
                      <span className="mt-1 text-xs leading-5 text-muted-foreground">{event.summary}</span>
                    </span>
                    {event.status === 'created' && (
                      <Badge variant="default">{t('notifications.itemStatus.created')}</Badge>
                    )}
                    {target && (
                      <ChevronRight
                        aria-hidden="true"
                        size={ICON.rowTrailing}
                        strokeWidth={1.8}
                        className="mt-0.5 shrink-0 text-tertiary"
                      />
                    )}
                  </button>
                  <IconButton
                    icon={Archive}
                    size={28}
                    hitSize={hitSize}
                    label={t('notifications.archive')}
                    disabled={archive.isPending}
                    onClick={() => archive.mutate(event.eventId)}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

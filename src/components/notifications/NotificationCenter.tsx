import { useEffect, useId, useRef, useState } from 'react'
import { Archive, Bell, ChevronRight, CircleAlert, Radio, WifiOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { IconButton } from '@/components/base/IconButton'
import { ICON } from '@/components/base/sizes'
import { notificationText } from '@/lib/notificationCopy'
import { notificationTargetPath } from '@/components/notifications/notificationTargets'
import { Badge } from '@/components/ui/badge'
import {
  useArchiveNotificationMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
  useUnreadNotificationCountQuery,
} from '@/hooks/notifications/useNotificationsQuery'
import {
  type RealtimeNotificationStatus,
  useRealtimeNotifications,
} from '@/hooks/notifications/useRealtimeNotifications'
import { useAuthStore } from '@/store/authStore'
import type { NotificationEvent } from '@/types/notification'

// The panel's one line about what arrives here. The student's is the default:
// a teacher read "Neues zu deinen Fragen, Übungen…" about questions they never
// asked, in the "du" a teacher is not addressed with (#162), and so did the
// organisation and school roles (#221).
const ROLES_WITH_OWN_SUBTITLE = new Set([
  'teacher',
  'parent',
  'admin',
  'organization_admin',
  'school_teacher',
  'school_viewer',
])

function subtitleKey(role: string | undefined): string {
  return role && ROLES_WITH_OWN_SUBTITLE.has(role) ? `notifications.subtitleByRole.${role}` : 'notifications.subtitle'
}

const connectionKeys: Record<RealtimeNotificationStatus, string> = {
  disabled: 'notifications.connection.checking',
  connecting: 'notifications.connection.connecting',
  live: 'notifications.connection.live',
  reconnecting: 'notifications.connection.reconnecting',
  fallback: 'notifications.connection.checking',
  offline: 'notifications.connection.offline',
}

export function NotificationCenter({
  hitSize,
  onSky = false,
}: {
  hitSize?: number
  /** In the bar over a sky page: the bell takes the bar's sky values. */
  onSky?: boolean
} = {}) {
  const { t } = useTranslation(['common', 'chat'])
  const [open, setOpen] = useState(false)
  const shell = useRef<HTMLDivElement>(null)
  const bell = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const itemButtons = useRef(new Map<string, HTMLButtonElement>())
  // The item being archived and the list as it stood then: once the item is
  // gone, focus goes on to a neighbour in that list still there (#410).
  const archiving = useRef<{ eventId: string; order: string[] } | null>(null)
  const panelId = useId()
  const navigate = useNavigate()
  const role = useAuthStore((state) => state.user?.role)
  const query = useNotificationsQuery()
  const unreadCount = useUnreadNotificationCountQuery()
  const realtime = useRealtimeNotifications()
  const markRead = useMarkNotificationReadMutation()
  const archive = useArchiveNotificationMutation()
  const items = query.data?.items ?? []
  // Counted from the list while it is short of a page, read on its own once
  // it is full: a full page is the newest 50, and older unread ones went
  // uncounted (#373, #387). The count read on its own stops at the backend's
  // limit of 100, so above 99 the number reads "99+"; `count` still picks the
  // plural form.
  const unread = unreadCount.data ?? 0
  const unreadCopy = { count: unread, replace: { count: unread > 99 ? '99+' : String(unread) } }
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

  function archiveItem(event: NotificationEvent) {
    archiving.current = { eventId: event.eventId, order: items.map((item) => item.eventId) }
    archive.mutate(event.eventId, {
      onError: () => {
        archiving.current = null
      },
    })
  }

  // An archived item leaves the list with its button, and focus fell to
  // <body> (#410). It goes to the next item, else the one before, else the
  // panel - unless it has been put somewhere else meanwhile.
  useEffect(() => {
    const pending = archiving.current
    if (!pending || items.some((item) => item.eventId === pending.eventId)) return
    archiving.current = null
    const active = document.activeElement
    if (active && active !== document.body) return
    const listed = new Set(items.map((item) => item.eventId))
    const at = pending.order.indexOf(pending.eventId)
    const neighbour =
      pending.order.slice(at + 1).find((id) => listed.has(id)) ??
      pending.order.slice(0, at).reverse().find((id) => listed.has(id))
    const next = neighbour ? itemButtons.current.get(neighbour) : panel.current
    next?.focus()
  }, [items])

  // A panel anchored to the bell closes the way every other one does: a click
  // outside it, or Escape. Focus goes back to the bell (#273), not to <body>;
  // a click outside that put focus somewhere else keeps it there.
  useEffect(() => {
    if (!open) return

    function onPointerDown(event: PointerEvent) {
      if (shell.current?.contains(event.target as Node)) return
      setOpen(false)
      window.setTimeout(() => {
        const active = document.activeElement
        if (!active || active === document.body) bell.current?.focus()
      })
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setOpen(false)
      bell.current?.focus()
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
        ref={bell}
        icon={Bell}
        size={36}
        hitSize={hitSize}
        label={
          unread
            ? t('notifications.openLabelUnread', unreadCopy)
            : t('notifications.openLabel')
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((value) => !value)}
        // Over a sky page the glyph takes the bar's sky values; the panel below does not.
        data-bar-control={onSky || undefined}
        badge={
          unread > 0 ? (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
          ) : undefined
        }
      />
      {open && (
        // On a phone the bell is not at the edge (the account button is to its
        // right), so a panel the screen's width anchored to the bell started
        // left of the screen and lost its first letters (#162). There it spans
        // the screen inside the gutters instead; wider, it hangs off the bell.
        <div
          ref={panel}
          id={panelId}
          tabIndex={-1}
          role="dialog"
          aria-label={t('notifications.title')}
          data-notification-panel
          className="fixed inset-x-4 top-14 z-50 rounded-lg border border-border/80 bg-card p-3 shadow-[var(--platform-shadow-soft)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-11 sm:w-[22rem]"
        >
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
            <div className="min-w-40 flex-1">
              <p className="text-sm font-semibold">{t('notifications.title')}</p>
              <p className="text-xs text-muted-foreground">{t(subtitleKey(role))}</p>
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
              <Badge variant="secondary">{t('notifications.unread', unreadCopy)}</Badge>
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
              const text = notificationText(event, t)
              return (
                <div
                  key={event.eventId}
                  data-notification={event.eventId}
                  className="flex items-start gap-1 rounded-md border border-border/70 p-1"
                >
                  <button
                    ref={(node) => {
                      if (node) itemButtons.current.set(event.eventId, node)
                      else itemButtons.current.delete(event.eventId)
                    }}
                    type="button"
                    data-notification-target={target ?? undefined}
                    onClick={() => choose(event)}
                    className="flex min-w-0 flex-1 cursor-pointer items-start gap-2 rounded-[6px] border-0 bg-transparent p-2 text-left text-ink hover:bg-ground"
                  >
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-sm font-medium">{text.title}</span>
                      <span className="mt-1 text-xs leading-5 text-muted-foreground">{text.summary}</span>
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
                    // Named for its notification: a list of buttons all called
                    // "Archive" did not say which one each removes (#410).
                    label={t('notifications.archiveItem', { title: text.title })}
                    disabled={archive.isPending}
                    onClick={() => archiveItem(event)}
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

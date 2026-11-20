import { useEffect } from 'react'
import { sendNotificationHeartbeat } from '@/services/notifications/notificationApi'
import { useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types/user'

/** How often a hidden tab says it is still here (#717). */
export const HEARTBEAT_MS = 60_000

/** The roles the backend counts as seen, and dispatches to (stoa-backend#530). */
export const HEARTBEAT_ROLES: readonly UserRole[] = ['teacher', 'admin']

/*
 * The background heartbeat (#717). The backend counts a teacher as online
 * only if available and seen in the last 5 minutes (stoa-backend#530), and
 * every poll stops in a hidden tab (#413). So a teacher who switched to
 * another tab dropped out of dispatch 5 minutes later, though STOA was still
 * open. While a teacher's or an admin's tab is hidden, it now reads one
 * notification every 60 s: a hidden tab's timers are throttled to once a
 * minute at most, still well inside the 5 minutes.
 *
 * A shown tab sends none: its own polls (the bell, the workbench) are the
 * heartbeat there. Students and parents send none at all. Signing out or
 * closing the tab ends it, and the backend lets the teacher go 5 minutes
 * later, as it does a driver who closed the app.
 *
 * It beats whether the teacher is available or paused: a pause the backend
 * set while the tab was hidden is not in this tab's cache, and a beat from a
 * paused teacher counts for nothing anyway.
 */
export function useBackgroundHeartbeat() {
  const role = useAuthStore((state) => (state.isAuthenticated ? state.user?.role : undefined))
  const beats = role !== undefined && HEARTBEAT_ROLES.includes(role)

  useEffect(() => {
    if (!beats || typeof document === 'undefined') return
    let timer: ReturnType<typeof setInterval> | undefined

    const stop = () => {
      if (timer !== undefined) clearInterval(timer)
      timer = undefined
    }
    const sync = () => {
      if (document.visibilityState === 'hidden') {
        timer ??= setInterval(() => {
          // A failed beat is only a missed one; the next tries again.
          sendNotificationHeartbeat().catch(() => undefined)
        }, HEARTBEAT_MS)
      } else {
        stop()
      }
    }

    sync()
    document.addEventListener('visibilitychange', sync)
    return () => {
      document.removeEventListener('visibilitychange', sync)
      stop()
    }
  }, [beats])
}

import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { enableRealtimeNotifications, websocketBaseUrl } from '@/lib/env'
import {
  buildRealtimeNotificationUrl,
  heartbeatMessage,
  mergeRealtimeNotification,
  parseRealtimeNotificationMessage,
  realtimeSubscriptionMessage,
} from '@/services/notifications/realtimeNotifications'
import { notificationQueryKeys } from '@/services/notifications/notificationQueryKeys'
import { useAuthStore } from '@/store/authStore'
import { useNotificationPollStore } from '@/store/notificationPollStore'

export type RealtimeNotificationStatus =
  | 'disabled'
  | 'connecting'
  | 'live'
  | 'reconnecting'
  | 'fallback'
  | 'offline'

const HEARTBEAT_MS = 25_000
const MAX_RECONNECT_MS = 30_000

export function useRealtimeNotifications() {
  const queryClient = useQueryClient()
  const accessToken = useAuthStore((state) => state.accessToken)
  const user = useAuthStore((state) => state.user)
  const [status, setStatus] = useState<RealtimeNotificationStatus>('disabled')
  const socketRef = useRef<WebSocket | null>(null)
  const heartbeatRef = useRef<number | null>(null)
  const reconnectRef = useRef<number | null>(null)
  const attemptsRef = useRef(0)

  useEffect(() => {
    if (!enableRealtimeNotifications || !websocketBaseUrl || !accessToken || !user) {
      setStatus('disabled')
      return undefined
    }

    let stopped = false

    const invalidateNotificationQueries = () => {
      void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.list() })
      void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.adminList() })
    }

    const clearHeartbeat = () => {
      if (heartbeatRef.current !== null) {
        window.clearInterval(heartbeatRef.current)
        heartbeatRef.current = null
      }
    }

    const clearReconnect = () => {
      if (reconnectRef.current !== null) {
        window.clearTimeout(reconnectRef.current)
        reconnectRef.current = null
      }
    }

    const scheduleReconnect = () => {
      if (stopped) return
      clearReconnect()
      attemptsRef.current += 1
      const delay = Math.min(MAX_RECONNECT_MS, 1_000 * 2 ** Math.min(attemptsRef.current - 1, 5))
      setStatus(attemptsRef.current > 3 ? 'fallback' : 'reconnecting')
      invalidateNotificationQueries()
      reconnectRef.current = window.setTimeout(() => connect(true), delay)
    }

    // A socket is dropped from socketRef before it is closed, so its handlers
    // see it is no longer the current one and neither reconnect nor beat
    // (#273: an `online` during a pending reconnect left a second socket and a
    // second heartbeat open, and one survived sign-out).
    const closeSocket = () => {
      clearHeartbeat()
      const socket = socketRef.current
      socketRef.current = null
      if (socket && socket.readyState !== WebSocket.CLOSED) {
        socket.close()
      }
    }

    const connect = (retry = false) => {
      if (stopped) return
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setStatus('offline')
        invalidateNotificationQueries()
        return
      }

      setStatus(retry ? 'reconnecting' : 'connecting')
      // One connection at a time: whatever was pending or open goes first.
      clearReconnect()
      closeSocket()

      try {
        const socket = new WebSocket(buildRealtimeNotificationUrl(websocketBaseUrl, accessToken, user))
        socketRef.current = socket
        const isCurrent = () => socketRef.current === socket

        socket.onopen = () => {
          if (!isCurrent()) return
          attemptsRef.current = 0
          setStatus('live')
          socket.send(realtimeSubscriptionMessage(user))
          clearHeartbeat()
          heartbeatRef.current = window.setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(heartbeatMessage())
            }
          }, HEARTBEAT_MS)
        }

        socket.onmessage = (message) => {
          if (!isCurrent() || typeof message.data !== 'string') return
          const event = parseRealtimeNotificationMessage(message.data)
          if (event) {
            mergeRealtimeNotification(queryClient, event, user)
          }
        }

        socket.onerror = () => {
          if (!isCurrent()) return
          setStatus('fallback')
          invalidateNotificationQueries()
          socket.close()
        }

        socket.onclose = () => {
          if (!isCurrent()) return
          clearHeartbeat()
          scheduleReconnect()
        }
      } catch {
        setStatus('fallback')
        scheduleReconnect()
      }
    }

    const handleOnline = () => {
      if (socketRef.current?.readyState === WebSocket.OPEN) return
      attemptsRef.current = 0
      connect(true)
    }

    const handleOffline = () => {
      setStatus('offline')
      invalidateNotificationQueries()
      clearReconnect()
      closeSocket()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    connect()

    return () => {
      stopped = true
      clearReconnect()
      closeSocket()
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [accessToken, queryClient, user])

  // Not live, the notification queries poll on their own, and only in a tab
  // that is shown (#413): a timer here refetched them in hidden tabs too.
  const poll = Boolean(accessToken && user) && status !== 'live'
  useEffect(() => {
    if (!poll) return undefined
    useNotificationPollStore.setState({ polling: true })
    return () => useNotificationPollStore.setState({ polling: false })
  }, [poll])

  return {
    status,
    enabled: enableRealtimeNotifications,
    configured: Boolean(websocketBaseUrl),
    isLive: status === 'live',
  }
}

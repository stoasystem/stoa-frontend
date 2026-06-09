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

export type RealtimeNotificationStatus =
  | 'disabled'
  | 'connecting'
  | 'live'
  | 'reconnecting'
  | 'fallback'
  | 'offline'

const HEARTBEAT_MS = 25_000
const FALLBACK_POLL_MS = 30_000
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
    let suppressCloseReconnect = false

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

    const closeSocket = (suppressReconnect = false) => {
      clearHeartbeat()
      const socket = socketRef.current
      socketRef.current = null
      if (socket && socket.readyState !== WebSocket.CLOSED) {
        suppressCloseReconnect = suppressReconnect
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

      try {
        const socket = new WebSocket(buildRealtimeNotificationUrl(websocketBaseUrl, accessToken, user))
        socketRef.current = socket

        socket.onopen = () => {
          attemptsRef.current = 0
          setStatus('live')
          socket.send(realtimeSubscriptionMessage(user))
          heartbeatRef.current = window.setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(heartbeatMessage())
            }
          }, HEARTBEAT_MS)
        }

        socket.onmessage = (message) => {
          if (typeof message.data !== 'string') return
          const event = parseRealtimeNotificationMessage(message.data)
          if (event) {
            mergeRealtimeNotification(queryClient, event, user)
          }
        }

        socket.onerror = () => {
          setStatus('fallback')
          invalidateNotificationQueries()
          socket.close()
        }

        socket.onclose = () => {
          clearHeartbeat()
          if (suppressCloseReconnect) {
            suppressCloseReconnect = false
            return
          }
          if (!stopped) {
            scheduleReconnect()
          }
        }
      } catch {
        setStatus('fallback')
        scheduleReconnect()
      }
    }

    const handleOnline = () => {
      attemptsRef.current = 0
      connect(true)
    }

    const handleOffline = () => {
      setStatus('offline')
      invalidateNotificationQueries()
      closeSocket(true)
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

  useEffect(() => {
    if (!accessToken || !user || status === 'live') return undefined

    const interval = window.setInterval(() => {
      void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.list() })
      void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.adminList() })
    }, FALLBACK_POLL_MS)

    return () => window.clearInterval(interval)
  }, [accessToken, queryClient, status, user])

  return {
    status,
    enabled: enableRealtimeNotifications,
    configured: Boolean(websocketBaseUrl),
    isLive: status === 'live',
  }
}

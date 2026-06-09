/// <reference lib="dom" />

import { expect, test } from '@playwright/test'
import { loginAs } from './helpers'

test('notification center keeps polling fallback when realtime is not configured', async ({ page }) => {
  test.skip(process.env.VITE_ENABLE_REALTIME_NOTIFICATIONS === 'true', 'Realtime env is enabled for live fixture runs.')

  await loginAs(page, 'student')
  await page.getByRole('button', { name: /notifications/i }).click()

  await expect(page.getByText('Polling', { exact: true })).toBeVisible()
  await expect(page.getByText(/in-product updates with polling fallback/i)).toBeVisible()
})

test.describe('realtime notification transport', () => {
  test.skip(process.env.VITE_ENABLE_REALTIME_NOTIFICATIONS !== 'true', 'Realtime env is disabled.')

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      type MockSocketInstance = {
        emitMessage: (payload: unknown) => void
      }
      const socketWindow = window as unknown as {
        __stoaMockSockets: MockSocketInstance[]
        __stoaMockSocketSent: string[]
        WebSocket: typeof WebSocket
      }

      class MockWebSocket extends EventTarget {
        static CONNECTING = 0
        static OPEN = 1
        static CLOSING = 2
        static CLOSED = 3

        binaryType: BinaryType = 'blob'
        bufferedAmount = 0
        extensions = ''
        onclose: ((this: WebSocket, event: CloseEvent) => unknown) | null = null
        onerror: ((this: WebSocket, event: Event) => unknown) | null = null
        onmessage: ((this: WebSocket, event: MessageEvent) => unknown) | null = null
        onopen: ((this: WebSocket, event: Event) => unknown) | null = null
        protocol = ''
        readyState = MockWebSocket.CONNECTING
        url: string

        constructor(url: string | URL) {
          super()
          this.url = String(url)
          socketWindow.__stoaMockSockets.push(this)
          window.setTimeout(() => {
            this.readyState = MockWebSocket.OPEN
            this.onopen?.call(this as unknown as WebSocket, new Event('open'))
          }, 0)
        }

        close() {
          this.readyState = MockWebSocket.CLOSED
          this.onclose?.call(this as unknown as WebSocket, new CloseEvent('close'))
        }

        send(data: string | Blob | ArrayBufferLike | ArrayBufferView) {
          socketWindow.__stoaMockSocketSent.push(String(data))
        }

        emitMessage(payload: unknown) {
          this.onmessage?.call(
            this as unknown as WebSocket,
            new MessageEvent('message', { data: JSON.stringify(payload) }),
          )
        }
      }

      socketWindow.__stoaMockSockets = []
      socketWindow.__stoaMockSocketSent = []
      socketWindow.WebSocket = MockWebSocket as unknown as typeof WebSocket
    })
  })

  test('tutor shell receives teacher session notification without refresh', async ({ page }) => {
    await loginAs(page, 'tutor')

    await expect
      .poll(async () =>
        page.evaluate(() => {
          const socketWindow = window as unknown as { __stoaMockSocketSent?: string[] }
          return socketWindow.__stoaMockSocketSent?.some((message) => message.includes('"type":"subscribe"')) ?? false
        }),
      )
      .toBe(true)

    await page.evaluate(() => {
      const socketWindow = window as unknown as {
        __stoaMockSockets: Array<{ emitMessage: (payload: unknown) => void }>
      }
      socketWindow.__stoaMockSockets.at(-1)?.emitMessage({
        eventId: 'notif-e2e-teacher-request',
        eventType: 'teacher_requested',
        recipientId: null,
        recipientRole: 'tutor',
        targetType: 'teacher_session',
        targetId: 'teacher-session-e2e',
        title: 'Teacher session requested',
        summary: 'Anna Keller needs help with an algebra step.',
        createdAt: '2026-06-09T10:00:00Z',
        metadata: { subject: 'Mathematics' },
        deliveryId: 'delivery-e2e',
        deliveryAttempt: 1,
      })
    })

    await page.getByRole('button', { name: /notifications/i }).click()
    await expect(page.getByText('Live', { exact: true })).toBeVisible()
    await expect(page.getByText('Teacher session requested')).toBeVisible()
    await expect(page.getByText(/Anna Keller needs help/i)).toBeVisible()
  })
})

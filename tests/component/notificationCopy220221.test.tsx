/**
 * The admin's operational notifications and the bell's one-line description,
 * in the reader's language for every event, target, status and role
 * (#220, #221). A German admin read "New moderation case · medium moderation
 * case reported. · Neu · moderation case update · moderation case", and an
 * organisation admin, a school teacher and a school viewer were told about
 * "deinen Fragen" in the student's "du".
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'

const adminEvents = vi.hoisted(() => ({ items: [] as unknown[] }))

vi.mock('@/hooks/notifications/useNotificationsQuery', () => ({
  useAdminNotificationsQuery: () => ({ data: adminEvents, isLoading: false, isError: false }),
  useNotificationsQuery: () => ({ data: { items: [] }, isLoading: false, isError: false }),
  useMarkNotificationReadMutation: () => ({ mutate: vi.fn() }),
  useArchiveNotificationMutation: () => ({ mutate: vi.fn() }),
}))
vi.mock('@/hooks/notifications/useRealtimeNotifications', () => ({
  useRealtimeNotifications: () => ({ status: 'live', isLive: true }),
}))

const { AdminOperationalNotificationsCard } = await import('@/components/admin/AdminOperationalNotificationsCard')
const { NotificationCenter } = await import('@/components/notifications/NotificationCenter')
const { useAuthStore } = await import('@/store/authStore')

const LANGUAGES = ['de', 'en', 'fr', 'it'] as const

// `EVENT_TYPES` and `STATUSES` in stoa-backend's notification_service.py, and
// the target types its notifications are created with or resolved against.
const EVENT_TYPES = [
  'teacher_requested',
  'teacher_takeover',
  'teacher_reply',
  'teacher_help_expired',
  'moderation_case_update',
  'subscription_request_update',
  'learning_profile_update',
  'assignment_update',
  'weekly_report_update',
]
const TARGET_TYPES = [
  'question',
  'conversation',
  'moderation_case',
  'subscription_request',
  'assignment',
  'learning_profile',
  'weekly_report',
  'report',
  'recommendation',
  'system_status',
]
const STATUSES = ['created', 'read', 'archived', 'failed']

function wrap(children: ReactNode) {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>
  )
}

function adminEvent(fields: Record<string, unknown>) {
  return {
    eventId: `e-${String(fields.eventType)}-${String(fields.status)}`,
    createdAt: '2026-10-16T08:00:00Z',
    status: 'created',
    metadata: {},
    ...fields,
  }
}

beforeEach(async () => {
  await i18n.changeLanguage('de')
  adminEvents.items = []
})

describe("the system page's operational notifications in German", () => {
  it('reads a new moderation case, which the backend sends in English, in German', () => {
    adminEvents.items = [
      adminEvent({
        eventType: 'moderation_case_update',
        targetType: 'moderation_case',
        title: 'New moderation case',
        summary: 'medium moderation case reported.',
      }),
    ]
    render(wrap(<AdminOperationalNotificationsCard />))
    expect(screen.getByText('Neuer Moderationsfall')).toBeInTheDocument()
    expect(screen.getByText('Ein Moderationsfall mit mittlerem Schweregrad wurde gemeldet.')).toBeInTheDocument()
    expect(screen.getByText('Änderung an einem Moderationsfall · Moderationsfall')).toBeInTheDocument()
    expect(screen.queryByText(/moderation/)).toBeNull()
  })

  it('names a subscription request update and a failed status in German', () => {
    adminEvents.items = [
      adminEvent({
        eventType: 'subscription_request_update',
        targetType: 'subscription_request',
        status: 'failed',
        title: 'Abonnementanfrage aktualisiert',
        summary: 'Status: genehmigt.',
      }),
    ]
    render(wrap(<AdminOperationalNotificationsCard />))
    expect(screen.getByText('Fehlgeschlagen')).toBeInTheDocument()
    expect(screen.getByText('Änderung an einer Abonnementanfrage · Abonnementanfrage')).toBeInTheDocument()
    expect(screen.queryByText(/failed|subscription/)).toBeNull()
  })

  it('shows a type or status it does not know as a translated "other", never the id', () => {
    adminEvents.items = [
      adminEvent({ eventType: 'brand_new_event', targetType: 'brand_new_target', status: 'queued', title: 'T', summary: 'S' }),
    ]
    render(wrap(<AdminOperationalNotificationsCard />))
    expect(screen.getByText('Anderes Ereignis · Anderes Ziel')).toBeInTheDocument()
    expect(screen.getByText('Unbekannter Status')).toBeInTheDocument()
    expect(screen.queryByText(/brand|queued/)).toBeNull()
  })
})

// Read from the files, not through i18n, which would quietly fall back to
// another language for a missing key.
describe('the operational labels exist in all four languages', () => {
  it.each(LANGUAGES)('%s has every event type, target type and status', async (lng) => {
    const common = (await import(`@/i18n/locales/${lng}/common.json`)).default
    const admin = (await import(`@/i18n/locales/${lng}/admin.json`)).default
    const labels = admin.operationalNotifications
    for (const type of EVENT_TYPES) expect(labels.eventTypes[type], `${lng} ${type}`).toBeTruthy()
    for (const target of TARGET_TYPES) expect(labels.targetTypes[target], `${lng} ${target}`).toBeTruthy()
    for (const status of STATUSES) expect(common.notifications.itemStatus[status], `${lng} ${status}`).toBeTruthy()
    for (const severity of ['Low', 'Medium', 'High']) {
      const copy = common.notifications.events[`moderationCreated${severity}`]
      expect(copy?.title && copy?.summary, `${lng} ${severity}`).toBeTruthy()
    }
  })
})

describe('the notification panel describes what arrives, for every role', () => {
  const lines: Record<string, Record<(typeof LANGUAGES)[number], string>> = {
    student: {
      de: 'Neues zu deinen Fragen, Übungen und Anfragen an Lehrpersonen.',
      en: 'Updates about your questions, practice, and teacher requests.',
      fr: 'Les nouveautés sur tes questions, tes entraînements et tes demandes d’enseignant.',
      it: 'Novità sulle tue domande, sugli esercizi e sulle richieste agli insegnanti.',
    },
    parent: {
      de: 'Neues zu Ihrem Konto und zum Lernen Ihrer Kinder.',
      en: "Updates about your account and your children's learning.",
      fr: 'Les nouveautés sur votre compte et l’apprentissage de vos enfants.',
      it: 'Novità sull’account e sull’apprendimento dei figli.',
    },
    teacher: {
      de: 'Neues zu den Anfragen von Schülerinnen und Schülern.',
      en: 'Updates about student requests.',
      fr: 'Les nouveautés sur les demandes des élèves.',
      it: 'Novità sulle richieste degli studenti.',
    },
    admin: {
      de: 'Betriebsmeldungen und Neues zu Ihrem Konto.',
      en: 'Operational messages and updates about your account.',
      fr: 'Les messages d’exploitation et les nouveautés de votre compte.',
      it: 'Messaggi operativi e novità sull’account.',
    },
    organization_admin: {
      de: 'Neues zu Ihrer Organisation und zu Ihrem Konto.',
      en: 'Updates about your organization and your account.',
      fr: 'Les nouveautés de votre organisation et de votre compte.',
      it: 'Novità sulla tua organizzazione e sul tuo account.',
    },
    school_teacher: {
      de: 'Neues zu den Anfragen der Schülerinnen und Schüler Ihrer Schule.',
      en: 'Updates about requests from students at your school.',
      fr: 'Les nouveautés sur les demandes des élèves de votre école.',
      it: 'Novità sulle richieste degli studenti della tua scuola.',
    },
    school_viewer: {
      de: 'Neues zu Ihrer Schule und zu Ihrem Konto.',
      en: 'Updates about your school and your account.',
      fr: 'Les nouveautés de votre école et de votre compte.',
      it: 'Novità sulla tua scuola e sul tuo account.',
    },
  }
  const bell = { de: 'Mitteilungen', en: 'Notifications', fr: 'Notifications', it: 'Notifiche' }

  for (const [role, byLanguage] of Object.entries(lines)) {
    for (const lng of LANGUAGES) {
      it(`${role} in ${lng}`, async () => {
        await i18n.changeLanguage(lng)
        useAuthStore.setState({ user: { id: 'u', email: 'u@test.stoaedu.ch', name: 'U', role } as never })
        render(wrap(<NotificationCenter />))
        await userEvent.click(screen.getByRole('button', { name: bell[lng] }))
        expect(screen.getByText(byLanguage[lng])).toBeInTheDocument()
        if (role !== 'student') expect(screen.queryByText(lines.student[lng])).toBeNull()
      })
    }
  }
})

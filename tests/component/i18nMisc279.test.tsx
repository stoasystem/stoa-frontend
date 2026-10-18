import { readFileSync } from 'node:fs'
import path from 'node:path'
import { act, render, renderHook, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { toast } from 'sonner'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { ParentDashboardSkeleton } from '@/components/parent/ParentDashboardSkeleton'
import { TeacherDashboardSkeleton } from '@/components/teacher/TeacherDashboardSkeleton'
import { useReportModerationCaseMutation } from '@/hooks/moderation/useReportModerationCaseMutation'
import {
  getAdminFeedbackStatusLabel,
  getFileStatusLabel,
  getSupportTicketStatusLabel,
  getTeacherHelpStatusLabel,
} from '@/lib/displayLabels'
import { createModerationReport } from '@/services/admin/adminApi'
import { DEMO_SKY_STRINGS } from '@/dev/demo/sky/strings'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))
vi.mock('@/services/admin/adminApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/admin/adminApi')>()),
  createModerationReport: vi.fn(),
}))

// #279: odds and ends from the 2026-10-18 i18n audit, each of which read
// English (or wrong grammar) to a reader of another language.
const LANGUAGES = ['en', 'de', 'fr', 'it'] as const
const UNAVAILABLE = {
  en: 'Status unavailable',
  de: 'Status nicht verfügbar',
  fr: 'Statut indisponible',
  it: 'Stato non disponibile',
}
const initialLanguage = i18n.language

afterAll(async () => {
  await i18n.changeLanguage(initialLanguage)
})

describe('a status the locales do not know', () => {
  for (const language of LANGUAGES) {
    it(`says "status unavailable" in ${language}`, async () => {
      await i18n.changeLanguage(language)
      const t = i18n.t.bind(i18n)
      expect(getTeacherHelpStatusLabel('on_hold_by_server', t)).toBe(UNAVAILABLE[language])
      expect(getSupportTicketStatusLabel('escalated', t)).toBe(UNAVAILABLE[language])
      expect(getFileStatusLabel('quarantined', t)).toBe(UNAVAILABLE[language])
    })
  }

  it('cannot reach another key or a whole group through the value', async () => {
    await i18n.changeLanguage('de')
    const t = i18n.t.bind(i18n)
    expect(getAdminFeedbackStatusLabel('', t)).toBe(UNAVAILABLE.de)
    expect(getAdminFeedbackStatusLabel('new.extra', t)).toBe(UNAVAILABLE.de)
    expect(getAdminFeedbackStatusLabel('common:status.loading', t)).toBe(UNAVAILABLE.de)
  })

  it('still names the values it knows', async () => {
    await i18n.changeLanguage('de')
    const t = i18n.t.bind(i18n)
    expect(getTeacherHelpStatusLabel('expired', t)).toBe('Abgelaufen')
    expect(getSupportTicketStatusLabel('waiting_on_user', t)).toBe('Wartet auf Antwort')
    await i18n.changeLanguage('fr')
    expect(getFileStatusLabel('parsed', t)).toBe('Prêt')
  })
})

describe('counted sentences', () => {
  const cases: Record<(typeof LANGUAGES)[number], { saved: [string, string]; signals: [string, string] }> = {
    en: { saved: ['Saved: 1 case a week.', 'Saved: 3 cases a week.'], signals: ['1 signal', '3 signals'] },
    de: { saved: ['Gespeichert: 1 Fall pro Woche.', 'Gespeichert: 3 Fälle pro Woche.'], signals: ['1 Signal', '3 Signale'] },
    fr: { saved: ['Enregistré : 1 cas par semaine.', 'Enregistré : 3 cas par semaine.'], signals: ['1 signal', '3 signaux'] },
    it: { saved: ['Salvato: 1 caso a settimana.', 'Salvato: 3 casi a settimana.'], signals: ['1 segnale', '3 segnali'] },
  }
  for (const language of LANGUAGES) {
    it(`agree with the count in ${language}`, () => {
      const t = i18n.getFixedT(language)
      const { saved, signals } = cases[language]
      expect([1, 3].map((count) => t('admin:accounts.teacherSupport.saved', { count }))).toEqual(saved)
      expect([1, 3].map((count) => t('practice:profile.signals', { count }))).toEqual(signals)
    })
  }
})

describe('the parent and teacher dashboard skeletons', () => {
  const skeletons = { parent: ParentDashboardSkeleton, teacher: TeacherDashboardSkeleton }
  for (const [who, Skeleton] of Object.entries(skeletons)) {
    it(`announce loading in the reader's language (${who})`, async () => {
      await i18n.changeLanguage('de')
      const { container } = render(
        <I18nextProvider i18n={i18n}>
          <Skeleton />
        </I18nextProvider>,
      )
      expect(screen.getByRole('status', { name: 'Übersicht wird geladen' })).toBeInTheDocument()
      expect(container.textContent).toContain('Übersicht wird geladen')
      expect(container.innerHTML).not.toMatch(/Loading/)
    })
  }
})

describe('reporting content from a help request', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear()
    vi.mocked(toast.error).mockClear()
  })

  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>{children}</QueryClientProvider>
  }
  const input = { questionId: 'q-1', surface: 'teacher_help', reason: 'other', severity: 'medium' } as never

  it('confirms the report in German', async () => {
    await i18n.changeLanguage('de')
    vi.mocked(createModerationReport).mockResolvedValue({ case_id: 'mc-42' } as never)
    const { result } = renderHook(() => useReportModerationCaseMutation(), { wrapper })
    await act(() => result.current.mutateAsync(input))
    expect(toast.success).toHaveBeenCalledWith('Meldung gesendet. Die Administration prüft sie (Fall mc-42).')
  })

  it('says the report failed in French', async () => {
    await i18n.changeLanguage('fr')
    vi.mocked(createModerationReport).mockRejectedValue(new Error('Network Error'))
    const { result } = renderHook(() => useReportModerationCaseMutation(), { wrapper })
    await act(() => result.current.mutateAsync(input).catch(() => undefined))
    expect(toast.error).toHaveBeenCalledWith('Impossible d’envoyer le signalement.')
  })
})

describe('the star map demo words', () => {
  // The audit counted `starmap:demo.notice` and `demo.emptyStar` as missing.
  // They are kept out of the bundled locales on purpose (#131): the demo
  // source adds them when it is loaded, which only the design preview, the
  // bench and tests do.
  it('stay out of the production locale files', () => {
    for (const language of LANGUAGES) {
      const file = path.join(process.cwd(), 'src/i18n/locales', language, 'starmap.json')
      expect(JSON.parse(readFileSync(file, 'utf8')).demo).toBeUndefined()
    }
  })

  it('are there in every language once the demo sky is loaded', async () => {
    await import('@/dev/demo/sky/source')
    for (const language of LANGUAGES) {
      const t = i18n.getFixedT(language, 'starmap')
      expect(t('demo.notice')).toBe(DEMO_SKY_STRINGS[language].notice)
      expect(t('demo.emptyStar')).toBe(DEMO_SKY_STRINGS[language].emptyStar)
    }
  })
})

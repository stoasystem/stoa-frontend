/*
 * #767: the teacher reply times count only the help requests of the last
 * `period_days` days (stoa-backend#697), so the card says which days.
 */
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { AdminTeacherSlaCard } from '@/components/admin/AdminTeacherSlaCard'
import i18n from '@/i18n'
import type { AdminTeacherSlaStats } from '@/services/admin/adminApi'

const STATS = {
  tracked_questions: 4,
  first_reply: { count: 2, average_seconds: 600, max_seconds: 900 },
  targets: { first_reply_seconds: 1800 },
  buckets: { within_target: 2, at_risk: 1, breached: 1, unknown: 0 },
} as unknown as AdminTeacherSlaStats

afterEach(async () => {
  await i18n.changeLanguage('en')
})

describe('the teacher reply time card names its period', () => {
  it.each([
    ['de', 'Letzte 30 Tage'],
    ['en', 'Last 30 days'],
    ['fr', '30 derniers jours'],
    ['it', 'Ultimi 30 giorni'],
  ])('says the last 30 days in %s', async (language, text) => {
    await i18n.changeLanguage(language)
    render(<AdminTeacherSlaCard stats={STATS} periodDays={30} />)
    expect(screen.getByText(text)).toBeInTheDocument()
  })

  it('takes the number of days from the stats rather than a fixed 30', async () => {
    await i18n.changeLanguage('en')
    render(<AdminTeacherSlaCard stats={STATS} periodDays={7} />)
    expect(screen.getByText('Last 7 days')).toBeInTheDocument()
  })

  it('names no period before the stats have been read', async () => {
    await i18n.changeLanguage('en')
    const { container } = render(<AdminTeacherSlaCard isLoading />)
    expect(container.textContent).not.toMatch(/days/)
  })
})

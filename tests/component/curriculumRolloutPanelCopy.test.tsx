/**
 * The curriculum card on a teacher's request (and a parent's child summary)
 * printed two backend values as they came: "practice backfill", the catalog's
 * internal source id, and "active", a subject's rollout state. The 11 Oct 2026
 * re-check of #162 found both on the German page.
 */
import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { beforeEach, describe, expect, it } from 'vitest'
import { CurriculumRolloutPanel } from '@/components/practice/CurriculumRolloutPanel'
import i18n from '@/i18n'
import type { CurriculumCatalog } from '@/types/practice'

const catalog = (source: string): CurriculumCatalog => ({
  subjects: [
    {
      id: 'math',
      name: 'Mathematik',
      description: '',
      gradeLevels: [],
      language: 'de',
      rolloutState: 'active',
      order: 1,
    },
  ],
  topics: [],
  units: [],
  lessons: [],
  rolloutSubjects: ['math'],
  includePreview: false,
  source,
})

function renderPanel(source: string) {
  render(
    <I18nextProvider i18n={i18n}>
      <CurriculumRolloutPanel catalog={catalog(source)} isLoading={false} isError={false} />
    </I18nextProvider>,
  )
}

beforeEach(async () => {
  await i18n.changeLanguage('de')
})

describe('the curriculum card says its values in the reader’s language', () => {
  it('names the catalog source and the rollout state in German', () => {
    renderPanel('practice_backfill')

    expect(screen.getByText('Aus der Übungsbank')).toBeInTheDocument()
    expect(screen.getByText('Aktiv')).toBeInTheDocument()
    expect(screen.queryByText(/practice.backfill/i)).toBeNull()
    expect(screen.queryByText('active')).toBeNull()
  })

  it('leaves out a source it has no words for rather than print the id', () => {
    renderPanel('some_new_source')

    expect(screen.queryByText(/some.new.source/i)).toBeNull()
  })
})

/**
 * "About you" drawn as the sky's glass (#644), with its controls still the
 * platform's own:
 *
 *   - each subject chip holds a real checkbox, named by the subject, that
 *     Tab reaches and click and Space tick and untick; the drawn tick is only
 *     drawn (hidden from the accessibility tree);
 *   - the year group is a native select named by its label, its own arrow
 *     off and a drawn chevron in its place, marked invalid when "Done" finds
 *     it empty;
 *   - "Done" lost the press edge;
 *   - the card says only its title and its controls' words, the save
 *     error's live region still mounted (#410);
 *   - `ChoiceSelect` on a page (the account page's year group and answer
 *     style) is exactly what it was: same element tree, classes and style.
 */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ChoiceSelect } from '@/components/base/ChoiceSelect'
import { AboutYou } from '@/features/starmap/onboarding/AboutYou'
import i18n from '@/i18n'
import enStarmap from '@/i18n/locales/en/starmap.json'
import { GRADES } from '../fakes/profileChoices'

const copy = enStarmap.aboutYou
const galaxies = [
  { subjectId: 'math', name: 'Mathematics', enrolled: true },
  { subjectId: 'physics', name: 'Physics', enrolled: true },
  { subjectId: 'chemistry', name: 'Chemistry', enrolled: false },
]

function show() {
  render(
    <I18nextProvider i18n={i18n}>
      <AboutYou grades={GRADES} galaxies={galaxies} ticked={null} saving={false} failed={false} onSave={vi.fn()} onLater={vi.fn()} />
    </I18nextProvider>,
  )
  return screen.getByRole('region', { name: copy.title })
}

beforeEach(async () => {
  await i18n.changeLanguage('en')
})

describe('the subject chips', () => {
  it('each holds a real checkbox, named by the subject, inside its pill', () => {
    const region = show()
    const group = within(region).getByRole('group', { name: copy.subjects })
    const boxes = within(group).getAllByRole('checkbox')
    expect(boxes.map((box) => box.getAttribute('type'))).toEqual(['checkbox', 'checkbox', 'checkbox'])
    for (const [index, galaxy] of galaxies.entries()) {
      const box = within(group).getByRole('checkbox', { name: galaxy.name })
      expect(box).toBe(boxes[index])
      expect(box.closest(`[data-subject="${galaxy.subjectId}"]`)).not.toBeNull()
    }
    // The drawn mark is decoration: nothing extra is read before the name.
    for (const mark of group.querySelectorAll('[data-subject] svg')) expect(mark).toHaveAttribute('aria-hidden', 'true')
  })

  it('tick and untick with a click on the pill and with Space, and say so', async () => {
    const user = userEvent.setup()
    const region = show()
    const chemistry = within(region).getByRole('checkbox', { name: 'Chemistry' })
    const pill = chemistry.closest('[data-subject]') as HTMLElement
    expect(chemistry).not.toBeChecked()
    expect(pill).not.toHaveAttribute('data-checked')

    await user.click(pill)
    expect(chemistry).toBeChecked()
    expect(pill).toHaveAttribute('data-checked')

    await user.click(chemistry)
    expect(chemistry).not.toBeChecked()

    // Tab from the year group reaches the first chip; Space toggles it.
    within(region).getByRole('combobox', { name: copy.grade }).focus()
    await user.tab()
    const math = within(region).getByRole('checkbox', { name: 'Mathematics' })
    expect(math).toHaveFocus()
    expect(math).toBeChecked()
    await user.keyboard(' ')
    expect(math).not.toBeChecked()
    await user.keyboard(' ')
    expect(math).toBeChecked()
  })
})

describe('the year group on the sky', () => {
  it('is a native select named by its label, its arrow drawn by us', () => {
    const region = show()
    const select = within(region).getByRole('combobox', { name: copy.grade })
    expect(select.tagName).toBe('SELECT')
    expect(select).toHaveClass('appearance-none')
    expect(select.style.colorScheme).toBe('dark')
    const chevron = select.parentElement?.querySelector('[data-choice-chevron]')
    expect(chevron).toHaveAttribute('aria-hidden', 'true')
    expect(chevron).toHaveClass('pointer-events-none')
  })

  it('opens onto a solid dark list, not the glass', () => {
    // Windows Chromium painted the open list from the options' own background, ignoring
    // color-scheme: the near-clear glass came out as a white list of white text.
    const region = show()
    const select = within(region).getByRole('combobox', { name: copy.grade })
    for (const option of within(select).getAllByRole('option')) {
      expect(option).toHaveClass('bg-[color:var(--sky-2,#131C33)]')
      expect(option).toHaveClass('text-[color:var(--on-sky-text)]')
    }
  })

  it('reads as the placeholder until a year is chosen, and is marked invalid when "Done" finds it empty', async () => {
    const user = userEvent.setup()
    const region = show()
    const select = within(region).getByRole('combobox', { name: copy.grade })
    expect(select).toHaveClass('text-[color:var(--on-sky-text-caption)]')

    await user.click(within(region).getByRole('button', { name: copy.done }))
    expect(select).toHaveAttribute('aria-invalid', 'true')
    expect(select).toHaveAccessibleDescription(copy.gradeMissing)

    await user.selectOptions(select, GRADES[4].code)
    expect(select).not.toHaveAttribute('aria-invalid')
    expect(select).toHaveClass('text-[color:var(--on-sky-text)]')
  })
})

describe('the card\'s words', () => {
  it('are the title and the controls\' own, with the save error\'s live region mounted and empty', () => {
    const region = show()
    // The line on why it asks and the note under the buttons were taken off (#644: too busy).
    const paragraphs = [...region.querySelectorAll('p')]
    expect(paragraphs).toHaveLength(1)
    expect(paragraphs[0]).toHaveAttribute('role', 'alert')
    expect(paragraphs[0]).toBeEmptyDOMElement()
    expect(copy).not.toHaveProperty('why')
    expect(copy).not.toHaveProperty('laterNote')
  })
})

describe('the subjects\' heading', () => {
  it('still names the group of chips, but is not drawn', () => {
    const region = show()
    const group = within(region).getByRole('group', { name: copy.subjects })
    const legend = group.querySelector('legend')
    expect(legend).toHaveTextContent(copy.subjects)
    expect(legend).toHaveClass('sr-only')
  })
})

describe('"Done"', () => {
  it('is the filled sky button without the press edge', () => {
    const region = show()
    const done = within(region).getByRole('button', { name: copy.done })
    expect(done).toHaveAttribute('data-variant', 'onSky')
    expect(done).not.toHaveAttribute('data-lift')
  })
})

describe('ChoiceSelect on a page', () => {
  it('is drawn exactly as before #644', () => {
    render(<ChoiceSelect label="Year group" placeholder="Choose" choices={GRADES} value="grade_9_secondary" onChange={vi.fn()} hint="Hint" />)
    const select = screen.getByRole('combobox', { name: 'Year group' })
    // The select sits straight in the field's column, with no wrapper or drawn arrow.
    expect(select.parentElement).toHaveAttribute('data-choice-select')
    expect(document.querySelector('[data-choice-chevron]')).toBeNull()
    expect(select.className).toBe('min-w-0 cursor-pointer disabled:cursor-default disabled:opacity-60 border-0 bg-fill text-ink')
    expect(select.getAttribute('style')).toBe('height: 38px; border-radius: 10px; padding-inline: 12px; font-size: 15px;')
    for (const option of within(select).getAllByRole('option')) expect(option).not.toHaveAttribute('class')
  })
})

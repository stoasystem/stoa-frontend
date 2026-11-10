/*
 * "About you" (#591, `useAboutYou`): one screen before a student's first
 * landing, over the map. Murmi and a title, then the year group from the
 * backend's list (`ChoiceSelect`, the same dropdown as on /me), and the
 * subjects school is on this term, ticked from the sky's galaxies -- the ones
 * the profile already names, else the ones the student takes. "Done" saves
 * both; "Later" (or Escape) goes on to the map, the start then the very first
 * star. The card says no more than that (#644: the line on why it asks and
 * the note under the buttons made it too busy).
 *
 * Not a modal, as plan B's question is not: the map behind it still moves.
 * The year group takes the focus when it opens. A save that fails says so
 * under the buttons and leaves both ways open.
 */
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/base'
import { ChoiceSelect } from '@/components/base/ChoiceSelect'
import { Murmi } from '@/components/brand/Murmi'
import type { Galaxy } from '@/features/starmap/model/starMap'
import { CARD_BAND, CARD_FRAME } from '@/features/starmap/onboarding/cardBand'
import type { AboutYouAnswer } from '@/features/starmap/onboarding/useAboutYou'
import type { ProfileChoice } from '@/types/student'

export type AboutYouProps = {
  grades: readonly ProfileChoice[]
  /** The galaxies of the sky: the subjects to tick. */
  galaxies: readonly Pick<Galaxy, 'subjectId' | 'name' | 'enrolled'>[]
  /** The subjects the profile already ticks, if any. */
  ticked: readonly string[] | null
  saving: boolean
  failed: boolean
  onSave: (answer: AboutYouAnswer) => void
  onLater: () => void
}

/*
 * A subject chip (#644): the chips' glass over the sky. Not ticked, a faint
 * fill under the 3:1 rule and the body colour; ticked, one step brighter, a
 * thin light ring and the title colour, with a tick before the name. The mark
 * takes the same room either way, so ticking never reflows the row.
 */
const CHIP = [
  'relative inline-flex min-h-[38px] cursor-pointer select-none items-center gap-1.5 rounded-full border border-solid pr-3.5 pl-3 text-[14px]',
  'transition-colors duration-[var(--motion-press)] ease-out',
  'border-[color:var(--on-sky-field-rule)] bg-white/[0.04] text-[color:var(--on-sky-text-body)] hover:bg-[color:var(--on-sky-selected)]',
  'has-[:checked]:border-[color:var(--on-sky-plain)] has-[:checked]:bg-white/[0.16] has-[:checked]:text-[color:var(--on-sky-text)] has-[:checked]:hover:bg-white/[0.2]',
  'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
].join(' ')

/** Before the name: a tick when the subject is ticked, a faint ring when not. Drawn only; the checkbox says it. */
function ChipMark({ checked }: { checked: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      {checked ? <path d="M3.5 8.5l3 3 6-7" strokeWidth="1.75" /> : <circle cx="8" cy="8" r="4.5" strokeWidth="1.25" opacity="0.55" />}
    </svg>
  )
}

export function AboutYou({ grades, galaxies, ticked, saving, failed, onSave, onLater }: AboutYouProps) {
  const { t } = useTranslation('starmap')
  const titleId = useId()
  const gradeRef = useRef<HTMLSelectElement>(null)
  useEffect(() => {
    gradeRef.current?.focus({ preventScroll: true })
  }, [])

  const [grade, setGrade] = useState('')
  const [missingGrade, setMissingGrade] = useState(false)
  const [subjects, setSubjects] = useState<readonly string[]>(() => {
    const named = ticked ? galaxies.filter((galaxy) => ticked.includes(galaxy.subjectId)) : []
    return (named.length > 0 ? named : galaxies.filter((galaxy) => galaxy.enrolled)).map((galaxy) => galaxy.subjectId)
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    if (saving) return
    if (!grade) {
      setMissingGrade(true)
      gradeRef.current?.focus()
      return
    }
    onSave({ grade, subjects })
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Escape' || event.defaultPrevented) return
    event.preventDefault()
    onLater()
  }

  return (
    // Between the map's controls, never over them (`cardBand.ts`, #625).
    <div data-about-you className={CARD_FRAME}>
      <div className={CARD_BAND}>
        <section
          data-starmap-overlay
          aria-labelledby={titleId}
          onKeyDown={onKeyDown}
          className="starmap-first-landing pointer-events-auto max-h-full w-[min(400px,100%)] overflow-y-auto overscroll-contain rounded-[var(--corner-card)] border border-solid border-[color:var(--sky-glass-border)] px-5 py-4 text-on-sky"
          data-shown
          style={{ background: 'var(--sky-glass)', backdropFilter: 'blur(var(--sky-glass-blur))', WebkitBackdropFilter: 'blur(var(--sky-glass-blur))' }}
        >
          <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
            <div className="flex items-center gap-3">
              <Murmi mood="waving" size={40} />
              <h2 id={titleId} className="m-0 min-w-0 text-[16px] font-semibold leading-snug text-[color:var(--on-sky-text)]">
                {t('aboutYou.title')}
              </h2>
            </div>
            <ChoiceSelect
              ref={gradeRef}
              tone="sky"
              label={t('aboutYou.grade')}
              placeholder={t('aboutYou.gradePlaceholder')}
              choices={grades}
              value={grade}
              error={missingGrade && !grade ? t('aboutYou.gradeMissing') : undefined}
              onChange={(code) => {
                setGrade(code)
                setMissingGrade(false)
              }}
            />
            {galaxies.length > 0 && (
              <fieldset className="m-0 min-w-0 space-y-2 border-0 p-0">
                <legend className="mb-1.5 p-0 text-[13px] leading-[1.3] font-medium text-[color:var(--on-sky-text)]">{t('aboutYou.subjects')}</legend>
                <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                  {galaxies.map((galaxy) => {
                    const checked = subjects.includes(galaxy.subjectId)
                    return (
                      <li key={galaxy.subjectId}>
                        <label data-subject={galaxy.subjectId} data-checked={checked || undefined} className={CHIP}>
                          {/* The real checkbox, laid over the whole pill and not drawn: the pill is the toggle, Tab and Space reach it, a screen reader says "checked". */}
                          <input
                            type="checkbox"
                            className="absolute inset-0 m-0 size-full cursor-pointer appearance-none rounded-full opacity-0"
                            checked={checked}
                            onChange={() =>
                              setSubjects((before) => (checked ? before.filter((id) => id !== galaxy.subjectId) : [...before, galaxy.subjectId]))
                            }
                          />
                          <ChipMark checked={checked} />
                          {galaxy.name}
                        </label>
                      </li>
                    )
                  })}
                </ul>
              </fieldset>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {/* White and flat (#644): still the sky's one filled button, without the press edge that sat heavy on the card. */}
                <Button type="submit" variant="onSky" size="regular" aria-disabled={saving || undefined}>
                  {saving ? t('aboutYou.saving') : t('aboutYou.done')}
                </Button>
                <Button type="button" variant="onSkyPlain" size="small" onClick={onLater}>
                  {t('aboutYou.later')}
                </Button>
              </div>
              {/* Always mounted, only its text changes: a live region added together with its words is not announced (#410).
                  In the buttons' block, so while empty it adds no gap under them. */}
              <p role="alert" className="m-0 text-[13px] leading-[1.35] text-red [&:not(:empty)]:mt-2">
                {failed ? t('aboutYou.saveFailed') : null}
              </p>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}

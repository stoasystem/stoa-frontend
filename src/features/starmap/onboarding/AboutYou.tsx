/*
 * "About you" (#591, `useAboutYou`): one screen before a student's first
 * landing, over the map. Murmi says why it asks; the year group from the
 * backend's list (`ChoiceSelect`, the same dropdown as on /me), and the
 * subjects school is on this term, ticked from the sky's galaxies -- the ones
 * the profile already names, else the ones the student takes. "Done" saves
 * both; "Later" (or Escape) goes on to the map, the start then the very first
 * star, which the line under it says.
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
    // A phone keeps the right edge for Ask's button (`data-ask-reopen`), the card beside it.
    <div data-about-you className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-y-auto p-4 max-[559px]:pr-[72px]">
      <section
        data-starmap-overlay
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
        className="starmap-first-landing pointer-events-auto w-[min(400px,100%)] rounded-[var(--corner-card)] border border-solid border-[color:var(--sky-glass-border)] px-5 py-4 text-on-sky"
        data-shown
        style={{ background: 'var(--sky-glass)', backdropFilter: 'blur(var(--sky-glass-blur))', WebkitBackdropFilter: 'blur(var(--sky-glass-blur))' }}
      >
        <form className="space-y-4" onSubmit={submit} noValidate>
          <div className="flex items-start gap-3">
            <Murmi mood="waving" size={40} />
            <div className="space-y-1">
              <h2 id={titleId} className="m-0 text-[16px] font-semibold leading-snug text-[color:var(--on-sky-text)]">
                {t('aboutYou.title')}
              </h2>
              <p className="m-0 text-[13px] leading-5 text-[color:var(--on-sky-text-body)]">{t('aboutYou.why')}</p>
            </div>
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
                      <label
                        data-subject={galaxy.subjectId}
                        className="inline-flex min-h-[38px] cursor-pointer items-center gap-2 rounded-full border border-solid border-[color:var(--on-sky-field-rule)] px-3 text-[14px] text-[color:var(--on-sky-text)] has-[:checked]:bg-[color:var(--on-sky-selected)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring"
                      >
                        <input
                          type="checkbox"
                          className="size-4 accent-[color:var(--on-sky-button)]"
                          checked={checked}
                          onChange={() =>
                            setSubjects((before) => (checked ? before.filter((id) => id !== galaxy.subjectId) : [...before, galaxy.subjectId]))
                          }
                        />
                        {galaxy.name}
                      </label>
                    </li>
                  )
                })}
              </ul>
            </fieldset>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" lift variant="onSky" size="regular" aria-disabled={saving || undefined}>
              {saving ? t('aboutYou.saving') : t('aboutYou.done')}
            </Button>
            <Button type="button" variant="onSkyPlain" size="small" onClick={onLater}>
              {t('aboutYou.later')}
            </Button>
          </div>
          <div>
            <p className="m-0 text-[12px] leading-[1.4] text-[color:var(--on-sky-text-caption)]">{t('aboutYou.laterNote')}</p>
            {/* Always mounted, only its text changes: a live region added together with its words is not announced (#410). */}
            <p role="alert" className="m-0 text-[13px] leading-[1.35] text-red [&:not(:empty)]:mt-2">
              {failed ? t('aboutYou.saveFailed') : null}
            </p>
          </div>
        </form>
      </section>
    </div>
  )
}

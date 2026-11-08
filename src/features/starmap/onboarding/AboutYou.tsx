/*
 * "About you" (#591): before a student's first landing on the star map, when
 * their profile holds no year group the backend can read, Murmi asks two
 * things on one card -- the year group, from the backend's own list
 * (`choices.grade`, stoa-backend#310), and the subjects taken this term, from
 * the sky's galaxies (those the student is enrolled in already ticked, and
 * the profile's own ticks). "Done" saves both to the profile; the star map
 * then starts the student at the first star of their year (reason `grade`),
 * in the first subject ticked. "Later" goes straight on, and says what that
 * means: the start is the most basic one, and it can all be changed on /me.
 *
 * A failed save is said on the card, and the student can still go on: the
 * map does not wait on it.
 *
 * The card takes the first landing's look (`FirstSubjectQuestion`): glass on
 * the sky, Murmi at its head. Its first field takes the focus; Escape is
 * "Later"; each field names its error.
 */
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/base'
import { ChoiceSelect, type Choice } from '@/components/base/ChoiceSelect'
import { Murmi } from '@/components/brand/Murmi'
import type { Galaxy } from '@/features/starmap/model/starMap'
import { cn } from '@/lib/utils'

/** What the card sends: a year group, if one was chosen, and the subjects ticked. */
export type AboutYouAnswer = { grade: string | null; primarySubjects: string[] }

/** How a save went wrong: the year group is not on the list any more, or anything else. */
export type AboutYouFailure = 'unknownGrade' | 'failed'

export type AboutYouProps = {
  /** The year groups to choose from, in school order, named by the backend. */
  grades: readonly Choice[]
  /** The sky's galaxies: what may be ticked. */
  subjects: readonly Pick<Galaxy, 'subjectId' | 'name' | 'enrolled'>[]
  /** The subjects the profile already ticks. */
  primarySubjects: readonly string[]
  /** While the answer is on its way. */
  saving: boolean
  /** The last save went wrong. */
  failure: AboutYouFailure | null
  onDone: (answer: AboutYouAnswer) => void
  onLater: () => void
}

export function AboutYou({ grades, subjects, primarySubjects, saving, failure, onDone, onLater }: AboutYouProps) {
  const { t } = useTranslation('starmap')
  const titleId = useId()
  const laterId = useId()
  const field = useRef<HTMLSelectElement>(null)
  const [grade, setGrade] = useState('')
  const [ticked, setTicked] = useState<ReadonlySet<string>>(
    () => new Set(subjects.filter((galaxy) => galaxy.enrolled || primarySubjects.includes(galaxy.subjectId)).map((galaxy) => galaxy.subjectId)),
  )

  useEffect(() => {
    field.current?.focus({ preventScroll: true })
  }, [])

  function submit(event: FormEvent) {
    event.preventDefault()
    if (saving) return
    // In the sky's order, so "the first ticked" is the first galaxy the student sees ticked.
    onDone({ grade: grade || null, primarySubjects: subjects.map((galaxy) => galaxy.subjectId).filter((id) => ticked.has(id)) })
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Escape' || event.defaultPrevented) return
    event.preventDefault()
    onLater()
  }

  const toggle = (subjectId: string, on: boolean) =>
    setTicked((before) => {
      const next = new Set(before)
      if (on) next.add(subjectId)
      else next.delete(subjectId)
      return next
    })

  return (
    // A phone keeps the right edge for Ask's button (`data-ask-reopen`), as the first question does.
    <div data-about-you className="flex h-full min-h-0 w-full flex-1 items-center justify-center overflow-y-auto p-4 max-[559px]:pr-[72px]">
      <section
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
        className="starmap-first-landing w-[min(420px,100%)] rounded-[var(--corner-card)] border border-solid border-[color:var(--sky-glass-border)] px-5 py-4 text-on-sky"
        data-shown
        style={{ background: 'var(--sky-glass)', backdropFilter: 'blur(var(--sky-glass-blur))', WebkitBackdropFilter: 'blur(var(--sky-glass-blur))' }}
      >
        <form className="space-y-4" onSubmit={submit} noValidate>
          <div className="flex items-center gap-3">
            <Murmi mood="waving" size={40} animated />
            <div className="min-w-0">
              <h2 id={titleId} className="m-0 text-[16px] font-semibold leading-snug text-[color:var(--on-sky-text)]">
                {t('aboutYou.title')}
              </h2>
              <p className="m-0 mt-0.5 text-[13px] leading-5 text-[color:var(--on-sky-text-body)]">{t('aboutYou.body')}</p>
            </div>
          </div>

          <ChoiceSelect
            ref={field}
            tone="sky"
            label={t('aboutYou.grade')}
            placeholder={t('aboutYou.gradeNone')}
            choices={grades}
            value={grade}
            onChange={setGrade}
            error={failure === 'unknownGrade' ? t('aboutYou.unknownGrade') : undefined}
          />

          {subjects.length > 0 && (
            <fieldset className="m-0 min-w-0 border-0 p-0">
              <legend className="mb-1.5 p-0 text-[13px] leading-[1.3] font-medium text-[color:var(--on-sky-text)]">{t('aboutYou.subjects')}</legend>
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {subjects.map((galaxy) => {
                  const on = ticked.has(galaxy.subjectId)
                  return (
                    <li key={galaxy.subjectId}>
                      <label
                        data-subject={galaxy.subjectId}
                        className={cn(
                          'inline-flex min-h-[38px] cursor-pointer items-center gap-2 rounded-full border border-solid px-3 text-[14px] text-[color:var(--on-sky-text)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
                          on ? 'border-[color:var(--on-sky-text)] bg-[color:var(--on-sky-selected)]' : 'border-[color:var(--on-sky-field-rule)]',
                        )}
                      >
                        <input
                          type="checkbox"
                          className="size-4 accent-[color:var(--accent-on-sky)] focus-visible:outline-none"
                          checked={on}
                          onChange={(event) => toggle(galaxy.subjectId, event.target.checked)}
                        />
                        {galaxy.name}
                      </label>
                    </li>
                  )
                })}
              </ul>
            </fieldset>
          )}

          {failure === 'failed' && (
            <p className="m-0 text-[13px] leading-[1.35] text-[color:var(--on-sky-text)]">{t('aboutYou.saveFailed')}</p>
          )}
          {/* Always mounted, only its words change: what went wrong is read out as it happens (#410). */}
          <p className="sr-only" role="alert">
            {failure === 'failed' ? t('aboutYou.saveFailed') : failure === 'unknownGrade' ? t('aboutYou.unknownGrade') : null}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" lift variant="onSky" size="regular" disabled={saving}>
              {saving ? t('aboutYou.saving') : t('aboutYou.done')}
            </Button>
            <Button type="button" variant="onSkyPlain" size="small" aria-describedby={laterId} onClick={onLater}>
              {t('aboutYou.later')}
            </Button>
          </div>
          <p id={laterId} className="m-0 text-[12px] leading-[1.4] text-[color:var(--on-sky-text-caption)]">
            {t('aboutYou.laterNote')}
          </p>
        </form>
      </section>
    </div>
  )
}

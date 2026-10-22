/*
 * Plan B (docs/research/user-onboarding-design.md): a newcomer who takes more
 * than one subject is asked which one school is on now, instead of being
 * left to pick a galaxy out of the sky. One answer per subject, and "Not
 * sure", which lands on the galaxy in focus. The answer only steers the
 * camera (`useFirstLanding`).
 *
 * Over the map, in the middle, with the galaxy behind it. Not a modal: the
 * map still moves and every star is still reachable; its heading takes focus
 * when it opens, so a keyboard or a screen reader starts from the question.
 */
import { useEffect, useId, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/base'
import { Murmi } from '@/components/brand/Murmi'
import type { Galaxy } from '@/features/starmap/model/starMap'

export type FirstSubjectQuestionProps = {
  subjects: readonly Galaxy[]
  onChoose: (subjectId: string | null) => void
}

export function FirstSubjectQuestion({ subjects, onChoose }: FirstSubjectQuestionProps) {
  const { t } = useTranslation('starmap')
  const titleId = useId()
  const titleRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true })
  }, [])

  return (
    <div data-first-question className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
      <section
        data-starmap-overlay
        aria-labelledby={titleId}
        className="starmap-first-landing pointer-events-auto w-[min(380px,100%)] space-y-3 rounded-[var(--corner-card)] border border-solid border-[color:var(--sky-glass-border)] px-5 py-4 text-on-sky"
        data-shown
        style={{ background: 'var(--sky-glass)', backdropFilter: 'blur(var(--sky-glass-blur))', WebkitBackdropFilter: 'blur(var(--sky-glass-blur))' }}
      >
        <div className="flex items-center gap-3">
          <Murmi mood="calm" size={40} />
          <h2 id={titleId} ref={titleRef} tabIndex={-1} className="m-0 text-[16px] font-semibold leading-snug text-[color:var(--on-sky-text)] outline-none">
            {t('firstQuestion.title')}
          </h2>
        </div>
        <p className="m-0 text-[13px] leading-5 text-[color:var(--on-sky-text-body)]">{t('firstQuestion.body')}</p>
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          {subjects.map((galaxy) => (
            <li key={galaxy.subjectId}>
              <Button lift variant="onSky" size="regular" data-subject={galaxy.subjectId} onClick={() => onChoose(galaxy.subjectId)}>
                {galaxy.name}
              </Button>
            </li>
          ))}
        </ul>
        <Button variant="onSkyPlain" size="small" onClick={() => onChoose(null)}>
          {t('firstQuestion.unsure')}
        </Button>
      </section>
    </div>
  )
}

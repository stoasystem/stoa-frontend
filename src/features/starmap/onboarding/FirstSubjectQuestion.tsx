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
 * Answered, it fades out first and the camera takes off as it goes; on a
 * phone it keeps clear of Ask's button on the map's right edge.
 */
import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/base'
import { Murmi } from '@/components/brand/Murmi'
import type { Galaxy } from '@/features/starmap/model/starMap'
import { usePrefersReducedMotion } from '@/features/starmap/motion/usePrefersReducedMotion'
import { BUBBLE_EXIT_MS, REDUCED_EXIT_MS } from '@/features/starmap/onboarding/FirstLandingBubble'
import { cn } from '@/lib/utils'

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

  // The answer goes once the card has faded: the flight starts as the card leaves.
  const reducedMotion = usePrefersReducedMotion()
  const [answer, setAnswer] = useState<{ subjectId: string | null } | null>(null)
  const chooseRef = useRef(onChoose)
  useEffect(() => {
    chooseRef.current = onChoose
  }, [onChoose])
  useEffect(() => {
    if (!answer) return
    const timer = window.setTimeout(() => chooseRef.current(answer.subjectId), reducedMotion ? REDUCED_EXIT_MS : BUBBLE_EXIT_MS)
    return () => window.clearTimeout(timer)
  }, [answer, reducedMotion])
  const pick = (subjectId: string | null) => {
    if (!answer) setAnswer({ subjectId })
  }

  return (
    // A phone keeps the right edge for Ask's button (`data-ask-reopen`), the card beside it.
    <div data-first-question className="pointer-events-none absolute inset-0 flex items-center justify-center p-4 max-[559px]:pr-[72px]">
      <section
        data-starmap-overlay
        aria-labelledby={titleId}
        className={cn(
          'starmap-first-landing w-[min(380px,100%)] space-y-3 rounded-[var(--corner-card)] border border-solid border-[color:var(--sky-glass-border)] px-5 py-4 text-on-sky',
          answer ? 'pointer-events-none' : 'pointer-events-auto',
        )}
        data-shown
        data-leaving={answer ? true : undefined}
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
              <Button lift variant="onSky" size="regular" data-subject={galaxy.subjectId} onClick={() => pick(galaxy.subjectId)}>
                {galaxy.name}
              </Button>
            </li>
          ))}
        </ul>
        <Button variant="onSkyPlain" size="small" onClick={() => pick(null)}>
          {t('firstQuestion.unsure')}
        </Button>
      </section>
    </div>
  )
}

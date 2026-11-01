/*
 * A small star's marks in HTML (#501): its dot, core or extension, lit or
 * not, and what it asks to be learned first. The star's card and the small
 * star's own page (`/chapter/:unitId?skill=`) both show them, so the two say
 * the same thing the same way.
 *
 * A hint never locks (ADR 0004): it names the stars to light first, each a
 * link that flies the map there, and the practice stays open beside it.
 */
import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { KnowledgeSkill } from '@/features/starmap/model/starMap'
import type { PrerequisiteTarget } from '@/features/starmap/model/skillPractice'
import { cn } from '@/lib/utils'

/**
 * The small star's dot. Core: filled gold when lit, an outline when not.
 * Extension: smaller and dashed while dark, and lit it carries a glow of its
 * own -- told apart by shape, not by colour alone.
 */
export function SkillDot({ skill, className }: { skill: Pick<KnowledgeSkill, 'lit' | 'extension'>; className?: string }) {
  const extension = skill.extension === true
  return (
    <span
      aria-hidden="true"
      data-skill-dot={`${extension ? 'extension' : 'core'}-${skill.lit ? 'lit' : 'dark'}`}
      className={cn(
        'inline-block shrink-0 rounded-full',
        extension
          ? skill.lit
            ? 'size-2 bg-lit shadow-[0_0_0_2px_rgba(255,255,255,0.18),0_0_8px_3px_var(--lit)]'
            : 'size-[7px] border border-dashed border-white/45'
          : skill.lit
            ? 'size-2 bg-lit'
            : 'size-2 border border-solid border-white/55',
        className,
      )}
    />
  )
}

/** 「拓展」 beside a small star's name. */
export function ExtensionTag() {
  const { t } = useTranslation('starmap')
  return (
    <span
      data-skill-extension
      className="inline-flex items-center rounded-full border border-dashed border-white/40 px-1.5 text-[11px] leading-[18px] font-semibold text-[color:var(--on-sky-text-body)]"
    >
      {t('star.extension')}
    </span>
  )
}

/** What a small star asks to be learned first: its star's earlier stages, and stars to light first. */
export function SkillHints({
  hints,
  to,
  stillOpen = false,
  className,
}: {
  hints: { earlierStages: boolean; stars: PrerequisiteTarget[] }
  /** Where a star to light first is on the map; null for a star the sky does not hold. */
  to: (target: PrerequisiteTarget) => string | null
  /** Say that the practice is open all the same (the small star's own page). */
  stillOpen?: boolean
  className?: string
}) {
  const { t } = useTranslation('starmap')
  if (!hints.earlierStages && hints.stars.length === 0) return null
  const link =
    'font-semibold text-[color:var(--on-sky-plain)] underline decoration-white/40 underline-offset-2 hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
  return (
    <div data-skill-hints className={cn('flex flex-col gap-0.5 text-[13px] text-[color:var(--on-sky-text-body)]', className)}>
      {hints.earlierStages && <p className="m-0" data-skill-hint="earlier-stages">{t('star.earlierStages')}</p>}
      {hints.stars.length > 0 && (
        <p className="m-0" data-skill-hint="light-first">
          {t('star.lightFirst')}{' '}
          {hints.stars.map((target, index) => {
            const path = to(target)
            return (
              <Fragment key={target.unitId}>
                {index > 0 && ', '}
                {path ? (
                  <Link to={path} className={link}>
                    {target.name}
                  </Link>
                ) : (
                  <span className="font-semibold text-on-sky">{target.name}</span>
                )}
              </Fragment>
            )
          })}
        </p>
      )}
      {stillOpen && <p className="m-0">{t('star.stillOpen')}</p>}
    </div>
  )
}

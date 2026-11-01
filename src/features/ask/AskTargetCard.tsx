import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'
import { ASK_STAR_LINK_CLASS, AskStarFrame } from '@/features/ask/AskStarFrame'
import { subjectOfNebula } from '@/features/starmap/model/starMap'
import { DEFAULT_SUBJECT_ID, DEMO_STAR_COUNT, fixtureSizeFrom, useStarMap } from '@/features/starmap/useStarMap'
import { pathForTarget, type StarCardFocus } from '@/features/starmap/view/layers'
import { useAskStore } from '@/store/askStore'

/*
 * Finding a star (#487, CONTEXT.md「找星」): an answer that recognised the star
 * the student wants to go to carries it (`targetUnit`, stoa-backend#124), and
 * this card sits under that answer. Followed, Ask closes and the map flies to
 * the star and opens its card, which takes the focus -- the star's own route,
 * so a star of another subject, in a dimmed galaxy or already lit, is reached
 * the same way.
 *
 * The star is looked up in the student's whole sky. One the sky does not
 * hold (not read yet, could not be read, or not drawn as a star) gets no
 * card: a card with nowhere to fly would be a dead link.
 */
export function AskTargetCard({ unitId }: { unitId: string }) {
  const { t } = useTranslation('chat')
  const location = useLocation()
  const nameId = useId()
  // The sky the map route draws: every galaxy, whichever one is in focus.
  const map = useStarMap(DEFAULT_SUBJECT_ID, fixtureSizeFrom(new URLSearchParams(location.search), DEMO_STAR_COUNT))
  const star = map.stars.find((candidate) => candidate.unitId === unitId)
  if (!star) return null
  const subjectId = subjectOfNebula(map, star.nebulaId)
  const where = [
    map.subjects.find((subject) => subject.subjectId === subjectId)?.name,
    map.nebulae.find((nebula) => nebula.topicId === star.nebulaId)?.name,
  ].filter(Boolean).join(' · ')
  const arrival: StarCardFocus = { focusStarCard: star.unitId }

  return (
    <AskStarFrame state={star.state} progress={star.progress} data-ask-target={star.unitId} aria-label={t('ask.target.label', { name: star.name })}>
      <p id={nameId} className="m-0 text-[15px] font-semibold text-ink">{star.name}</p>
      {where && <p className="m-0 text-[13px] text-caption">{where}</p>}
      <Link
        to={{ pathname: pathForTarget(subjectId, { layer: 'star', nebulaId: star.nebulaId, unitId: star.unitId }), search: location.search }}
        state={arrival}
        // Ask makes way for the map; from `/ask` or a lesson, leaving the page closes it anyway.
        onClick={() => useAskStore.getState().close()}
        aria-describedby={nameId}
        className={ASK_STAR_LINK_CLASS}
      >
        {t('ask.target.show')}
      </Link>
    </AskStarFrame>
  )
}

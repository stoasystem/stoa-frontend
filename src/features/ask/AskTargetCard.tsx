import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'
import { ASK_STAR_LINK_CLASS, AskStarFrame } from '@/features/ask/AskStarFrame'
import { useAskMakeWay } from '@/features/ask/askMakeWay'
import type { FindStarArrival } from '@/features/starmap/findStar/useFindStar'
import { subjectOfNebula } from '@/features/starmap/model/starMap'
import { DEFAULT_SUBJECT_ID, DEMO_STAR_COUNT, fixtureSizeFrom, useStarMap } from '@/features/starmap/useStarMap'
import { pathForTarget, type StarCardFocus } from '@/features/starmap/view/layers'
import { useAskStore } from '@/store/askStore'

/*
 * Finding a star (#487, CONTEXT.md「找星」): an answer that recognised the star
 * the student wants to go to carries it (`targetUnit`, stoa-backend#124), and
 * this card sits under that answer. Followed, the map flies to the star and
 * opens its card, which takes the focus -- the star's own route, so a star of
 * another subject, in a dimmed galaxy or already lit, is reached the same way.
 * On a wide screen Ask moves into the panel beside the map and stays open on
 * the conversation (#660); elsewhere it closes, as before.
 *
 * The link also asks the map to find the star (#489, `FindStarArrival`): with
 * stars missing on the way, the map shows the path to it and Murmi's
 * suggestion instead of the card (`starmap/findStar/useFindStar.ts`).
 *
 * The star is looked up in the student's whole sky. One the sky does not
 * hold (not read yet, could not be read, or not drawn as a star) gets no
 * card: a card with nowhere to fly would be a dead link.
 */
export function AskTargetCard({ unitId }: { unitId: string }) {
  const { t } = useTranslation('chat')
  const location = useLocation()
  const nameId = useId()
  const makeWay = useAskMakeWay()
  // The sky the map route draws: every galaxy, whichever one is in focus.
  const map = useStarMap(DEFAULT_SUBJECT_ID, fixtureSizeFrom(new URLSearchParams(location.search), DEMO_STAR_COUNT))
  const star = map.stars.find((candidate) => candidate.unitId === unitId)
  if (!star) return null
  const subjectId = subjectOfNebula(map, star.nebulaId)
  const where = [
    map.subjects.find((subject) => subject.subjectId === subjectId)?.name,
    map.nebulae.find((nebula) => nebula.topicId === star.nebulaId)?.name,
  ].filter(Boolean).join(' · ')
  const arrival: StarCardFocus & FindStarArrival = { focusStarCard: star.unitId, findStar: { unitId: star.unitId } }

  return (
    <AskStarFrame state={star.state} progress={star.progress} data-ask-target={star.unitId} aria-label={t('ask.target.label', { name: star.name })}>
      <p id={nameId} className="m-0 text-[15px] font-semibold text-ink">{star.name}</p>
      {where && <p className="m-0 text-[13px] text-caption">{where}</p>}
      <Link
        to={{ pathname: pathForTarget(subjectId, { layer: 'star', nebulaId: star.nebulaId, unitId: star.unitId }), search: location.search }}
        state={arrival}
        // Ask makes way for the map: beside it on a wide screen (#660), else
        // closed; from a lesson, leaving the page closes it anyway.
        onClick={() => (makeWay ? makeWay() : useAskStore.getState().close())}
        aria-describedby={nameId}
        className={ASK_STAR_LINK_CLASS}
      >
        {t('ask.target.show')}
      </Link>
    </AskStarFrame>
  )
}

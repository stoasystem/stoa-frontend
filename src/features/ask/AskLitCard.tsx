import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ASK_STAR_LINK_CLASS, AskStarFrame } from '@/features/ask/AskStarFrame'
import { pathForTarget } from '@/features/starmap/view/layers'
import type { LitMoment } from '@/store/litMomentsStore'

/*
 * A lighting moment in the Ask thread (#51; PR #66's handover): a knowledge
 * point lit for the first time, as its own kind of entry beside the
 * messages -- progress flowing back into the conversation. Neither the
 * student's nor an answer: centred, with the lit star, and a way back to it
 * on the map.
 */
export function AskLitCard({ moment }: { moment: LitMoment }) {
  const { t } = useTranslation('chat')
  const to = pathForTarget(moment.subjectId, { layer: 'star', nebulaId: moment.nebulaId, unitId: moment.unitId })
  return (
    <AskStarFrame state="lit" data-message-role="lit" data-lit-unit={moment.unitId} aria-label={t('ask.lit.label')} className="self-center">
      <p className="m-0 text-[15px] font-semibold text-ink">{t('ask.lit.title', { name: moment.name })}</p>
      <p className="m-0 text-[13px] text-caption">{t('ask.lit.body')}</p>
      <Link to={to} className={ASK_STAR_LINK_CLASS}>
        {t('ask.lit.link')}
      </Link>
    </AskStarFrame>
  )
}

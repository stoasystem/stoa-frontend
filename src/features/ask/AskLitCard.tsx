import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { StarGlyph } from '@/features/starmap/components/StarGlyph'
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
    <section
      data-message-role="lit"
      data-lit-unit={moment.unitId}
      aria-label={t('ask.lit.label')}
      className="flex w-full items-center gap-3 self-center border border-solid border-[color:var(--card-border)] bg-surface"
      style={{ padding: '12px 14px', borderRadius: 16 }}
    >
      {/* A piece of the night sky: the star's tokens live there. */}
      <span data-surface="sky" aria-hidden="true" className="inline-flex size-11 shrink-0 items-center justify-center rounded-[12px]" style={{ background: 'var(--sky)' }}>
        <StarGlyph state="lit" size={34} />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="m-0 text-[15px] font-semibold text-ink">{t('ask.lit.title', { name: moment.name })}</p>
        <p className="m-0 text-[13px] text-caption">{t('ask.lit.body')}</p>
        <Link to={to} className="text-[13px] font-semibold text-accent hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          {t('ask.lit.link')}
        </Link>
      </div>
    </section>
  )
}

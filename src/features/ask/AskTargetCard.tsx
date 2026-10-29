import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/base'
import { StarGlyph } from '@/features/starmap/components/StarGlyph'
import { subjectOfNebula } from '@/features/starmap/model/starMap'
import { DEFAULT_SUBJECT_ID, DEMO_STAR_COUNT, fixtureSizeFrom, useStarMap } from '@/features/starmap/useStarMap'
import { pathForTarget } from '@/features/starmap/view/layers'
import { useAskStore } from '@/store/askStore'

/*
 * Finding a star (#487, CONTEXT.md「找星」): an answer that recognised the star
 * the student wants to go to carries it (`targetUnit`, stoa-backend#124), and
 * this card sits under that answer. Pressed, Ask closes and the map flies to
 * the star and opens its card -- the star's own route, so a star of another
 * subject, in a dimmed galaxy or already lit, is reached the same way.
 *
 * The star is looked up in the student's whole sky. One the sky does not
 * hold (not read yet, or not drawn as a star) gets no card: a card with
 * nowhere to fly would be a dead button.
 */
export function AskTargetCard({ unitId }: { unitId: string }) {
  const { t } = useTranslation('chat')
  const navigate = useNavigate()
  const location = useLocation()
  // The sky the map route draws: every galaxy, whichever one is in focus.
  const map = useStarMap(DEFAULT_SUBJECT_ID, fixtureSizeFrom(new URLSearchParams(location.search), DEMO_STAR_COUNT))
  const star = map.stars.find((candidate) => candidate.unitId === unitId)
  if (!star) return null
  const subjectId = subjectOfNebula(map, star.nebulaId)
  const where = [
    map.subjects.find((subject) => subject.subjectId === subjectId)?.name,
    map.nebulae.find((nebula) => nebula.topicId === star.nebulaId)?.name,
  ].filter(Boolean).join(' · ')

  const show = () => {
    useAskStore.getState().close()
    void navigate({
      pathname: pathForTarget(subjectId, { layer: 'star', nebulaId: star.nebulaId, unitId: star.unitId }),
      search: location.search,
    })
  }

  return (
    <section
      data-ask-target={star.unitId}
      aria-label={t('ask.target.label')}
      className="flex w-full items-center gap-3 border border-solid border-[color:var(--card-border)] bg-surface"
      style={{ padding: '12px 14px', borderRadius: 16 }}
    >
      {/* A piece of the night sky: the star's tokens live there. */}
      <span data-surface="sky" aria-hidden="true" className="inline-flex size-11 shrink-0 items-center justify-center rounded-[12px]" style={{ background: 'var(--sky)' }}>
        <StarGlyph state={star.state} progress={star.progress} size={34} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
        <p className="m-0 text-[15px] font-semibold text-ink">{star.name}</p>
        {where && <p className="m-0 text-[13px] text-caption">{where}</p>}
        <Button variant="plain" size="small" onClick={show}>
          {t('ask.target.show')}
        </Button>
      </div>
    </section>
  )
}

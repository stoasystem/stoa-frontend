/*
 * One knowledge point's questions that have come back round.
 *
 * Its star says "review N"; this is where those N are. The server selects by
 * knowledge point before it cuts a page (stoa-backend#70), so the count on
 * the star and the number that open here are the same number — which they
 * were not when the page took whatever was due first across the whole sky.
 */
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { ReviewSession } from '@/components/practice/ReviewSession'
import { BackButton } from '@/components/common/BackButton'
import { AppLayout } from '@/layouts/AppLayout'

export function ReviewPage() {
  const { t } = useTranslation('practice')
  const { unitId } = useParams<{ unitId: string }>()

  // Inside the app shell like every other student page: it stood alone, with
  // no bar, no bell and no account menu (app.stoaedu.ch, 2026-10-10).
  return (
    <AppLayout>
      <PageContainer className="space-y-6">
        <BackButton label={t('review.backToMap')} to="/" />
        <PageHeader eyebrow={t('review.eyebrow')} title={t('review.title')} description={t('review.description')} />
        <ReviewSession unitId={unitId} />
      </PageContainer>
    </AppLayout>
  )
}

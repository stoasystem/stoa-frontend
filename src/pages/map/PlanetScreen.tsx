import { useParams } from 'react-router-dom'
import { AskHost } from '@/features/ask/AskHost'
import type { AskRoute } from '@/features/ask/useAskController'
import { StarMapRoute } from '@/features/starmap/StarMapRoute'
import { AppLayout } from '@/layouts/AppLayout'

/** The star map fills Ask's sky surface; the panel stays outside its token scope. */
export function PlanetScreen({ ask }: { ask?: AskRoute }) {
  const { subjectId } = useParams()

  return (
    <AppLayout bleed>
      <AskHost route={ask} subjectId={subjectId}>
        <StarMapRoute />
      </AskHost>
    </AppLayout>
  )
}

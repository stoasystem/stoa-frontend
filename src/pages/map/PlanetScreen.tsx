import { useParams } from 'react-router-dom'
import { AskHost } from '@/features/ask/AskHost'
import type { AskRoute } from '@/features/ask/useAskController'
import { AboutYouGate } from '@/features/starmap/onboarding/AboutYouGate'
import { StarMapRoute } from '@/features/starmap/StarMapRoute'
import { AppLayout } from '@/layouts/AppLayout'

/**
 * The star map fills Ask's sky surface; the panel stays outside its token scope.
 * A student who has not said their year group is asked first, on the map's
 * own routes ("About you", #591); not where Ask was opened by its address.
 */
export function PlanetScreen({ ask }: { ask?: AskRoute }) {
  const { subjectId } = useParams()

  return (
    <AppLayout bleed surface="sky">
      <AskHost route={ask} subjectId={subjectId}>
        <AboutYouGate enabled={!ask}>
          <StarMapRoute />
        </AboutYouGate>
      </AskHost>
    </AppLayout>
  )
}

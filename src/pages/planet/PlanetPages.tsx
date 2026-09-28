/* The planet, layer by layer (#13 point 1; #47). Every planet route shows the
 * same planet and the path picks the zoom layer. The manifest still passes
 * each page a `titleKey`; the planet names itself instead (the subject, the
 * region, or the point). */
import { PlanetRoute } from '@/features/planet/PlanetRoute'
import { AppLayout } from '@/layouts/AppLayout'

function PlanetScreen() {
  return (
    <AppLayout surface="sky" bleed>
      <PlanetRoute />
    </AppLayout>
  )
}

/** `/`: the default subject's planet (last opened, else the first with content). */
export function PlanetHomePage() {
  return <PlanetScreen />
}

/** `/planet/:subjectId`: a subject's planet. */
export function PlanetSubjectPage() {
  return <PlanetScreen />
}

/** `/planet/:subjectId/:topicId`: a region. */
export function PlanetTopicPage() {
  return <PlanetScreen />
}

/** `/planet/:subjectId/:topicId/:unitId`: a knowledge point. */
export function PlanetUnitPage() {
  return <PlanetScreen />
}

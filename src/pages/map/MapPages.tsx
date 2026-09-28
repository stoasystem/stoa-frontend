/* The star map, layer by layer (#13 point 1; #47, #72). Every map route
 * shows the same map and the path picks the layer. The manifest still passes
 * each page a `titleKey`; the map names itself instead (the subject, the
 * nebula, or the star). */
import { StarMapRoute } from '@/features/starmap/StarMapRoute'
import { AppLayout } from '@/layouts/AppLayout'

function MapScreen() {
  return (
    <AppLayout surface="sky" bleed>
      <StarMapRoute />
    </AppLayout>
  )
}

/** `/`: the default subject's star map (last opened, else the first with content). */
export function MapHomePage() {
  return <MapScreen />
}

/** `/map/:subjectId`: a subject's star map. */
export function MapSubjectPage() {
  return <MapScreen />
}

/** `/map/:subjectId/:topicId`: a nebula. */
export function MapNebulaPage() {
  return <MapScreen />
}

/** `/map/:subjectId/:topicId/:unitId`: a star. */
export function MapStarPage() {
  return <MapScreen />
}

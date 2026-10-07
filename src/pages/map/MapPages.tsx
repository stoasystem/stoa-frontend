/* The star map (#13 point 1; #47, #72). Every map route shows the same map
 * and the path picks what is chosen -- the galaxy, a nebula, a star. The
 * manifest still passes each page a `titleKey`; the map names itself instead
 * (the subject, the nebula, or the star). */
import { PlanetScreen } from '@/pages/map/PlanetScreen'

function MapScreen() {
  return <PlanetScreen />
}

/** `/`: the default subject's star map (last opened, else the first with content). */
export function MapHomePage() {
  return <MapScreen />
}

/**
 * `/map/:subjectId`, `/map/:subjectId/:topicId` and
 * `/map/:subjectId/:topicId/:unitId`: one page for all three, so choosing a
 * nebula or a star keeps the map mounted and the camera flies there (#134);
 * a page per route made React swap the whole map on every choice.
 */
export function MapPage() {
  return <MapScreen />
}

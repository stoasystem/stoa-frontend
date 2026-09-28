/* The planet, layer by layer (#13 point 1), each with Ask docked below it
 * (#49). The planet is a placeholder until the renderer lands (#47); the
 * route manifest supplies each one's title key. */
import type { RoutePlaceholderProps } from '@/components/common/RoutePlaceholder'
import { PlanetScreen } from '@/pages/planet/PlanetScreen'

/** `/`: the default subject's planet (last opened, else the first with content). */
export function PlanetHomePage(props: RoutePlaceholderProps) {
  return <PlanetScreen {...props} />
}

/** `/planet/:subjectId`: a subject's planet. */
export function PlanetSubjectPage(props: RoutePlaceholderProps) {
  return <PlanetScreen {...props} />
}

/** `/planet/:subjectId/:topicId`: a region. */
export function PlanetTopicPage(props: RoutePlaceholderProps) {
  return <PlanetScreen {...props} />
}

/** `/planet/:subjectId/:topicId/:unitId`: a knowledge point. */
export function PlanetUnitPage(props: RoutePlaceholderProps) {
  return <PlanetScreen {...props} />
}

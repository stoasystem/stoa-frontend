/* The planet, layer by layer (#13 point 1). Placeholders until the planet
 * slices fill them; the route manifest supplies each one's title key. */
import { RoutePlaceholder, type RoutePlaceholderProps } from '@/components/common/RoutePlaceholder'

/** `/`: the default subject's planet (last opened, else the first with content). */
export function PlanetHomePage(props: RoutePlaceholderProps) {
  return <RoutePlaceholder {...props} />
}

/** `/planet/:subjectId`: a subject's planet. */
export function PlanetSubjectPage(props: RoutePlaceholderProps) {
  return <RoutePlaceholder {...props} />
}

/** `/planet/:subjectId/:topicId`: a region. */
export function PlanetTopicPage(props: RoutePlaceholderProps) {
  return <RoutePlaceholder {...props} />
}

/** `/planet/:subjectId/:topicId/:unitId`: a knowledge point. */
export function PlanetUnitPage(props: RoutePlaceholderProps) {
  return <RoutePlaceholder {...props} />
}

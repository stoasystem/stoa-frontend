/* Ask opened directly (#12, #13 point 1; #49): `/ask` and `/ask/:conversationId`,
 * from a deep link or a notification. On a desktop it is the home planet with
 * the Ask panel open beside it; on a phone, a full-screen sheet. Closing it goes
 * to `/`. */
import { useParams } from 'react-router-dom'
import { PlanetScreen } from '@/pages/planet/PlanetScreen'

/** `/ask` and `/ask/:conversationId`. The conversation is the path's id, never a query's. */
export function AskPage() {
  const { conversationId } = useParams()

  return <PlanetScreen titleKey="studentRoutes.home.title" ask={{ conversationId: conversationId ?? null }} />
}

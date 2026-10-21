/*
 * A star's "Review N" names the star it was opened from (#411), so the review
 * page's "Back to map" returns to that star, with the map's query, and not to
 * the whole sky. Router state: only the app writes it, and anything in it
 * that is not a path on the map is no star.
 */
export type ReviewReturnState = { star: string }

export function reviewReturnPath(state: unknown): string | null {
  const star = typeof state === 'object' && state !== null ? (state as { star?: unknown }).star : undefined
  return typeof star === 'string' && star.startsWith('/map/') ? star : null
}

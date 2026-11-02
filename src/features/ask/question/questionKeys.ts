/**
 * The idempotency keys a question asked from the list goes out under (#562).
 * The backend names them, so they are spelled here and nowhere else.
 */

/**
 * The first question `POST /conversations` carries itself as `initialMessage`:
 * its answer comes on the command the backend keys `initial-<id>`. Asking a
 * refused first question again goes into its conversation under the same key
 * (#327 K4).
 */
export const initialQuestionKey = (conversationId: string) => `initial-${conversationId}`

/**
 * A question held back from `POST /conversations` -- one with a quote or a
 * file, which that request cannot carry -- sent into the new conversation as a
 * message of its own (#263).
 */
export const heldQuestionKey = (conversationId: string) => `held-${conversationId}`

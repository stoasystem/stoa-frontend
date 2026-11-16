/**
 * What a seat in the virtual classroom (#696, stoa-backend#467) is: the
 * shared whiteboard's address, with its token in the query string, and the
 * voice room with this person's meeting token. Both run out at `expiresAt`.
 */
export type ClassroomPass = {
  whiteboardUrl: string
  voice: {
    roomUrl: string
    token: string
  }
  expiresAt: string
}

/** The code the backend refuses with while the classroom is not configured. */
export const CLASSROOM_UNAVAILABLE = 'classroom_unavailable'

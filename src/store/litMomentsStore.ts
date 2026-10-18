/*
 * The lighting moments celebrated in this session (#51), for Ask: each one
 * becomes a card in the conversation ("progress flows back into the
 * conversation").
 *
 * Kept in memory only, per account. Whether to celebrate is never decided
 * here -- that is the server's acknowledgement (`lighting/lightingEvents.ts`)
 * -- so a reload forgets the cards but never replays a celebration. Keeping
 * the card in the conversation itself needs the backend to store it; that is
 * open (#3).
 *
 * A card belongs to the conversations it is about, not to every one (#267):
 * only a conversation about the point's subject, and of those only the one
 * open in Ask when the point lit (the bridge's "progress flows back into the
 * conversation" -- the one the student was working in) or one started after
 * it lit. Last week's conversations, and other subjects', show no card.
 */
import { create } from 'zustand'
import { normalSubjectId } from '@/lib/subjects'

export type LitMoment = {
  unitId: string
  name: string
  subjectId: string
  nebulaId: string
  /** When the point was lit, ISO 8601: where the card sits among the messages. */
  litAt: string
  /** The conversation open in Ask (on the planet) when it was shown, if any. */
  conversationId: string | null
}

type LitMomentsState = {
  byOwner: Record<string, LitMoment[]>
  add: (ownerId: string, moment: LitMoment) => void
}

export const useLitMomentsStore = create<LitMomentsState>((set) => ({
  byOwner: {},
  add: (ownerId, moment) =>
    set((state) => {
      const list = state.byOwner[ownerId] ?? []
      if (list.some((known) => known.unitId === moment.unitId)) return state
      return { byOwner: { ...state.byOwner, [ownerId]: [...list, moment] } }
    }),
}))

const NONE: LitMoment[] = []

export function useLitMoments(ownerId: string | undefined): LitMoment[] {
  return useLitMomentsStore((state) => (ownerId ? state.byOwner[ownerId] : undefined) ?? NONE)
}

/** The conversation a thread shows: what decides which lit moments are its. */
export type LitMomentThread = {
  id: string
  subject: string | undefined
  /** When its first message was sent, ISO 8601; `undefined` while it has none. */
  startedAt: string | undefined
}

/**
 * The subject an id names (`math`, `subj-math`, `Mathematik`, `Physik`...),
 * through the app's one alias table; one it does not know is kept as sent.
 */
function subjectOf(id: string | undefined) {
  if (!id) return undefined
  return normalSubjectId(id) ?? id.trim().toLowerCase()
}

/** The moments whose card this conversation shows (#267). */
export function litMomentsFor(moments: readonly LitMoment[], thread: LitMomentThread): LitMoment[] {
  const subject = subjectOf(thread.subject)
  if (!subject) return NONE
  const started = thread.startedAt === undefined ? Number.NaN : Date.parse(thread.startedAt)
  return moments.filter(
    (moment) =>
      subjectOf(moment.subjectId) === subject &&
      (moment.conversationId === thread.id || started > Date.parse(moment.litAt)),
  )
}

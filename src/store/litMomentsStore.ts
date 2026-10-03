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
 */
import { create } from 'zustand'

export type LitMoment = {
  unitId: string
  name: string
  subjectId: string
  nebulaId: string
  /** When the point was lit, ISO 8601: where the card sits among the messages. */
  litAt: string
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

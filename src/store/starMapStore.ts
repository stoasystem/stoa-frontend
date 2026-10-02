import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/** Demo browsing preference per account; no learning state is stored here. */
export const useStarMapStore = create(persist<{
  lastSubjects: Record<string, string>
  remember: (ownerId: string, subjectId: string) => void
}>((set) => ({
  lastSubjects: {},
  remember: (ownerId, subjectId) => set((state) => ({ lastSubjects: { ...state.lastSubjects, [ownerId]: subjectId } })),
}), {
  name: 'stoa_starmap_demo_subjects',
  storage: createJSONStorage(() => localStorage),
}))

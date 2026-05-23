import { create } from 'zustand'

interface QuestionState {
  pendingImageKey: string | null
  setPendingImageKey: (key: string | null) => void
}

export const useQuestionStore = create<QuestionState>((set) => ({
  pendingImageKey: null,
  setPendingImageKey: (key) => set({ pendingImageKey: key }),
}))

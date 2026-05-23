import { create } from 'zustand'

interface User {
  userId: string
  email: string
  role: 'student' | 'parent' | 'teacher' | 'admin'
  subscriptionTier: 'free' | 'standard' | 'premium'
}

interface AuthState {
  user: User | null
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}))

import { create } from 'zustand'
import type { User, UserRole } from '@/types/user'

export type CurrentUser = User
export type { UserRole }

type AuthState = {
  user: CurrentUser | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: CurrentUser, token: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  setAuth: (user, token) => {
    localStorage.setItem('stoa_access_token', token)
    set({ user, token, isAuthenticated: true })
  },
  clearAuth: () => {
    localStorage.removeItem('stoa_access_token')
    set({ user: null, token: null, isAuthenticated: false })
  },
}))

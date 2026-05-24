import { create } from 'zustand'
import type { User, UserRole } from '@/types/user'

export type CurrentUser = User
export type { UserRole }

export const TOKEN_KEY = 'stoa_access_token'

type AuthState = {
  user: CurrentUser | null
  accessToken: string | null
  isAuthenticated: boolean
  setAuth: (user: CurrentUser, accessToken: string) => void
  setUser: (user: CurrentUser) => void
  clearAuth: () => void
  hydrateFromStorage: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  setAuth: (user, accessToken) => {
    localStorage.setItem(TOKEN_KEY, accessToken)
    set({ user, accessToken, isAuthenticated: true })
  },
  setUser: (user) => {
    set({ user, isAuthenticated: true })
  },
  clearAuth: () => {
    localStorage.removeItem(TOKEN_KEY)
    set({ user: null, accessToken: null, isAuthenticated: false })
  },
  hydrateFromStorage: () => {
    const accessToken = localStorage.getItem(TOKEN_KEY)
    if (accessToken) {
      set({ accessToken, isAuthenticated: true })
    }
  },
}))

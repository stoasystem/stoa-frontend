import { httpClient } from '@/services/api/httpClient'
import type { AuthResponse, User, UserRole } from '@/types/user'

export type LoginRequest = {
  email: string
  password: string
}

export type RegisterRequest = {
  name: string
  email: string
  password: string
  role: UserRole
}

export async function login(payload: LoginRequest) {
  const response = await httpClient.post<AuthResponse>('/auth/login', payload)
  return response.data
}

export async function register(payload: RegisterRequest) {
  const response = await httpClient.post<AuthResponse>('/auth/register', payload)
  return response.data
}

export async function getCurrentUser() {
  const response = await httpClient.get<User>('/auth/me')
  return response.data
}

import { httpClient } from '@/services/api/httpClient'
import type { AuthResponse, User, UserRole } from '@/types/user'
import { TOKEN_KEY } from '@/store/authStore'
import { allowDemoFallback } from '@/lib/env'

export type LoginRequest = {
  email: string
  password: string
}

export type RegisterRequest = {
  name: string
  email: string
  password: string
  role: UserRole
  acceptedTerms?: true
  termsVersion?: string
  acceptedAt?: string
  referralCode?: string
  utm?: {
    source?: string
    medium?: string
    campaign?: string
    content?: string
  } | null
}

export async function login(payload: LoginRequest) {
  try {
    const response = await httpClient.post<AuthResponse>('/auth/login', payload)
    return response.data
  } catch (error) {
    if (!allowDemoFallback) throw error
    return createDemoAuthResponse(payload.email)
  }
}

export async function register(payload: RegisterRequest) {
  try {
    const response = await httpClient.post<AuthResponse>('/auth/register', payload)
    return response.data
  } catch (error) {
    if (!allowDemoFallback) throw error
    return createDemoAuthResponse(payload.email, payload.role, payload.name)
  }
}

export async function getCurrentUser() {
  try {
    const response = await httpClient.get<User>('/auth/me')
    return response.data
  } catch (error) {
    if (!allowDemoFallback) throw error
    const token = localStorage.getItem(TOKEN_KEY)
    const role = token?.startsWith('demo:') ? token.replace('demo:', '') as UserRole : 'student'
    return createDemoUser(`${role}@test.com`, role)
  }
}

function inferRole(email: string): UserRole {
  if (email.includes('organization')) return 'organization_admin'
  if (email.includes('school.teacher')) return 'school_teacher'
  if (email.includes('school.viewer')) return 'school_viewer'
  if (email.includes('parent')) return 'parent'
  if (email.includes('tutor') || email.includes('teacher')) return 'tutor'
  if (email.includes('admin')) return 'admin'
  return 'student'
}

function createDemoUser(email: string, role = inferRole(email), name?: string): User {
  return {
    id: `demo-${role}`,
    name: name || `Demo ${role}`,
    email,
    role,
    subscriptionStatus: 'trial',
    plan: 'free_trial',
  }
}

function createDemoAuthResponse(email: string, role = inferRole(email), name?: string): AuthResponse {
  return {
    accessToken: `demo:${role}`,
    user: createDemoUser(email, role, name),
  }
}

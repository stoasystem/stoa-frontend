import { ApiError, httpClient } from '@/services/api/httpClient'
import { LANGUAGE_STORAGE_KEY, isSupportedLanguage, type SupportedLanguage } from '@/i18n/languages'
import type { AuthResponse, EmailVerificationResponse, LocalePreferenceResponse, User, UserRole } from '@/types/user'
import type { RegisterPayload } from '@/types/onboarding'
import { TOKEN_KEY } from '@/store/authStore'
import { allowDemoFallback } from '@/lib/env'

export type LoginRequest = {
  email: string
  password: string
}

export type EmailVerificationRequest = {
  email: string
  role?: UserRole
}

export type EmailVerificationConfirmRequest = EmailVerificationRequest & {
  confirmationCode: string
}

export type RegisterRequest = RegisterPayload | {
  name: string
  email: string
  password: string
  role: UserRole
  preferredLanguage?: string
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
    if (isEmailVerificationRequiredError(error)) throw error
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
    return createDemoAuthResponse(payload.email, payload.role, payload.name, payload.preferredLanguage)
  }
}

export async function resendEmailVerification(payload: EmailVerificationRequest) {
  const response = await httpClient.post<EmailVerificationResponse>('/auth/email-verification/resend', payload)
  return response.data
}

export async function confirmEmailVerification(payload: EmailVerificationConfirmRequest) {
  const response = await httpClient.post<EmailVerificationResponse>('/auth/email-verification/confirm', payload)
  return response.data
}

export function isEmailVerificationRequiredError(error: unknown) {
  return error instanceof ApiError && error.status === 403 && error.code === 'email_verification_required'
}

export function isVerificationRateLimitedError(error: unknown) {
  return error instanceof ApiError && error.status === 429
}

export function isUnauthorizedError(error: unknown) {
  return error instanceof ApiError && error.status === 401
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

export async function updateLocalePreference(preferredLocale: SupportedLanguage) {
  try {
    const response = await httpClient.patch<LocalePreferenceResponse>('/auth/me/preferences/locale', {
      preferredLocale,
    })
    return response.data
  } catch (error) {
    if (!allowDemoFallback) throw error
    return {
      preferredLocale,
      effectiveLocale: preferredLocale,
      supportedLocales: ['en', 'de'],
      updatedAt: new Date().toISOString(),
    } satisfies LocalePreferenceResponse
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

function createDemoUser(email: string, role = inferRole(email), name?: string, preferredLanguage?: string): User {
  const storedLocale = typeof window === 'undefined' ? null : localStorage.getItem(LANGUAGE_STORAGE_KEY)
  const effectiveLocale = isSupportedLanguage(preferredLanguage)
    ? preferredLanguage
    : isSupportedLanguage(storedLocale)
      ? storedLocale
      : 'en'

  return {
    id: `demo-${role}`,
    name: name || `Demo ${role}`,
    email,
    role,
    preferredLanguage: effectiveLocale,
    preferredLocale: effectiveLocale,
    effectiveLocale,
    supportedLocales: ['en', 'de'],
    subscriptionStatus: 'trial',
    plan: 'free_trial',
  }
}

function createDemoAuthResponse(email: string, role = inferRole(email), name?: string, preferredLanguage?: string): AuthResponse {
  const response: AuthResponse = {
    accessToken: `demo:${role}`,
    user: createDemoUser(email, role, name, preferredLanguage),
  }

  if (role === 'student') {
    response.onboardingStatus = 'completed'
    response.parentLinked = true
  }

  if (role === 'tutor') {
    response.onboardingStatus = 'pending_review'
    response.verificationStatus = 'pending_review'
  }

  return response
}

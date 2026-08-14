export type UserRole =
  | 'student'
  | 'parent'
  | 'teacher'
  | 'admin'
  | 'organization_admin'
  | 'school_teacher'
  | 'school_viewer'

export type SubscriptionStatus = 'trial' | 'active' | 'inactive' | 'expired'

export type SubscriptionPlan =
  | 'free_trial'
  | 'student'
  | 'teacher_supported'
  | 'family'

export type BillingStatus =
  | 'not_configured'
  | 'pilot_access'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'

export type UserSubscription = {
  plan: SubscriptionPlan
  status: BillingStatus
  currentPeriodEndsAt?: string
}

export type User = {
  id: string
  name: string
  email: string
  role: UserRole
  preferredLanguage?: string
  preferredLocale?: string
  effectiveLocale?: string
  supportedLocales?: string[]
  subscriptionStatus?: SubscriptionStatus
  plan?: SubscriptionPlan
  subscription?: UserSubscription
  verificationStatus?: 'approved' | 'pending_review'
  emailVerificationStatus?: EmailVerificationStatus
  emailVerificationRequired?: boolean
  accountActivationStatus?: AccountActivationStatus
}

export type EmailVerificationStatus =
  | 'registered'
  | 'unverified'
  | 'pending_verification'
  | 'verified'
  | 'expired_verification'
  | 'resend_limited'
  | 'blocked'
  | 'admin_marked_verified'

export type AccountActivationStatus =
  | 'active'
  | 'pending_email_verification'
  | 'limited_onboarding'
  | 'blocked'

export type LocalePreferenceResponse = {
  preferredLocale: string
  effectiveLocale: string
  supportedLocales: string[]
  updatedAt?: string | null
}

export type AuthResponse = {
  accessToken: string
  user: User
  onboardingStatus?: 'completed' | 'pending_review' | 'email_verification_required'
  parentLinked?: boolean
  verificationStatus?: 'pending_review'
  emailVerificationStatus?: EmailVerificationStatus
  emailVerificationRequired?: boolean
  accountActivationStatus?: AccountActivationStatus
}

export type EmailVerificationResponse = {
  status: 'accepted' | 'sent' | 'already_requested' | 'already_verified' | 'confirmed'
  emailVerificationStatus: EmailVerificationStatus
  emailVerificationRequired: boolean
  accountActivationStatus: AccountActivationStatus
  resendAllowed: boolean
  delivery?: Record<string, unknown> | null
}

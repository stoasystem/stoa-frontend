export type UserRole =
  | 'student'
  | 'parent'
  | 'tutor'
  | 'admin'
  | 'organization_admin'
  | 'school_teacher'
  | 'school_viewer'

export type SubscriptionStatus = 'trial' | 'active' | 'inactive' | 'expired'

export type SubscriptionPlan =
  | 'free_trial'
  | 'student'
  | 'family'
  | 'tutor_supported'

export type LegacySubscriptionPlan = 'pilot' | 'school' | 'enterprise'

export type BillingStatus =
  | 'not_configured'
  | 'pilot_access'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'

export type UserSubscription = {
  plan: SubscriptionPlan | LegacySubscriptionPlan
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
}

export type LocalePreferenceResponse = {
  preferredLocale: string
  effectiveLocale: string
  supportedLocales: string[]
  updatedAt?: string | null
}

export type AuthResponse = {
  accessToken: string
  user: User
  onboardingStatus?: 'completed' | 'pending_review'
  parentLinked?: boolean
  verificationStatus?: 'pending_review'
}

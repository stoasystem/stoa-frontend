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
  subscriptionStatus?: SubscriptionStatus
  plan?: SubscriptionPlan
  subscription?: UserSubscription
}

export type AuthResponse = {
  accessToken: string
  user: User
}

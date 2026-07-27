import type { SubscriptionPlan, SubscriptionStatus } from '@/types/user'

export type { SubscriptionPlan, SubscriptionStatus }

/** Plans that can actually be purchased (excludes free_trial). */
export type PurchasablePlan = 'student' | 'teacher_supported' | 'family'

export type BillingPlan = {
  id: SubscriptionPlan
  name: string
  priceMonthly: number
  currency: string
  recommended?: boolean
  audience: string
  cta: string
  features: string[]
}

export type Subscription = {
  status: SubscriptionStatus
  plan: SubscriptionPlan
  currentPeriodEnd?: string
}

export type BillingUsage = {
  periodStart: string
  periodEnd: string
  aiMessagesUsed: number
  aiMessagesLimit: number
  fileUploadsUsed: number
  fileUploadsLimit: number
  teacherHelpUsed: number
  teacherHelpLimit: number
}

export type FeatureAccess = {
  canUseChat: boolean
  canUploadFiles: boolean
  canRequestTeacherHelp: boolean
  canViewParentReports: boolean
  reason?: Record<string, string>
}

/** Outcome states returned by the backend checkout status API. */
export type CheckoutOutcome = 'confirming' | 'active' | 'not_completed' | 'support_needed'

export type CheckoutCommandResponse = {
  checkoutRef: string
  commandState: string
  checkoutSessionId: string
  checkoutUrl: string
  safeActions: string[]
  targetPlan: PurchasablePlan
  beneficiaries: string[]
}

export type CheckoutStatusResponse = {
  checkoutRef: string
  outcome: CheckoutOutcome
  newCheckoutAllowed: boolean
  safeActions: string[]
  targetPlan: PurchasablePlan
  beneficiaries: string[]
  effectivePlan: PurchasablePlan | null
  lastRecheckedAt: string
}

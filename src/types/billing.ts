import type { SubscriptionPlan, SubscriptionStatus } from '@/types/user'

export type { SubscriptionPlan, SubscriptionStatus }

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

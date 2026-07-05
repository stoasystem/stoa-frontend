import type { AccountActivationStatus, EmailVerificationStatus } from './user'

export type AccountOperationsSupportState = {
  state: 'ready' | 'attention' | 'blocked' | string
  blockers: string[]
  warnings: string[]
}

export type AccountOperationsVerification = {
  emailVerificationStatus?: EmailVerificationStatus | string | null
  emailVerificationRequired?: boolean
  accountActivationStatus?: AccountActivationStatus | string | null
  emailVerificationPolicy?: string | null
  emailVerifiedAt?: string | null
  emailVerificationRequestedAt?: string | null
  emailVerificationLastResendAt?: string | null
  emailVerificationResendCount?: number
  resendAllowed?: boolean
  supportRecoveryState?: string | null
  supportAction?: string | null
}

export type AccountOperationsProfile = {
  userId: string
  email: string
  name: string
  role: string
  verification?: AccountOperationsVerification
}

export type AccountOperationsBilling = {
  status?: string | null
  mode?: string | null
  provider?: string | null
  subscriptionTier?: string | null
  requestedTier?: string | null
  paymentMethodType?: string | null
  currentPeriodStart?: string | null
  currentPeriodEnd?: string | null
  cancelAtPeriodEnd?: boolean
  lastProviderEventType?: string | null
  lastProviderEventAt?: string | null
  manualOverrideAt?: string | null
  manualOverrideSource?: string | null
  readiness?: Record<string, unknown>
  twint?: Record<string, unknown>
  dunning?: Record<string, unknown>
  refund?: Record<string, unknown>
  accountingHandoff?: Record<string, unknown>
  supportEvidence?: Record<string, unknown>
}

export type AccountOperationsUsage = {
  studentId: string
  parentId?: string | null
  quotaPeriod: string
  action: string
  consumed: number
  limit: number
  remaining: number
  effectivePlan?: string | null
  entitlementSource?: string | null
  billingState?: string | null
  reconciliation?: Record<string, unknown>
  supportAction?: string | null
  explanation?: string | null
  partial?: boolean
  stale?: boolean
  unreconciled?: boolean
}

export type AccountOperationsChild = {
  studentId: string
  profile: AccountOperationsProfile
  binding: {
    parentId?: string | null
    studentId?: string | null
    status?: string | null
    relationship?: string | null
    source?: string | null
    updatedAt?: string | null
  }
  entitlement?: {
    effectivePlan?: string | null
    source?: string | null
    billingState?: string | null
    limits?: {
      dailyAiQuestionLimit?: number
      [key: string]: unknown
    }
    [key: string]: unknown
  }
  usage?: AccountOperationsUsage
  verification?: AccountOperationsVerification
}

export type ParentAccountOperations = {
  parentId: string
  parent: AccountOperationsProfile
  billing: AccountOperationsBilling
  children: AccountOperationsChild[]
  usage: AccountOperationsUsage[]
  supportState: AccountOperationsSupportState
}

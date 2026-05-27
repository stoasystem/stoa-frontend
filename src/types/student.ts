export type StudentProfile = {
  id: string
  userId: string
  name: string
  email: string
  phone?: string
  dateOfBirth?: string
  minor?: boolean
  grade: string
  primarySubjects: string[]
  schoolSystem?: string
  guardian?: {
    name: string
    relationship: string
    email: string
    phone?: string
    accountStatus: 'linked' | 'invited' | 'not_linked'
  }
  billing?: {
    planName: string
    status: 'trial' | 'active' | 'past_due' | 'inactive'
    payerName: string
    payerRole: 'parent' | 'student' | 'organization'
    billingEmail: string
    paymentMethod: string
    nextBillingDate?: string
  }
  createdAt?: string
  updatedAt?: string
}

export type LearningHistoryItem = {
  id: string
  subject: string
  title: string
  summary: string
  createdAt: string
}

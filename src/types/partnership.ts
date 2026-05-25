import type { OrganizationType } from '@/types/organization'

export type PartnershipInterestPayload = {
  organizationName: string
  organizationType: Extract<OrganizationType, 'school' | 'tutoring_center'>
  studentCount: number
  subjects: string[]
  contactName: string
  contactEmail: string
  message?: string
}

export type PartnershipInterestResponse = {
  ok: true
  interestId: string
}

import {
  mockOrganizations,
  mockOrganizationReports,
  mockOrganizationStudents,
  mockOrganizationSummaries,
  mockOrganizationTutors,
} from '@/data/phase12MockData'
import { httpClient } from '@/services/api/httpClient'
import { withDemoFallback } from '@/services/demo/demoFallback'
import type {
  Organization,
  OrganizationReportOverview,
  OrganizationStudent,
  OrganizationSummary,
  OrganizationTutor,
} from '@/types/organization'

export async function getOrganizations() {
  return withDemoFallback(async () => {
    const response = await httpClient.get<{ items: Organization[] }>('/organizations')
    return response.data
  }, { items: mockOrganizations })
}

export async function getOrganizationSummary(organizationId: string) {
  return withDemoFallback(async () => {
    const response = await httpClient.get<OrganizationSummary>(`/organizations/${organizationId}/summary`)
    return response.data
  }, () => mockOrganizationSummaries[organizationId] ?? mockOrganizationSummaries[mockOrganizations[0].id])
}

export async function getOrganizationStudents(organizationId: string) {
  return withDemoFallback(async () => {
    const response = await httpClient.get<{ items: OrganizationStudent[] }>(`/organizations/${organizationId}/students`)
    return response.data
  }, () => ({ items: mockOrganizationStudents[organizationId] ?? mockOrganizationStudents[mockOrganizations[0].id] }))
}

export async function getOrganizationTutors(organizationId: string) {
  return withDemoFallback(async () => {
    const response = await httpClient.get<{ items: OrganizationTutor[] }>(`/organizations/${organizationId}/tutors`)
    return response.data
  }, () => ({ items: mockOrganizationTutors[organizationId] ?? mockOrganizationTutors[mockOrganizations[0].id] }))
}

export async function getOrganizationReports(organizationId: string) {
  return withDemoFallback(async () => {
    const response = await httpClient.get<OrganizationReportOverview>(`/organizations/${organizationId}/reports`)
    return response.data
  }, mockOrganizationReports)
}

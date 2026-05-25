import { httpClient } from '@/services/api/httpClient'
import type { UserRole } from '@/types/user'

export type AdminUsageSummary = {
  activeUsers: number
  roleCounts: Record<UserRole, number>
  messages: number
  helpRequests: number
  uploads: number
  feedback: number
  billingInterestItems?: number
  generatedAt?: string
}

export type AdminFeedbackStatus = 'new' | 'reviewed' | 'resolved'

export type AdminFeedbackItem = {
  id: string
  type: string
  message: string
  page: string
  userRole?: UserRole
  userEmail?: string
  status?: AdminFeedbackStatus
  createdAt: string
}

export type AdminFeedbackListResponse = {
  items: AdminFeedbackItem[]
}

export type AdminHelpRequestItem = {
  requestId: string
  studentName: string
  subject: string
  status: string
  priority?: 'low' | 'medium' | 'high'
  createdAt: string
}

export type AdminUserItem = {
  id: string
  name: string
  email: string
  role: UserRole
  status?: string
}

export type AdminSupportRequestItem = {
  id: string
  subject: string
  status: string
  createdAt: string
}

export type AdminBillingInterestItem = {
  id: string
  email: string
  plan: string
  source: string
  createdAt: string
}

export type AdminSystemStatus = {
  api: string
  analytics: string
  monitoring: string
  generatedAt?: string
}

export async function getAdminUsageSummary() {
  const response = await httpClient.get<AdminUsageSummary>('/admin/usage-summary')
  return response.data
}

export async function getAdminFeedbackList() {
  const response = await httpClient.get<AdminFeedbackListResponse>('/admin/feedback')
  return response.data
}

export async function getAdminHelpRequests() {
  const response = await httpClient.get<{ items: AdminHelpRequestItem[] }>(
    '/admin/help-requests',
  )
  return response.data
}

export async function getAdminUsers() {
  const response = await httpClient.get<{ items: AdminUserItem[] }>('/admin/users')
  return response.data
}

export async function getAdminSupportRequests() {
  const response = await httpClient.get<{ items: AdminSupportRequestItem[] }>(
    '/admin/support-requests',
  )
  return response.data
}

export async function getAdminBillingInterest() {
  const response = await httpClient.get<{ items: AdminBillingInterestItem[] }>(
    '/admin/billing-interest',
  )
  return response.data
}

export async function getAdminSystemStatus() {
  const response = await httpClient.get<AdminSystemStatus>('/admin/system-status')
  return response.data
}

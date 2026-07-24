import type { TFunction } from 'i18next'
import type { SubscriptionPlan, SubscriptionStatus } from '@/types/billing'
import type { UploadedFileStatus } from '@/types/file'
import type { SupportTicketPriority, SupportTicketStatus } from '@/types/supportTicket'
import type { TeacherHelpStatus } from '@/types/teacherHelp'

type LabelMap = Record<string, string>

const teacherHelpStatusLabels: LabelMap = {
  pending: 'Pending',
  assigned: 'Assigned',
  in_progress: 'In progress',
  resolved: 'Resolved',
  cancelled: 'Cancelled',
}

const supportTicketStatusLabels: LabelMap = {
  open: 'Open',
  waiting_on_user: 'Waiting on reply',
  in_review: 'In review',
  resolved: 'Resolved',
}

const supportTicketPriorityLabels: LabelMap = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
}

const subscriptionStatusLabels: LabelMap = {
  trial: 'Trial',
  active: 'Active',
  inactive: 'Inactive',
  expired: 'Expired',
}

const subscriptionPlanLabels: LabelMap = {
  free_trial: 'Free trial',
  student: 'Student plan',
  teacher_supported: 'Teacher-supported plan',
  family: 'Family plan',
}

const fileStatusLabels: LabelMap = {
  uploaded: 'Uploaded',
  processing: 'Processing',
  parsed: 'Ready',
  failed: 'Failed',
}

const learningTopicStatusLabels: LabelMap = {
  strong: 'Strong',
  stable: 'Stable',
  developing: 'Developing',
  weak: 'Needs practice',
}

const adminFeedbackStatusLabels: LabelMap = {
  new: 'New',
  reviewed: 'Reviewed',
  resolved: 'Resolved',
}

function labelFromMap(t: TFunction | undefined, key: string, fallbackMap: LabelMap, value: string) {
  const fallback = fallbackMap[value] ?? 'Status unavailable'
  return t ? t(key, { defaultValue: fallback }) : fallback
}

export function getTeacherHelpStatusLabel(status: TeacherHelpStatus | string, t?: TFunction) {
  return labelFromMap(t, `common:status.teacherHelp.${status}`, teacherHelpStatusLabels, status)
}

export function getSupportTicketStatusLabel(status: SupportTicketStatus | string, t?: TFunction) {
  return labelFromMap(t, `common:status.supportTicket.${status}`, supportTicketStatusLabels, status)
}

export function getSupportTicketPriorityLabel(priority: SupportTicketPriority | string, t?: TFunction) {
  return labelFromMap(t, `common:status.priority.${priority}`, supportTicketPriorityLabels, priority)
}

export function getSubscriptionStatusLabel(status: SubscriptionStatus | string, t?: TFunction) {
  return labelFromMap(t, `common:status.subscription.${status}`, subscriptionStatusLabels, status)
}

export function getSubscriptionPlanLabel(plan: SubscriptionPlan | string, t?: TFunction) {
  return labelFromMap(t, `common:status.plan.${plan}`, subscriptionPlanLabels, plan)
}

export function getFileStatusLabel(status: UploadedFileStatus | string, t?: TFunction) {
  return labelFromMap(t, `common:status.file.${status}`, fileStatusLabels, status)
}

export function getLearningTopicStatusLabel(status: string, t?: TFunction) {
  return labelFromMap(t, `common:status.learningTopic.${status}`, learningTopicStatusLabels, status)
}

export function getAdminFeedbackStatusLabel(status: string, t?: TFunction) {
  return labelFromMap(t, `common:status.adminFeedback.${status}`, adminFeedbackStatusLabels, status)
}

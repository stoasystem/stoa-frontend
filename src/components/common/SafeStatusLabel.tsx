import { useTranslation } from 'react-i18next'
import {
  getFileStatusLabel,
  getAdminFeedbackStatusLabel,
  getLearningTopicStatusLabel,
  getSubscriptionPlanLabel,
  getSubscriptionStatusLabel,
  getSupportTicketPriorityLabel,
  getSupportTicketStatusLabel,
  getTeacherHelpStatusLabel,
} from '@/lib/displayLabels'

type SafeStatusKind =
  | 'teacherHelp'
  | 'supportTicket'
  | 'supportPriority'
  | 'subscription'
  | 'plan'
  | 'file'
  | 'learningTopic'
  | 'adminFeedback'

export function SafeStatusLabel({ kind, value }: { kind: SafeStatusKind; value?: string | null }) {
  const { t } = useTranslation('common')
  if (!value) return <>{t('status.unavailable')}</>

  if (kind === 'teacherHelp') return <>{getTeacherHelpStatusLabel(value, t)}</>
  if (kind === 'supportTicket') return <>{getSupportTicketStatusLabel(value, t)}</>
  if (kind === 'supportPriority') return <>{getSupportTicketPriorityLabel(value, t)}</>
  if (kind === 'subscription') return <>{getSubscriptionStatusLabel(value, t)}</>
  if (kind === 'plan') return <>{getSubscriptionPlanLabel(value, t)}</>
  if (kind === 'file') return <>{getFileStatusLabel(value, t)}</>
  if (kind === 'learningTopic') return <>{getLearningTopicStatusLabel(value, t)}</>
  if (kind === 'adminFeedback') return <>{getAdminFeedbackStatusLabel(value, t)}</>

  return <>{t('status.unavailable')}</>
}

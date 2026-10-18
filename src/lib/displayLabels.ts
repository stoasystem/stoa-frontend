import type { TFunction } from 'i18next'
import type { SubscriptionPlan, SubscriptionStatus } from '@/types/billing'
import type { UploadedFileStatus } from '@/types/file'
import type { SupportTicketPriority, SupportTicketStatus } from '@/types/supportTicket'
import type { TeacherHelpStatus } from '@/types/teacherHelp'
import { readsEnglish } from '@/lib/userFacingText'

type LabelMap = Record<string, string>

const teacherHelpStatusLabels: LabelMap = {
  pending: 'Pending',
  assigned: 'Assigned',
  in_progress: 'In progress',
  resolved: 'Resolved',
  cancelled: 'Cancelled',
  withdrawn: 'Withdrawn',
  expired: 'Expired',
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

function labelFromMap(t: TFunction, key: string, fallbackMap: LabelMap, value: string) {
  const fallback = fallbackMap[value] ?? 'Status unavailable'
  return t(key, { defaultValue: fallback })
}

export function getTeacherHelpStatusLabel(status: TeacherHelpStatus | string, t: TFunction) {
  return labelFromMap(t, `common:status.teacherHelp.${status}`, teacherHelpStatusLabels, status)
}

export function getSupportTicketStatusLabel(status: SupportTicketStatus | string, t: TFunction) {
  return labelFromMap(t, `common:status.supportTicket.${status}`, supportTicketStatusLabels, status)
}

export function getSupportTicketPriorityLabel(priority: SupportTicketPriority | string, t: TFunction) {
  return labelFromMap(t, `common:status.priority.${priority}`, supportTicketPriorityLabels, priority)
}

export function getSubscriptionStatusLabel(status: SubscriptionStatus | string, t: TFunction) {
  return labelFromMap(t, `common:status.subscription.${status}`, subscriptionStatusLabels, status)
}

export function getSubscriptionPlanLabel(plan: SubscriptionPlan | string, t: TFunction) {
  return labelFromMap(t, `common:status.plan.${plan}`, subscriptionPlanLabels, plan)
}

export function getFileStatusLabel(status: UploadedFileStatus | string, t: TFunction) {
  return labelFromMap(t, `common:status.file.${status}`, fileStatusLabels, status)
}

export function getLearningTopicStatusLabel(status: string, t: TFunction) {
  return labelFromMap(t, `common:status.learningTopic.${status}`, learningTopicStatusLabels, status)
}

export function getAdminFeedbackStatusLabel(status: string, t: TFunction) {
  return labelFromMap(t, `common:status.adminFeedback.${status}`, adminFeedbackStatusLabels, status)
}

const subjectLabels: LabelMap = {
  math: 'Mathematics',
  physics: 'Physics',
  german: 'German',
  english: 'English',
}

// Backend subjects and free-text profile entries reach the UI in several
// spellings; every one of them resolves to a single subject id.
const subjectAliases: Record<string, string> = {
  math: 'math',
  maths: 'math',
  mathematics: 'math',
  mathematik: 'math',
  mathematiques: 'math',
  matematica: 'math',
  physics: 'physics',
  physik: 'physics',
  physique: 'physics',
  fisica: 'physics',
  german: 'german',
  deutsch: 'german',
  allemand: 'german',
  tedesco: 'german',
  english: 'english',
  englisch: 'english',
  anglais: 'english',
  inglese: 'english',
}

// Seeded ZAP curriculum topics, keyed by the same slug the content ids use.
const curriculumTopicLabels: LabelMap = {
  brueche: 'Brüche',
  gleichungen: 'Gleichungen',
  geometrie: 'Geometrie',
  prozentrechnung: 'Prozentrechnung',
  textaufgaben: 'Textaufgaben',
}

// The recommendation rationale arrives as English prose with no key attached.
const rationaleKeys: Record<string, string> = {
  'Recent learning evidence points to this topic as the next reviewed remediation area.':
    'practice:progress.weakTopicReason',
  'A reviewed curriculum exercise is available for this weak topic.':
    'practice:progress.rationale.curriculumExercise',
  'A teacher-reviewed AI practice draft matches this learning need.':
    'practice:progress.rationale.reviewedDraft',
  'Continue with one short reviewed practice item to keep learning memory fresh.':
    'practice:progress.rationale.continuation',
  'Assigned from reviewed curriculum exercise.': 'practice:progress.rationale.assignedCurriculum',
  'Assigned from teacher-reviewed AI exercise draft.': 'practice:progress.rationale.assignedDraft',
  'Recommendations are based on recent learning and assignment signals.':
    'practice:progress.rationale.signals',
}

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')
}

export function getSubjectLabel(subject: string, t: TFunction) {
  const id = subjectAliases[toSlug(subject)]
  if (!id) return subject
  return t(`chat:subjects.${id}`, { defaultValue: subjectLabels[id] })
}

/** Turn a curriculum topic slug into a readable title, keeping unknown labels as sent. */
export function getCurriculumTopicLabel(label: string, t: TFunction) {
  const slug = toSlug(label)
  const fallback = curriculumTopicLabels[slug]
  if (!fallback) return label
  return t(`practice:progress.topicNames.${slug}`, { defaultValue: fallback })
}

/**
 * A topic id as a reader sees it: the curriculum title when the topic is a
 * seeded one, otherwise the slug spelled out ("linear-equations" → "Linear
 * equations") rather than shown as sent (#278).
 */
export function getTopicLabel(topicId: string, t: TFunction) {
  const curriculum = getCurriculumTopicLabel(topicId, t)
  if (curriculum !== topicId) return curriculum
  const words = topicId.trim().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/**
 * A span of minutes in words, at most two units: minutes up to an hour, then
 * hours and minutes, then days and hours ("4 Tage 13 Stunden"). Teacher
 * figures printed the raw count and read "Breached 6576m / 30m" and
 * "6576 Min." (#223).
 */
export function formatMinutes(minutes: number, t: TFunction) {
  const total = Math.max(0, Math.round(minutes))
  const say = (unit: 'minutes' | 'hours' | 'days', count: number) =>
    t(`common:duration.${unit}`, { count })
  if (total < 60) return say('minutes', total)
  if (total < 1440) {
    const rest = total % 60
    return rest ? `${say('hours', Math.floor(total / 60))} ${say('minutes', rest)}` : say('hours', total / 60)
  }
  const rest = Math.floor((total % 1440) / 60)
  const days = say('days', Math.floor(total / 1440))
  return rest ? `${days} ${say('hours', rest)}` : days
}

// The automation explanation names the topic inside the English sentence.
const automationExplanations: Array<[RegExp, string]> = [
  [
    /^Teacher-approved practice was assigned for (.+) based on recent learning signals\.$/,
    'practice:assignments.automationExplanation.teacherApproved',
  ],
  [
    /^Reviewed practice was prepared for (.+) based on recent learning signals\.$/,
    'practice:assignments.automationExplanation.reviewed',
  ],
]

const unnamedAutomationTopic = 'the current learning target'

/**
 * The server's English reason for a recommendation or assignment, in the
 * reader's language. A sentence with no translation is shown as sent to a
 * reader of English; anyone else gets `fallback` when one is passed (#278).
 */
export function getRecommendationRationale(rationale: string, t: TFunction, fallback?: string) {
  const sentence = rationale.trim()
  const key = rationaleKeys[sentence]
  if (key) return t(key, { defaultValue: rationale })
  for (const [pattern, explanationKey] of automationExplanations) {
    const match = pattern.exec(sentence)
    if (!match) continue
    const topic = match[1] === unnamedAutomationTopic
      ? t('practice:assignments.currentTarget')
      : getTopicLabel(match[1], t)
    return t(explanationKey, { topic, defaultValue: rationale })
  }
  if (fallback !== undefined && !readsEnglish()) return fallback
  return rationale
}

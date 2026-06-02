import type { ClassroomSessionType, LiveClassroomSession } from '@/features/live-classroom/types/liveClassroom'

export function formatClassroomTimeRange(session: Pick<LiveClassroomSession, 'scheduledStartAt' | 'scheduledEndAt'>) {
  if (!session.scheduledStartAt) return 'Time to be confirmed'

  const start = new Date(session.scheduledStartAt)
  const end = session.scheduledEndAt ? new Date(session.scheduledEndAt) : undefined
  const day = new Intl.DateTimeFormat('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(start)
  const startTime = new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(start)
  const endTime = end
    ? new Intl.DateTimeFormat('en', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(end)
    : undefined

  return endTime ? `${day}, ${startTime} - ${endTime}` : `${day}, ${startTime}`
}

export function getClassroomSessionTypeLabel(type: ClassroomSessionType) {
  const labels: Record<ClassroomSessionType, string> = {
    quick_help: 'Quick Help',
    standard_session: 'Standard Session',
    deep_review: 'Deep Review',
    instant_video_help: 'Live Classroom Help',
  }

  return labels[type]
}

export function getClassroomStatusLabel(status: LiveClassroomSession['status']) {
  const labels: Record<LiveClassroomSession['status'], string> = {
    scheduled: 'Scheduled',
    lobby_open: 'Lobby open',
    waiting_for_tutor: 'Waiting for tutor',
    waiting_for_student: 'Waiting for student',
    active: 'Active',
    completed: 'Completed',
    cancelled: 'Cancelled',
    missed: 'Missed',
  }

  return labels[status]
}

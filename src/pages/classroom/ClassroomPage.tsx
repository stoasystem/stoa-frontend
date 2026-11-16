/*
 * The virtual classroom (#696): `/classroom/:conversationId`. One classroom
 * is one help request, named by its conversation. The student enters from
 * Ask once they asked for a teacher; the teacher from the request's page once
 * they hold it, with the request's id as `?request=`.
 */
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useParams, useSearchParams } from 'react-router-dom'
import { askPathFor, teacherRequestPathFor } from '@/app/router/routeManifest'
import { useAskServer } from '@/features/ask/server/askServer'
import { ClassroomShell } from '@/features/classroom/ClassroomShell'
import { StudentClassroomSidebar, TeacherClassroomSidebar } from '@/features/classroom/ClassroomSidebars'
import type { ClassroomStatus } from '@/features/classroom/ClassroomTopBar'
import { useClassroomPass } from '@/features/classroom/useClassroomPass'
import { useTeacherHelpRequestDetailQuery } from '@/hooks/teacher/useTeacherHelpRequestDetailQuery'
import { ApiError } from '@/services/api/httpClient'
import { chatQueryKeys } from '@/services/chat/chatQueryKeys'
import { useAuthStore } from '@/store/authStore'
import { isEndedHelpRequest, type TeacherHelpStatus } from '@/types/teacherHelp'

/** While no teacher has joined, the request is read this often; then less. */
const WAITING_POLL_MS = 4_000
const JOINED_POLL_MS = 15_000

function studentStatus(status: TeacherHelpStatus | undefined, teacherName: string | undefined, fallbackName: string): ClassroomStatus {
  const name = teacherName?.trim() || fallbackName
  if (status && isEndedHelpRequest(status)) return { kind: 'ended' }
  if (status === 'in_progress') return { kind: 'joined', teacherName: name }
  if (status === 'assigned') return { kind: 'coming', teacherName: name }
  return { kind: 'waiting' }
}

function StudentClassroom({ conversationId }: { conversationId: string }) {
  const { t } = useTranslation('chat')
  const { getTeacherHelpRequest } = useAskServer().teacherHelp
  const pass = useClassroomPass({ role: 'student', conversationId })
  // The same query Ask's card reads: one request, read at the faster pace of the two.
  const help = useQuery({
    queryKey: chatQueryKeys.teacherHelpRequest(conversationId),
    queryFn: () =>
      getTeacherHelpRequest(conversationId).catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 404) return null
        throw error
      }),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status && isEndedHelpRequest(status)) return false
      return status === 'in_progress' ? JOINED_POLL_MS : WAITING_POLL_MS
    },
    refetchIntervalInBackground: false,
  })
  const status = studentStatus(help.data?.status, help.data?.teacherName, t('ask.thread.teacherFallback'))
  return (
    <ClassroomShell
      pass={pass}
      status={status}
      backTo={askPathFor(conversationId)}
      sidebarLabel={t('ask.title')}
      sidebar={({ collapse }) => <StudentClassroomSidebar conversationId={conversationId} onCollapse={collapse} />}
    />
  )
}

function TeacherClassroom({ requestId }: { requestId: string }) {
  const { t } = useTranslation('chat')
  const pass = useClassroomPass({ role: 'teacher', requestId })
  const detail = useTeacherHelpRequestDetailQuery(requestId)
  const request = detail.data
  const status: ClassroomStatus =
    request && isEndedHelpRequest(request.status)
      ? { kind: 'ended' }
      : { kind: 'teaching', studentName: request?.student.name ?? '' }
  return (
    <ClassroomShell
      pass={pass}
      status={status}
      backTo={teacherRequestPathFor(requestId)}
      sidebarLabel={t('classroom.teacherSidebar.label')}
      sidebar={({ collapse }) => <TeacherClassroomSidebar request={request} onCollapse={collapse} />}
    />
  )
}

export function ClassroomPage() {
  const { conversationId = '' } = useParams()
  const [search] = useSearchParams()
  const role = useAuthStore((state) => state.user?.role)
  // A teacher's seat is asked for by the request they hold; an older link without it uses the conversation's id.
  if (role === 'teacher') return <TeacherClassroom requestId={search.get('request') || conversationId} />
  return <StudentClassroom conversationId={conversationId} />
}


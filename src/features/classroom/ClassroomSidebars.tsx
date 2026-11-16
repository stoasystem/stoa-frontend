import { X } from 'lucide-react'
import { useMemo, useState, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { IconButton, SegmentedFilter } from '@/components/base'
import { TeacherRequestTimeline } from '@/components/teacher/TeacherRequestTimeline'
import { AskMessage } from '@/features/ask/AskMessage'
import { AskPanel } from '@/features/ask/AskPanel'
import { ASK_SURFACE_BACKGROUND } from '@/features/ask/askLayout'
import { useAskController, type AskController } from '@/features/ask/useAskController'
import { TeacherReplyComposer } from '@/features/teacherReply/TeacherReplyComposer'
import { useTeacherReply } from '@/features/teacherReply/useTeacherReply'
import type { ChatMessage } from '@/types/chat'
import type { TeacherHelpRequestDetail } from '@/types/teacher'
import { acceptsTeacherReply } from '@/types/teacherHelp'

/**
 * The student's sidebar: Ask itself, on this conversation, so the student
 * can go on asking the assistant while the teacher comes and talks (#696).
 * It stays on this conversation -- the list is outside the classroom -- and
 * its close button folds the sidebar away.
 */
export function StudentClassroomSidebar({ conversationId, onCollapse }: { conversationId: string; onCollapse: () => void }) {
  const base = useAskController({ conversationId })
  const controller = useMemo<AskController>(() => ({ ...base, close: onCollapse }), [base, onCollapse])
  return (
    <div
      data-surface="sky"
      data-ask-surface="panel"
      data-ask-entry="classroom"
      data-ask-conversation={conversationId}
      className="h-full text-ink"
      style={{ background: ASK_SURFACE_BACKGROUND.panel } as CSSProperties}
    >
      <AskPanel controller={controller} layout="panel" pinned />
    </div>
  )
}

type TeacherTab = 'conversation' | 'replies'

/** What the teacher reads of a message: the student's and the assistant's words; pictures are on the request page. */
function asThreadMessage(message: TeacherHelpRequestDetail['messages'][number]): ChatMessage {
  const { attachments: _attachments, ...rest } = message
  void _attachments
  return rest
}

/**
 * The teacher's sidebar (#696): the student's conversation with the
 * assistant, to read, and the request's replies -- those sent, and a new one.
 */
export function TeacherClassroomSidebar({
  request,
  onCollapse,
}: {
  request: TeacherHelpRequestDetail | undefined
  onCollapse: () => void
}) {
  const { t } = useTranslation('chat')
  const [tab, setTab] = useState<TeacherTab>('conversation')
  const reply = useTeacherReply(request?.requestId)
  const messages = useMemo(() => (request?.messages ?? []).map(asThreadMessage), [request?.messages])

  return (
    <div className="flex h-full flex-col bg-surface text-ink">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-separator px-3">
        <SegmentedFilter<TeacherTab>
          label={t('classroom.teacherSidebar.label')}
          value={tab}
          onChange={setTab}
          options={[
            { value: 'conversation', label: t('classroom.teacherSidebar.conversation') },
            { value: 'replies', label: t('classroom.teacherSidebar.replies') },
          ]}
        />
        <IconButton label={t('classroom.sidebar.hide')} icon={X} size={30} variant="gray" className="ml-auto" onClick={onCollapse} />
      </header>
      {tab === 'conversation' ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-ground p-3" data-classroom-transcript>
          <p className="text-[12px] text-caption">{t('classroom.teacherSidebar.readOnly')}</p>
          {messages.length === 0 ? (
            <p className="text-[13px] text-caption">{t('classroom.teacherSidebar.empty')}</p>
          ) : (
            messages.map((message) => <AskMessage key={message.id} message={message} />)
          )}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-3" data-classroom-replies>
          {request && <TeacherRequestTimeline requestId={request.requestId} notes={request.notes ?? []} />}
          {request && acceptsTeacherReply(request.status) && <TeacherReplyComposer reply={reply} />}
        </div>
      )}
    </div>
  )
}

import { TeacherRequestInlineAction } from '@/components/chat/TeacherRequestInlineAction'

export function LearningResponseFeedback({
  onRequestTeacher,
  isRequesting,
  feedback,
  feedbackTone,
}: {
  onRequestTeacher?: () => void
  isRequesting?: boolean
  feedback?: string | null
  feedbackTone?: 'info' | 'error'
}) {
  return (
    <TeacherRequestInlineAction
      onRequestTeacher={onRequestTeacher}
      isRequesting={isRequesting}
      feedback={feedback}
      feedbackTone={feedbackTone}
    />
  )
}

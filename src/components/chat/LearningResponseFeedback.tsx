import { TeacherRequestInlineAction } from '@/components/chat/TeacherRequestInlineAction'

export function LearningResponseFeedback({
  onRequestTeacher,
  isRequesting,
  feedback,
}: {
  onRequestTeacher?: () => void
  isRequesting?: boolean
  feedback?: string | null
}) {
  return (
    <TeacherRequestInlineAction
      onRequestTeacher={onRequestTeacher}
      isRequesting={isRequesting}
      feedback={feedback}
    />
  )
}

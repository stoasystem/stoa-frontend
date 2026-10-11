import { useTranslation } from 'react-i18next'
import { RichTeacherReply } from '@/components/teacher/RichTeacherReply'
import type { TeacherHelpRequestNote } from '@/types/teacher'

export function TeacherRequestTimeline({ notes }: { notes: TeacherHelpRequestNote[] }) {
  const { t, i18n } = useTranslation('teacher')

  if (notes.length === 0) {
    return (
      <div className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
        {t('detail.noNotes')}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {notes.map((note) => (
        <article key={note.id} className="rounded-md border bg-card p-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium">{note.teacher.name}</p>
            <time className="text-xs text-muted-foreground">{new Date(note.createdAt).toLocaleString(i18n.resolvedLanguage)}</time>
          </div>
          <div className="mt-3">
            <RichTeacherReply content={note.richContent} fallback={note.note} />
          </div>
        </article>
      ))}
    </div>
  )
}

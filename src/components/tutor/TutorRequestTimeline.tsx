import type { TutorHelpRequestNote } from '@/types/tutor'

export function TutorRequestTimeline({ notes }: { notes: TutorHelpRequestNote[] }) {
  if (notes.length === 0) {
    return (
      <div className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
        No tutor notes yet.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {notes.map((note) => (
        <article key={note.id} className="rounded-md border bg-card p-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium">{note.tutor.name}</p>
            <time className="text-xs text-muted-foreground">{new Date(note.createdAt).toLocaleString()}</time>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{note.note}</p>
        </article>
      ))}
    </div>
  )
}

import { FormEvent, useState } from 'react'
import { Button } from '@/components/ui/button'

export function TutorRequestNoteForm({
  isSubmitting,
  onSubmit,
}: {
  isSubmitting: boolean
  onSubmit: (content: string) => void
}) {
  const [content, setContent] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) return
    onSubmit(trimmed)
    setContent('')
  }

  return (
    <form className="space-y-3 rounded-md border bg-card p-4" onSubmit={handleSubmit}>
      <label className="block text-sm font-medium" htmlFor="teacher-note">
        Teacher note
      </label>
      <textarea
        id="teacher-note"
        className="min-h-28 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm leading-6 outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        placeholder="Add the next step, explanation focus, or follow-up needed."
        value={content}
        onChange={(event) => setContent(event.target.value)}
      />
      <Button type="submit" disabled={isSubmitting || content.trim().length === 0}>
        Add note
      </Button>
    </form>
  )
}

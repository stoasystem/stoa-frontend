/**
 * The tutor timeline renders replies exactly as the backend serves them.
 *
 * The API names a reply's author `teacher` (backend `TeacherNoteOut`); the
 * timeline read `note.tutor.name`, so the first reply a teacher could ever send
 * (stoasystem/stoa-backend#66, live 2026-09-28) crashed the request detail page.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TutorRequestTimeline } from '@/components/tutor/TutorRequestTimeline'
import type { TutorHelpRequestNote } from '@/types/tutor'

// The shape `GET /teachers/me/help-requests/{id}` returns for a note.
const servedNote = {
  id: 'note-1',
  note: 'Probier jetzt 15 : 5.',
  createdAt: '2026-09-28T15:48:49.507077+00:00',
  teacher: { id: 'teacher_9be74a537a1e43b3b837c0ce', name: 'teacher@test.stoaedu.ch' },
  richContent: null,
  responseFormat: 'plain',
} satisfies TutorHelpRequestNote

describe('tutor request timeline', () => {
  it('names the author of a reply as the backend serves it', () => {
    render(<TutorRequestTimeline notes={[servedNote]} />)

    expect(screen.getByText('teacher@test.stoaedu.ch')).toBeInTheDocument()
    expect(screen.getByText('Probier jetzt 15 : 5.')).toBeInTheDocument()
  })
})

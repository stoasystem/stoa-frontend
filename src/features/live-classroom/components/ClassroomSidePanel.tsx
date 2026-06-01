import { useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useClassroomNotes } from '@/features/live-classroom/hooks/useClassroomNotes'
import type {
  ClassroomSidePanelTab,
  LiveClassroomSession,
} from '@/features/live-classroom/types/liveClassroom'

const tabs: Array<{ id: ClassroomSidePanelTab; label: string }> = [
  { id: 'chat', label: 'Chat' },
  { id: 'materials', label: 'Materials' },
  { id: 'notes', label: 'Notes' },
  { id: 'participants', label: 'Participants' },
]

export function ClassroomSidePanel({
  session,
  activePanel,
  onPanelChange,
  tutorMode = false,
}: {
  session: LiveClassroomSession
  activePanel: ClassroomSidePanelTab
  onPanelChange: (panel: ClassroomSidePanelTab) => void
  tutorMode?: boolean
}) {
  return (
    <aside className="rounded-lg border bg-card p-4 shadow-[var(--platform-shadow-card)]">
      <div role="tablist" aria-label="Classroom panels" className="grid grid-cols-2 gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activePanel === tab.id}
            onClick={() => onPanelChange(tab.id)}
            className={`rounded-md border px-3 py-2 text-sm font-medium ${
              activePanel === tab.id ? 'border-primary bg-primary/5 text-primary' : 'bg-background'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {activePanel === 'chat' && <ClassroomChatPanel session={session} />}
        {activePanel === 'materials' && <ClassroomMaterialsPanel session={session} />}
        {activePanel === 'notes' && <ClassroomNotesPanel session={session} tutorMode={tutorMode} />}
        {activePanel === 'participants' && <ClassroomParticipantsPanel session={session} />}
      </div>
    </aside>
  )
}

function ClassroomChatPanel({ session }: { session: LiveClassroomSession }) {
  const [draft, setDraft] = useState('')

  return (
    <section aria-label="Classroom chat" className="space-y-3">
      <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
        {session.messages.map((message) => (
          <div key={message.id} className="rounded-md border bg-[hsl(var(--platform-surface-app))] p-3">
            <p className="text-xs font-semibold text-muted-foreground">{message.senderName}</p>
            <p className="mt-1 text-sm leading-6">{message.body}</p>
          </div>
        ))}
      </div>
      <Textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        aria-label="Classroom chat message"
        placeholder="Send a classroom message..."
        className="min-h-20"
      />
      <Button type="button" size="sm" onClick={() => setDraft('')} disabled={!draft.trim()}>
        <Send className="h-4 w-4" aria-hidden="true" />
        Send
      </Button>
    </section>
  )
}

function ClassroomMaterialsPanel({ session }: { session: LiveClassroomSession }) {
  return (
    <section aria-label="Classroom materials" className="space-y-3">
      <p className="text-sm text-muted-foreground">Uploaded before or shared during the classroom.</p>
      {session.materials.map((material) => (
        <div key={material.id} className="rounded-md border bg-[hsl(var(--platform-surface-app))] p-3">
          <p className="text-sm font-medium">{material.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {material.type.toUpperCase()} · uploaded by {material.uploadedByRole.replace('_', ' ')}
          </p>
        </div>
      ))}
      {session.materials.length === 0 && (
        <p className="rounded-md border bg-[hsl(var(--platform-surface-app))] p-3 text-sm text-muted-foreground">
          No materials have been shared yet.
        </p>
      )}
    </section>
  )
}

function ClassroomNotesPanel({
  session,
  tutorMode,
}: {
  session: LiveClassroomSession
  tutorMode: boolean
}) {
  const [summary, setSummary] = useState(session.notes?.summary ?? '')
  const notesMutation = useClassroomNotes(session.id)

  function saveNotes() {
    notesMutation.mutate({
      summary,
      keyPoints: session.notes?.keyPoints ?? [],
      nextSteps: session.notes?.nextSteps ?? [],
    })
  }

  return (
    <section aria-label="Classroom notes" className="space-y-3">
      {tutorMode ? (
        <>
          <Textarea
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            aria-label="Tutor notes"
            className="min-h-28"
          />
          <Button type="button" size="sm" onClick={saveNotes} disabled={notesMutation.isPending}>
            {notesMutation.isPending ? 'Saving...' : 'Save Notes'}
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm leading-6">{session.notes?.summary ?? 'Tutor notes will appear after the session.'}</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {(session.notes?.keyPoints ?? []).map((point) => (
              <li key={point}>- {point}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

function ClassroomParticipantsPanel({ session }: { session: LiveClassroomSession }) {
  return (
    <section aria-label="Classroom participants" className="space-y-3">
      {session.participants.map((participant) => (
        <div key={participant.id} className="rounded-md border bg-[hsl(var(--platform-surface-app))] p-3">
          <p className="text-sm font-medium">{participant.displayName}</p>
          <p className="mt-1 text-xs capitalize text-muted-foreground">{participant.role.replace('_', ' ')}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Camera {participant.cameraStatus}; microphone {participant.microphoneStatus}; {participant.connectionStatus}
          </p>
        </div>
      ))}
    </section>
  )
}

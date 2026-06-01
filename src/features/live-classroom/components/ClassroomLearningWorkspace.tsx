import { FileText, PenTool } from 'lucide-react'
import type { LiveClassroomSession } from '@/features/live-classroom/types/liveClassroom'

export function ClassroomLearningWorkspace({
  session,
  tutorMode = false,
  whiteboardOpen,
}: {
  session: LiveClassroomSession
  tutorMode?: boolean
  whiteboardOpen: boolean
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)]">
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-start gap-3">
          <FileText className="mt-1 h-5 w-5 text-primary" aria-hidden="true" />
          <div>
            <p className="brand-section-kicker">Shared Problem</p>
            <h2 className="mt-2 text-xl font-semibold">{session.topicLabel ?? session.subjectLabel}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {session.context?.studentMessage ??
                session.context?.summary ??
                'Review the current learning material together with the tutor.'}
            </p>
          </div>
        </div>
        {session.materials.length > 0 && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {session.materials.slice(0, 2).map((material) => (
              <div key={material.id} className="rounded-md border bg-[hsl(var(--platform-surface-app))] p-3">
                <p className="text-sm font-medium">{material.title}</p>
                <p className="mt-1 text-xs uppercase text-muted-foreground">{material.type}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {whiteboardOpen && (
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-start gap-3">
            <PenTool className="mt-1 h-5 w-5 text-primary" aria-hidden="true" />
            <div>
              <p className="brand-section-kicker">Shared Whiteboard</p>
              <h2 className="mt-2 text-xl font-semibold">Step-by-step space</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                The real whiteboard engine will connect in a later phase. This placeholder shows where the tutor explains steps.
              </p>
            </div>
          </div>
          {tutorMode && (
            <div className="mt-4 flex flex-wrap gap-2">
              {['Pen', 'Eraser', 'Text', 'Clear'].map((tool) => (
                <button
                  key={tool}
                  type="button"
                  className="rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground"
                  aria-label={`${tool} whiteboard tool placeholder`}
                >
                  {tool}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

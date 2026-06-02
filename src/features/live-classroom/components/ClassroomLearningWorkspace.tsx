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
    <section className="overflow-hidden rounded-lg border bg-card shadow-[var(--platform-shadow-card)]">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="min-h-80 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <FileText className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0">
              <p className="brand-section-kicker">Shared Problem</p>
              <h2 className="mt-2 text-2xl font-semibold">{session.topicLabel ?? session.subjectLabel}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                {session.context?.studentMessage ??
                  session.context?.summary ??
                  'Review the current learning material together with the tutor.'}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-md border bg-[hsl(var(--platform-surface-app))] p-4">
            <div className="flex items-start gap-3">
              <PenTool className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div className="min-w-0">
                <p className="brand-section-kicker">{whiteboardOpen ? 'Shared Whiteboard' : 'Focus Board'}</p>
                <h3 className="mt-2 text-xl font-semibold">Step-by-step space</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {whiteboardOpen
                    ? 'Use this space to work through the next step with the tutor.'
                    : 'Open the whiteboard when you want to work through the next step visually.'}
                </p>
              </div>
            </div>
            {tutorMode && whiteboardOpen && (
              <div className="mt-4 flex flex-wrap gap-2">
                {['Pen', 'Eraser', 'Text', 'Clear'].map((tool) => (
                  <button
                    key={tool}
                    type="button"
                    className="rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground"
                    aria-label={`${tool} whiteboard tool`}
                  >
                    {tool}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="border-t bg-[hsl(var(--platform-surface-app))] p-5 lg:border-l lg:border-t-0">
          <p className="brand-section-kicker">Materials</p>
          <div className="mt-3 grid gap-2">
            {session.materials.slice(0, 3).map((material) => (
              <div key={material.id} className="rounded-md border bg-card p-3">
                <p className="text-sm font-medium">{material.title}</p>
                <p className="mt-1 text-xs uppercase text-muted-foreground">{material.type}</p>
              </div>
            ))}
            {session.materials.length === 0 && (
              <p className="rounded-md border bg-card p-3 text-sm text-muted-foreground">
                No material shared yet.
              </p>
            )}
          </div>
        </aside>
      </div>
    </section>
  )
}

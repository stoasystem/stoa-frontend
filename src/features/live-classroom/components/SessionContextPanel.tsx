import type { LiveClassroomSession } from '@/features/live-classroom/types/liveClassroom'

export function SessionContextPanel({ session }: { session: LiveClassroomSession }) {
  return (
    <section className="rounded-lg border bg-card p-4">
      <p className="brand-section-kicker">Session Context</p>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <ContextRow label="Source" value={session.context?.sourceLabel ?? session.source} />
        <ContextRow label="Topic" value={session.context?.topicLabel ?? session.topicLabel ?? session.subjectLabel} />
        <ContextRow label="Level" value={session.level ?? 'Not specified'} />
        <ContextRow label="Language" value={session.language.toUpperCase()} />
      </dl>
      {session.context?.summary && (
        <p className="mt-4 text-sm leading-6 text-muted-foreground">{session.context.summary}</p>
      )}
      {session.recommendedFocus && (
        <div className="mt-4 rounded-md border bg-[hsl(var(--platform-surface-app))] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recommended focus</p>
          <p className="mt-1 text-sm">{session.recommendedFocus}</p>
        </div>
      )}
    </section>
  )
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  )
}

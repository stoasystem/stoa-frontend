import { ArrowRight, GraduationCap } from 'lucide-react'
import { Link } from 'react-router-dom'

export function HomeTeacherFallback() {
  return (
    <section className="mx-auto grid max-w-6xl gap-6 px-5 py-10 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
      <div className="rounded-xl border border-border/70 bg-[#152238] p-6 text-primary-foreground">
        <GraduationCap className="h-8 w-8 text-[#c2a15a]" />
        <p className="mt-8 text-2xl font-semibold leading-tight">
          Teachers are not a separate doorway. They are the support layer inside the learning moment.
        </p>
      </div>
      <div className="rounded-xl border border-border/70 bg-card/78 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[hsl(var(--accent))]">
          Human support
        </p>
        <h2 className="mt-3 text-3xl font-semibold leading-tight text-foreground">
          When AI is not enough, the question already has context.
        </h2>
        <p className="mt-4 text-base leading-8 text-muted-foreground">
          A tutor sees the conversation, the student question, and the previous AI explanation. The
          escalation happens where confusion appears, so the student does not have to restart.
        </p>
        <Link
          to="/teacher-support"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-[hsl(var(--accent))]"
        >
          Tutor pathway
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}

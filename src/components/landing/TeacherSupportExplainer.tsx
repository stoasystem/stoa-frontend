import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function TeacherSupportExplainer() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Teacher support when confidence matters</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[0.72fr_1fr] lg:items-center">
        <div className="brand-image-panel relative min-h-64 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1000&q=80"
            alt="Teacher speaking with students in a classroom"
            className="absolute inset-0 h-full w-full object-cover opacity-78"
          />
          <div className="brand-image-overlay absolute inset-0" />
          <div className="absolute bottom-4 left-4 right-4 rounded-lg border border-white/15 bg-[hsl(var(--stoa-brand-card)_/_0.9)] p-4 text-[hsl(var(--stoa-brand-ink))] backdrop-blur">
            <p className="brand-section-kicker text-[hsl(var(--stoa-brand-burgundy))]">
              Tutor context
            </p>
            <p className="mt-2 text-sm leading-6">
              The teacher joins with the student question and previous explanation already in view.
            </p>
          </div>
        </div>
        <div className="grid gap-4 text-sm leading-6 text-muted-foreground md:grid-cols-3 lg:grid-cols-1">
          <p>Students can ask for help instead of getting stuck after a confusing explanation.</p>
          <p>Teachers see the student question, grade, subject, context, and recent follow-up.</p>
          <p>Parents can see that teacher support happened without exposing unnecessary private detail.</p>
        </div>
      </CardContent>
    </Card>
  )
}

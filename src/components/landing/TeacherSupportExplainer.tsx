import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function TeacherSupportExplainer() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Teacher support when confidence matters</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[0.72fr_1fr] lg:items-center">
        <div className="relative min-h-64 overflow-hidden rounded-xl border border-border/70 bg-[#152238]">
          <img
            src="https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1000&q=80"
            alt="Teacher speaking with students in a classroom"
            className="absolute inset-0 h-full w-full object-cover opacity-78"
          />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(217_45%_15%_/_0.62),transparent_58%)]" />
          <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/15 bg-white/88 p-4 text-[#152238] backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b08a4a]">
              Tutor context
            </p>
            <p className="mt-2 text-sm leading-6">
              The tutor joins with the student question and previous AI explanation already in view.
            </p>
          </div>
        </div>
        <div className="grid gap-4 text-sm leading-6 text-muted-foreground md:grid-cols-3 lg:grid-cols-1">
          <p>Students can escalate confusing answers instead of getting stuck after an AI response.</p>
          <p>Tutors see the student question, grade, subject, AI context, and recent follow-up.</p>
          <p>Parents can see that teacher support happened without exposing unnecessary private detail.</p>
        </div>
      </CardContent>
    </Card>
  )
}

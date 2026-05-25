import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TutorScheduleSlot } from '@/types/tutorAssignment'

export function TutorScheduleOverview({ slots }: { slots: TutorScheduleSlot[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Schedule overview</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {slots.map((slot) => (
          <div key={`${slot.tutorId}-${slot.dayLabel}`} className="rounded-md border p-3">
            <p className="font-medium">{slot.tutorName}</p>
            <p className="text-sm text-muted-foreground">{slot.dayLabel} · {slot.timeRange}</p>
            <p className="mt-2 text-sm">{slot.subjects.join(', ')}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

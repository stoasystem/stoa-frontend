import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TeacherScheduleSlot } from '@/types/teacherAssignment'

export function TeacherScheduleOverview({ slots }: { slots: TeacherScheduleSlot[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Schedule overview</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {slots.map((slot) => (
          <div key={`${slot.teacherId}-${slot.dayLabel}`} className="rounded-md border p-3">
            <p className="font-medium">{slot.teacherName}</p>
            <p className="text-sm text-muted-foreground">{slot.dayLabel} · {slot.timeRange}</p>
            <p className="mt-2 text-sm">{slot.subjects.join(', ')}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

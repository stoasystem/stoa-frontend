import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TutorAvailability } from '@/types/tutorAvailability'

export function TutorAvailabilitySummary({ availability }: { availability: TutorAvailability }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Current availability</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
        <p>Subjects: {availability.subjects.join(', ') || 'None selected'}</p>
        <ul className="space-y-2">
          {availability.weeklyAvailability.map((slot) => (
            <li key={`${slot.dayOfWeek}-${slot.startTime}`} className="rounded-md border bg-background px-3 py-2">
              {slot.dayOfWeek}: {slot.startTime}-{slot.endTime}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

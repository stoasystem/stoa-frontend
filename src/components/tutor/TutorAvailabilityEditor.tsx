import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TutorSubjectSelector } from '@/components/tutor/TutorSubjectSelector'
import { useUpdateTutorAvailabilityMutation } from '@/hooks/tutor/useUpdateTutorAvailabilityMutation'
import type { TutorAvailability, TutorAvailabilitySlot } from '@/types/tutorAvailability'

const days: TutorAvailabilitySlot['dayOfWeek'][] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

export function TutorAvailabilityEditor({ availability }: { availability: TutorAvailability }) {
  const [subjects, setSubjects] = useState(availability.subjects)
  const [weeklyAvailability, setWeeklyAvailability] = useState(availability.weeklyAvailability)
  const updateMutation = useUpdateTutorAvailabilityMutation()

  useEffect(() => {
    setSubjects(availability.subjects)
    setWeeklyAvailability(availability.weeklyAvailability)
  }, [availability])

  function updateSlot(index: number, patch: Partial<TutorAvailabilitySlot>) {
    setWeeklyAvailability((slots) =>
      slots.map((slot, slotIndex) => (slotIndex === index ? { ...slot, ...patch } : slot)),
    )
  }

  return (
    <form
      className="space-y-6 rounded-lg border bg-card p-5"
      onSubmit={(event) => {
        event.preventDefault()
        updateMutation.mutate({ subjects, weeklyAvailability })
      }}
    >
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Subjects</h2>
        <TutorSubjectSelector selectedSubjects={subjects} onChange={setSubjects} />
      </div>
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Weekly slots</h2>
        {weeklyAvailability.map((slot, index) => (
          <div key={index} className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Day</Label>
              <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={slot.dayOfWeek} onChange={(event) => updateSlot(index, { dayOfWeek: event.target.value as TutorAvailabilitySlot['dayOfWeek'] })}>
                {days.map((day) => <option key={day} value={day}>{day}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Start</Label>
              <Input value={slot.startTime} onChange={(event) => updateSlot(index, { startTime: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>End</Label>
              <Input value={slot.endTime} onChange={(event) => updateSlot(index, { endTime: event.target.value })} />
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => setWeeklyAvailability((slots) => [...slots, { dayOfWeek: 'friday', startTime: '16:00', endTime: '18:00' }])}
        >
          Add slot
        </Button>
      </div>
      <Button type="submit" disabled={updateMutation.isPending}>
        {updateMutation.isPending ? 'Saving...' : 'Save availability'}
      </Button>
    </form>
  )
}

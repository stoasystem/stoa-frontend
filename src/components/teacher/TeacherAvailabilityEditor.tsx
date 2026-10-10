import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TeacherSubjectSelector } from '@/components/teacher/TeacherSubjectSelector'
import { useUpdateTeacherWeeklyAvailabilityMutation } from '@/hooks/teacher/useUpdateTeacherWeeklyAvailabilityMutation'
import { WEEKDAYS, weekdayName } from '@/lib/weekdays'
import type { TeacherWeeklyAvailability, TeacherAvailabilitySlot } from '@/types/teacherAvailability'

export function TeacherAvailabilityEditor({ availability }: { availability: TeacherWeeklyAvailability }) {
  const { t, i18n } = useTranslation('teacher')
  const [subjects, setSubjects] = useState(availability.subjects)
  const [weeklyAvailability, setWeeklyAvailability] = useState(availability.weeklyAvailability)
  const updateMutation = useUpdateTeacherWeeklyAvailabilityMutation()

  useEffect(() => {
    setSubjects(availability.subjects)
    setWeeklyAvailability(availability.weeklyAvailability)
  }, [availability])

  function updateSlot(index: number, patch: Partial<TeacherAvailabilitySlot>) {
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
        <h2 className="text-base font-semibold">{t('availability.editor.subjects')}</h2>
        <TeacherSubjectSelector selectedSubjects={subjects} onChange={setSubjects} />
      </div>
      <div className="space-y-3">
        <h2 className="text-base font-semibold">{t('availability.editor.weeklySlots')}</h2>
        {weeklyAvailability.map((slot, index) => (
          <div key={index} className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor={`slot-${index}-day`}>{t('availability.editor.day')}</Label>
              <select id={`slot-${index}-day`} className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={slot.dayOfWeek} onChange={(event) => updateSlot(index, { dayOfWeek: event.target.value as TeacherAvailabilitySlot['dayOfWeek'] })}>
                {WEEKDAYS.map((day) => <option key={day} value={day}>{weekdayName(day, i18n.language)}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`slot-${index}-start`}>{t('availability.editor.start')}</Label>
              <Input id={`slot-${index}-start`} value={slot.startTime} onChange={(event) => updateSlot(index, { startTime: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`slot-${index}-end`}>{t('availability.editor.end')}</Label>
              <Input id={`slot-${index}-end`} value={slot.endTime} onChange={(event) => updateSlot(index, { endTime: event.target.value })} />
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => setWeeklyAvailability((slots) => [...slots, { dayOfWeek: 'friday', startTime: '16:00', endTime: '18:00' }])}
        >
          {t('availability.editor.addSlot')}
        </Button>
      </div>
      <Button type="submit" disabled={updateMutation.isPending}>
        {updateMutation.isPending ? t('availability.editor.saving') : t('availability.editor.save')}
      </Button>
    </form>
  )
}

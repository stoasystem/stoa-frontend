import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TeacherSubjectSelector } from '@/components/teacher/TeacherSubjectSelector'
import { useUpdateTeacherWeeklyAvailabilityMutation } from '@/hooks/teacher/useUpdateTeacherWeeklyAvailabilityMutation'
import { slotProblem } from '@/lib/availabilitySlots'
import { normalTeacherSubjects } from '@/lib/subjects'
import { WEEKDAYS, weekdayName } from '@/lib/weekdays'
import type { TeacherWeeklyAvailability, TeacherAvailabilitySlot } from '@/types/teacherAvailability'

export function TeacherAvailabilityEditor({ availability }: { availability: TeacherWeeklyAvailability }) {
  const { t, i18n } = useTranslation('teacher')
  // Stored subjects as ids; any outside the five stay offered after unticking.
  const [storedSubjects, setStoredSubjects] = useState(() => normalTeacherSubjects(availability.subjects))
  const [subjects, setSubjects] = useState(storedSubjects)
  const [weeklyAvailability, setWeeklyAvailability] = useState(availability.weeklyAvailability)
  const [showProblems, setShowProblems] = useState(false)
  const updateMutation = useUpdateTeacherWeeklyAvailabilityMutation()

  useEffect(() => {
    const normal = normalTeacherSubjects(availability.subjects)
    setStoredSubjects(normal)
    setSubjects(normal)
    setWeeklyAvailability(availability.weeklyAvailability)
    setShowProblems(false)
  }, [availability])

  function updateSlot(index: number, patch: Partial<TeacherAvailabilitySlot>) {
    setWeeklyAvailability((slots) =>
      slots.map((slot, slotIndex) => (slotIndex === index ? { ...slot, ...patch } : slot)),
    )
  }

  function removeSlot(index: number) {
    setWeeklyAvailability((slots) => slots.filter((_, slotIndex) => slotIndex !== index))
  }

  return (
    <form
      className="space-y-6 rounded-lg border bg-card p-5"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        if (weeklyAvailability.some((slot) => slotProblem(slot))) {
          setShowProblems(true)
          return
        }
        updateMutation.mutate({ subjects, weeklyAvailability })
      }}
    >
      <div className="space-y-3">
        <h2 className="text-base font-semibold">{t('availability.editor.subjects')}</h2>
        <TeacherSubjectSelector selectedSubjects={subjects} extraSubjects={storedSubjects} onChange={setSubjects} />
      </div>
      <div className="space-y-3">
        <h2 className="text-base font-semibold">{t('availability.editor.weeklySlots')}</h2>
        {weeklyAvailability.map((slot, index) => {
          const problem = showProblems ? slotProblem(slot) : null
          const day = weekdayName(slot.dayOfWeek, i18n.language)
          return (
            <div key={index} className="space-y-2">
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
                <div className="space-y-2">
                  <Label htmlFor={`slot-${index}-day`}>{t('availability.editor.day')}</Label>
                  <select id={`slot-${index}-day`} className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={slot.dayOfWeek} onChange={(event) => updateSlot(index, { dayOfWeek: event.target.value as TeacherAvailabilitySlot['dayOfWeek'] })}>
                    {WEEKDAYS.map((weekday) => <option key={weekday} value={weekday}>{weekdayName(weekday, i18n.language)}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`slot-${index}-start`}>{t('availability.editor.start')}</Label>
                  <Input
                    id={`slot-${index}-start`}
                    type="time"
                    required
                    aria-invalid={problem ? true : undefined}
                    aria-describedby={problem ? `slot-${index}-problem` : undefined}
                    value={slot.startTime}
                    onChange={(event) => updateSlot(index, { startTime: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`slot-${index}-end`}>{t('availability.editor.end')}</Label>
                  <Input
                    id={`slot-${index}-end`}
                    type="time"
                    required
                    aria-invalid={problem ? true : undefined}
                    aria-describedby={problem ? `slot-${index}-problem` : undefined}
                    value={slot.endTime}
                    onChange={(event) => updateSlot(index, { endTime: event.target.value })}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  aria-label={t('availability.editor.removeSlotLabel', { day, start: slot.startTime, end: slot.endTime })}
                  onClick={() => removeSlot(index)}
                >
                  {t('availability.editor.removeSlot')}
                </Button>
              </div>
              {problem && (
                <p id={`slot-${index}-problem`} role="alert" className="text-sm text-destructive">
                  {t(`availability.editor.${problem}`)}
                </p>
              )}
            </div>
          )
        })}
        <Button
          type="button"
          variant="outline"
          onClick={() => setWeeklyAvailability((slots) => [...slots, { dayOfWeek: 'friday', startTime: '16:00', endTime: '18:00' }])}
        >
          {t('availability.editor.addSlot')}
        </Button>
      </div>
      {updateMutation.isError && (
        <p role="alert" className="text-sm text-destructive">{t('availability.editor.saveFailed')}</p>
      )}
      <Button type="submit" disabled={updateMutation.isPending}>
        {updateMutation.isPending ? t('availability.editor.saving') : t('availability.editor.save')}
      </Button>
    </form>
  )
}

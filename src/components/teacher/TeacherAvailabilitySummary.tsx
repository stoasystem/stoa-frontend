import { useTranslation } from 'react-i18next'
import { subjectDisplayLabel } from '@/components/chat/conversationTitle'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { weekdayName } from '@/lib/weekdays'
import type { TeacherWeeklyAvailability } from '@/types/teacherAvailability'

export function TeacherAvailabilitySummary({ availability }: { availability: TeacherWeeklyAvailability }) {
  const { t, i18n } = useTranslation('teacher')
  const { t: tChat } = useTranslation('chat')
  const subjects = availability.subjects.map((subject) => subjectDisplayLabel(subject, tChat)).join(', ')
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('availability.summary.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
        <p>{t('availability.summary.subjects', { subjects: subjects || t('availability.summary.noSubjects') })}</p>
        <ul className="space-y-2">
          {availability.weeklyAvailability.map((slot) => (
            <li key={`${slot.dayOfWeek}-${slot.startTime}`} className="rounded-md border bg-background px-3 py-2">
              {weekdayName(slot.dayOfWeek, i18n.language)}: {slot.startTime}–{slot.endTime}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

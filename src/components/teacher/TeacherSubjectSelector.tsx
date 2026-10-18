import { useTranslation } from 'react-i18next'
import { TEACHER_SUBJECT_IDS, teacherSubjectLabel } from '@/lib/subjects'

// What is stored on the teacher's availability and sent back: the subject ids
// (`math`, …), which the backend compares through `normal_subject_id`. Only
// what the checkbox reads is translated (#162 audit, 2026-10-11).
// `extraSubjects` are stored values outside the five, from older forms: they
// are shown so the teacher can see and remove them (#270).
export function TeacherSubjectSelector({
  selectedSubjects,
  extraSubjects = [],
  onChange,
}: {
  selectedSubjects: string[]
  extraSubjects?: string[]
  onChange: (subjects: string[]) => void
}) {
  const { t } = useTranslation('teacher')
  const options = [...TEACHER_SUBJECT_IDS, ...extraSubjects.filter((subject) => !(TEACHER_SUBJECT_IDS as readonly string[]).includes(subject))]
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((subject) => (
        <label key={subject} className="flex items-center gap-3 rounded-md border p-3 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border"
            checked={selectedSubjects.includes(subject)}
            onChange={(event) => {
              onChange(
                event.target.checked
                  ? [...selectedSubjects, subject]
                  : selectedSubjects.filter((item) => item !== subject),
              )
            }}
          />
          {teacherSubjectLabel(subject, t)}
        </label>
      ))}
    </div>
  )
}

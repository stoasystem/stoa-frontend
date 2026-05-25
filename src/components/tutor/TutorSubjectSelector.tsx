const subjects = ['Mathematics', 'Physics', 'Chemistry', 'English', 'Biology']

export function TutorSubjectSelector({
  selectedSubjects,
  onChange,
}: {
  selectedSubjects: string[]
  onChange: (subjects: string[]) => void
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {subjects.map((subject) => (
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
          {subject}
        </label>
      ))}
    </div>
  )
}

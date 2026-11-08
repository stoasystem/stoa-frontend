// A blank grade on the profile is no grade, and it is sent as none: the backend
// owns what an unknown grade means (stoasystem/stoa-backend#50). Falling back
// to a made-up "Grade 8" here hid from it that the grade was never given.
// Since stoa-backend#310 the profile holds a code (`grade_9_secondary`); it is
// sent as it is, and the backend reads it, or old free text it cannot read,
// the same way it reads the profile (`resolve_grade_code`).
export function conversationGrade(profileGrade: string | null | undefined): string {
  return profileGrade?.trim() ?? ''
}

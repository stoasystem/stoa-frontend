// A blank grade on the profile is no grade, and it is sent as none: the backend
// owns what an unknown grade means (stoasystem/stoa-backend#50). Falling back
// to a made-up "Grade 8" here hid from it that the grade was never given.
export function conversationGrade(profileGrade: string | null | undefined): string {
  return profileGrade?.trim() ?? ''
}

export type RegisterRole = 'student' | 'parent' | 'tutor'

export type StudentOnboardingProfile = {
  age: number
  school: string
  grade: string
  schoolSystem?: string
  subjectsNeedingHelp: string[]
  parentName: string
  parentEmail: string
}

export type ParentOnboardingProfile = {
  childName: string
  childAge?: number
  childGrade: string
  childSchool?: string
  subjectsNeedingHelp: string[]
}

export type TutorOnboardingProfile = {
  subjects: string[]
  educationBackground: string
  yearsOfExperience?: number
  introduction: string
  credentialFileIds: string[]
}

export type RegisterPayload = {
  role: RegisterRole
  name: string
  email: string
  password: string
  preferredLanguage?: string
  profile:
    | StudentOnboardingProfile
    | ParentOnboardingProfile
    | TutorOnboardingProfile
  acceptedTerms?: true
  termsVersion?: string
  acceptedAt?: string
  referralCode?: string
  utm?: {
    source?: string
    medium?: string
    campaign?: string
    content?: string
  } | null
}

export type TutorCredentialUpload = {
  id: string
  filename: string
  status: 'uploaded'
}

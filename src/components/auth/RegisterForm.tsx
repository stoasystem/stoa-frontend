import { type FormEvent, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { RegisterAccountStep } from '@/components/auth/RegisterAccountStep'
import { RegisterConfirmationStep } from '@/components/auth/RegisterConfirmationStep'
import { ParentProfileStep } from '@/components/auth/ParentProfileStep'
import { RegisterRoleStep } from '@/components/auth/RegisterRoleStep'
import { StudentProfileStep } from '@/components/auth/StudentProfileStep'
import { TutorProfileStep } from '@/components/auth/TutorProfileStep'
import { Button } from '@/components/ui/button'
import { useRegisterMutation } from '@/hooks/auth/useRegisterMutation'
import { getStoredReferralCode, getStoredUTM } from '@/lib/utm'
import type {
  ParentOnboardingProfile,
  RegisterPayload,
  RegisterRole,
  StudentOnboardingProfile,
  TutorCredentialUpload,
  TutorOnboardingProfile,
} from '@/types/onboarding'

type Step = 'role' | 'account' | 'profile' | 'done'

const initialStudentProfile: StudentOnboardingProfile = {
  age: 14,
  school: 'Kantonsschule Zürich Nord',
  grade: 'Grade 8',
  schoolSystem: 'Swiss Gymnasium',
  subjectsNeedingHelp: ['Mathematics', 'Physics'],
  parentName: '',
  parentEmail: '',
}

const initialParentProfile: ParentOnboardingProfile = {
  childName: '',
  childAge: 14,
  childGrade: 'Grade 8',
  childSchool: '',
  subjectsNeedingHelp: ['Mathematics'],
}

const initialTutorProfile: TutorOnboardingProfile = {
  subjects: ['Mathematics'],
  educationBackground: '',
  yearsOfExperience: 3,
  introduction: '',
  credentialFileIds: [],
}

function splitSubjects(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function getStepNumber(step: Step) {
  if (step === 'role') return 1
  if (step === 'account') return 2
  if (step === 'profile') return 3
  return 4
}

export function RegisterForm() {
  const [step, setStep] = useState<Step>('role')
  const [role, setRole] = useState<RegisterRole>('student')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [studentProfile, setStudentProfile] = useState<StudentOnboardingProfile>(initialStudentProfile)
  const [parentProfile, setParentProfile] = useState<ParentOnboardingProfile>(initialParentProfile)
  const [tutorProfile, setTutorProfile] = useState<TutorOnboardingProfile>(initialTutorProfile)
  const [studentSubjects, setStudentSubjects] = useState(initialStudentProfile.subjectsNeedingHelp.join(', '))
  const [parentSubjects, setParentSubjects] = useState(initialParentProfile.subjectsNeedingHelp.join(', '))
  const [tutorSubjects, setTutorSubjects] = useState(initialTutorProfile.subjects.join(', '))
  const [credentialFiles, setCredentialFiles] = useState<TutorCredentialUpload[]>([])
  const [error, setError] = useState<string | null>(null)
  const registerMutation = useRegisterMutation({ redirect: false })

  const stepNumber = getStepNumber(step)
  const canGoBack = step === 'account' || step === 'profile'

  const profile = useMemo(() => {
    if (role === 'student') {
      return {
        ...studentProfile,
        subjectsNeedingHelp: splitSubjects(studentSubjects),
      }
    }
    if (role === 'parent') {
      return {
        ...parentProfile,
        subjectsNeedingHelp: splitSubjects(parentSubjects),
      }
    }
    return {
      ...tutorProfile,
      subjects: splitSubjects(tutorSubjects),
      credentialFileIds: credentialFiles.map((file) => file.id),
    }
  }, [credentialFiles, parentProfile, parentSubjects, role, studentProfile, studentSubjects, tutorProfile, tutorSubjects])

  function validateCurrentStep() {
    if (step === 'account') {
      if (!name.trim() || !email.trim() || !password.trim()) return 'Name, email, and password are required.'
      if (password.length < 8) return 'Password must be at least 8 characters.'
      if (!acceptedTerms) return 'Please accept the privacy policy and terms.'
    }

    if (step === 'profile') {
      if (role === 'student') {
        if (!studentProfile.school.trim() || !studentProfile.grade.trim()) return 'School and grade are required.'
        if (!studentProfile.parentName.trim() || !studentProfile.parentEmail.trim()) return 'Parent name and email are required.'
        if (splitSubjects(studentSubjects).length === 0) return 'Add at least one subject.'
      }
      if (role === 'parent') {
        if (!parentProfile.childName.trim() || !parentProfile.childGrade.trim()) return 'Child name and grade are required.'
        if (splitSubjects(parentSubjects).length === 0) return 'Add at least one subject.'
      }
      if (role === 'tutor') {
        if (splitSubjects(tutorSubjects).length === 0) return 'Add at least one teaching subject.'
        if (!tutorProfile.educationBackground.trim()) return 'Education background is required.'
        if (!tutorProfile.introduction.trim()) return 'Short introduction is required.'
        if (credentialFiles.length === 0) return 'Upload at least one credential document.'
      }
    }

    return null
  }

  function handleNext() {
    const validationError = validateCurrentStep()
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    if (step === 'role') setStep('account')
    if (step === 'account') setStep('profile')
  }

  function handleBack() {
    setError(null)
    if (step === 'profile') setStep('account')
    if (step === 'account') setStep('role')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationError = validateCurrentStep()
    if (validationError) {
      setError(validationError)
      return
    }

    const payload: RegisterPayload = {
      role,
      name: name.trim(),
      email: email.trim(),
      password,
      profile,
      acceptedTerms: true,
      termsVersion: 'launch-draft-2026-05-25',
      acceptedAt: new Date().toISOString(),
      referralCode: getStoredReferralCode() ?? undefined,
      utm: getStoredUTM(),
    }

    setError(null)
    registerMutation.mutate(payload, {
      onSuccess: () => setStep('done'),
    })
  }

  if (step === 'done' && registerMutation.data) {
    return <RegisterConfirmationStep data={registerMutation.data} />
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>Step {stepNumber} of 4</span>
        <span className="capitalize">{role} onboarding</span>
      </div>

      {step === 'role' && <RegisterRoleStep selectedRole={role} onSelectRole={setRole} />}

      {step === 'account' && (
        <RegisterAccountStep
          name={name}
          email={email}
          password={password}
          acceptedTerms={acceptedTerms}
          onChange={(values) => {
            if (values.name !== undefined) setName(values.name)
            if (values.email !== undefined) setEmail(values.email)
            if (values.password !== undefined) setPassword(values.password)
            if (values.acceptedTerms !== undefined) setAcceptedTerms(values.acceptedTerms)
          }}
        />
      )}

      {step === 'profile' && role === 'student' && (
        <StudentProfileStep
          value={studentProfile}
          subjectText={studentSubjects}
          onChange={(values) => setStudentProfile((current) => ({ ...current, ...values }))}
          onSubjectTextChange={setStudentSubjects}
        />
      )}

      {step === 'profile' && role === 'parent' && (
        <ParentProfileStep
          value={parentProfile}
          subjectText={parentSubjects}
          onChange={(values) => setParentProfile((current) => ({ ...current, ...values }))}
          onSubjectTextChange={setParentSubjects}
        />
      )}

      {step === 'profile' && role === 'tutor' && (
        <TutorProfileStep
          value={tutorProfile}
          subjectText={tutorSubjects}
          uploadedFiles={credentialFiles}
          onChange={(values) => setTutorProfile((current) => ({ ...current, ...values }))}
          onSubjectTextChange={setTutorSubjects}
          onUploaded={(file) => {
            setCredentialFiles((current) => [...current, file])
            setError(null)
          }}
          onUploadError={setError}
        />
      )}

      {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      {registerMutation.isError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {registerMutation.error instanceof Error
            ? registerMutation.error.message
            : 'Registration failed.'}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        {canGoBack ? (
          <Button type="button" variant="outline" onClick={handleBack}>
            Back
          </Button>
        ) : (
          <Link className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline" to="/login">
            Already registered?
          </Link>
        )}
        {step === 'profile' ? (
          <Button type="submit" disabled={registerMutation.isPending}>
            {registerMutation.isPending ? 'Creating account...' : 'Create account'}
          </Button>
        ) : (
          <Button type="button" onClick={handleNext}>
            Continue
          </Button>
        )}
      </div>
    </form>
  )
}

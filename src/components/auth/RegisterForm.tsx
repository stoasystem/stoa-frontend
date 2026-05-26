import { type FormEvent, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RegisterAccountStep } from '@/components/auth/RegisterAccountStep'
import { RegisterConfirmationStep } from '@/components/auth/RegisterConfirmationStep'
import { ParentProfileStep } from '@/components/auth/ParentProfileStep'
import { RegisterRoleStep } from '@/components/auth/RegisterRoleStep'
import { StudentProfileStep } from '@/components/auth/StudentProfileStep'
import { TutorProfileStep } from '@/components/auth/TutorProfileStep'
import { Button } from '@/components/ui/button'
import { useRegisterMutation } from '@/hooks/auth/useRegisterMutation'
import { toUserFacingError } from '@/lib/userFacingText'
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
  const { t, i18n } = useTranslation(['auth', 'common', 'errors'])
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
      if (!name.trim() || !email.trim() || !password.trim()) return t('errors:required')
      if (password.length < 8) return t('errors:passwordTooShort')
      if (!acceptedTerms) return t('errors:acceptTerms')
    }

    if (step === 'profile') {
      if (role === 'student') {
        if (!studentProfile.school.trim() || !studentProfile.grade.trim()) return t('errors:schoolGradeRequired')
        if (!studentProfile.parentName.trim() || !studentProfile.parentEmail.trim()) return t('errors:parentRequired')
        if (splitSubjects(studentSubjects).length === 0) return t('errors:subjectRequired')
      }
      if (role === 'parent') {
        if (!parentProfile.childName.trim() || !parentProfile.childGrade.trim()) return t('errors:childRequired')
        if (splitSubjects(parentSubjects).length === 0) return t('errors:subjectRequired')
      }
      if (role === 'tutor') {
        if (splitSubjects(tutorSubjects).length === 0) return t('errors:teachingSubjectRequired')
        if (!tutorProfile.educationBackground.trim()) return t('errors:educationRequired')
        if (!tutorProfile.introduction.trim()) return t('errors:introductionRequired')
        if (credentialFiles.length === 0) return t('errors:credentialRequired')
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
    if (registerMutation.isPending) return
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
      preferredLanguage: i18n.resolvedLanguage ?? i18n.language,
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
        <span>{t('auth:register.step', { step: stepNumber })}</span>
        <span>{t('auth:register.onboarding', { role: t(`common:roles.${role}`) })}</span>
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

      {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{error}</p>}
      {registerMutation.isError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {toUserFacingError(registerMutation.error, t('auth:register.failed'))}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        {canGoBack ? (
          <Button type="button" variant="outline" onClick={handleBack}>
            {t('common:actions.back')}
          </Button>
        ) : (
          <Link className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline" to="/login">
            {t('auth:register.alreadyRegistered')}
          </Link>
        )}
        {step === 'profile' ? (
          <Button type="submit" disabled={registerMutation.isPending}>
            {registerMutation.isPending ? t('common:actions.creatingAccount') : t('common:actions.createAccount')}
          </Button>
        ) : (
          <Button type="button" onClick={handleNext}>
            {t('common:actions.continue')}
          </Button>
        )}
      </div>
    </form>
  )
}

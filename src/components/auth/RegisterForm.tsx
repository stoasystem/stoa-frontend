import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RegisterAccountStep } from '@/components/auth/RegisterAccountStep'
import { RegisterConfirmationStep } from '@/components/auth/RegisterConfirmationStep'
import { TeacherApplicationSubmitted } from '@/components/auth/TeacherApplicationSubmitted'
import { ParentProfileStep } from '@/components/auth/ParentProfileStep'
import { RegisterRoleStep } from '@/components/auth/RegisterRoleStep'
import { StudentProfileStep } from '@/components/auth/StudentProfileStep'
import { TutorProfileStep } from '@/components/auth/TutorProfileStep'
import { Button } from '@/components/ui/button'
import { useRegisterMutation } from '@/hooks/auth/useRegisterMutation'
import { useSubmitTeacherApplicationMutation } from '@/hooks/teacher/useTeacherApplication'
import { MAX_AGE, MIN_AGE, isAdultAge, isCompliantPassword, isValidAge, isValidEmail } from '@/lib/validation'
import { toUserFacingError } from '@/lib/userFacingText'
import { getStoredReferralCode, getStoredUTM } from '@/lib/utm'
import { buildTeacherStatement } from '@/services/teacher/teacherApplicationApi'
import { getInitialLanguage, isSupportedLanguage, type SupportedLanguage } from '@/i18n/languages'
import type {
  ParentOnboardingProfile,
  RegisterPayload,
  RegisterRole,
  StudentOnboardingProfile,
  TutorOnboardingProfile,
} from '@/types/onboarding'

export type RegisterStep = 'role' | 'account' | 'profile' | 'done'

type Step = RegisterStep

type FieldErrors = Partial<
  Record<
    | 'name'
    | 'email'
    | 'password'
    | 'acceptedTerms'
    | 'emailOwnershipConfirmed'
    | 'age'
    | 'school'
    | 'grade'
    | 'subjects'
    | 'parentName'
    | 'parentEmail'
    | 'childName'
    | 'childAge'
    | 'childGrade'
    | 'childSubjects'
    | 'teachingSubjects'
    | 'educationBackground'
    | 'introduction',
    string
  >
>

const initialStudentProfile: StudentOnboardingProfile = {
  age: 14,
  school: 'Kantonsschule Zürich Nord',
  grade: 'Grade 8',
  schoolSystem: 'Swiss Gymnasium',
  subjectsNeedingHelp: ['Mathematics', 'Physics'],
  preferredAnswerLanguage: 'en',
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

function getInitialRole(value: string | null): RegisterRole {
  if (value === 'parent') return 'parent'
  // `tutor` stays accepted so existing ?role=tutor links keep landing on the right step.
  if (value === 'teacher' || value === 'tutor') return 'teacher'
  return 'student'
}

export function RegisterForm({ onStepChange }: { onStepChange?: (step: RegisterStep, role: RegisterRole) => void } = {}) {
  const { t, i18n } = useTranslation(['auth', 'common', 'errors'])
  const currentLanguage = i18n.resolvedLanguage ?? i18n.language
  const initialAnswerLanguage: SupportedLanguage = isSupportedLanguage(currentLanguage)
    ? currentLanguage
    : getInitialLanguage()
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState<Step>('role')
  const [role, setRole] = useState<RegisterRole>(() => getInitialRole(searchParams.get('role')))
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [emailOwnershipConfirmed, setEmailOwnershipConfirmed] = useState(false)
  const [studentProfile, setStudentProfile] = useState<StudentOnboardingProfile>(() => ({
    ...initialStudentProfile,
    preferredAnswerLanguage: initialAnswerLanguage,
  }))
  const [parentProfile, setParentProfile] = useState<ParentOnboardingProfile>(initialParentProfile)
  const [tutorProfile, setTutorProfile] = useState<TutorOnboardingProfile>(initialTutorProfile)
  const [studentSubjects, setStudentSubjects] = useState(initialStudentProfile.subjectsNeedingHelp.join(', '))
  const [parentSubjects, setParentSubjects] = useState(initialParentProfile.subjectsNeedingHelp.join(', '))
  const [tutorSubjects, setTutorSubjects] = useState(initialTutorProfile.subjects.join(', '))
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const registerMutation = useRegisterMutation({ redirect: false })
  const teacherApplicationMutation = useSubmitTeacherApplicationMutation()

  const stepNumber = getStepNumber(step)
  const canGoBack = step === 'account' || step === 'profile'

  useEffect(() => {
    onStepChange?.(step, role)
  }, [onStepChange, role, step])

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
    }
  }, [parentProfile, parentSubjects, role, studentProfile, studentSubjects, tutorProfile, tutorSubjects])

  function validateCurrentStep(): FieldErrors {
    const errors: FieldErrors = {}

    if (step === 'account') {
      if (!name.trim()) errors.name = t('errors:nameRequired')
      if (!email.trim()) errors.email = t('errors:emailRequired')
      else if (!isValidEmail(email)) errors.email = t('errors:invalidEmail')
      if (role !== 'teacher') {
        if (!password.trim()) errors.password = t('errors:passwordRequired')
        else if (!isCompliantPassword(password)) errors.password = t('errors:passwordRequirements')
      }
      if (role === 'teacher' && !emailOwnershipConfirmed) {
        errors.emailOwnershipConfirmed = t('errors:confirmEmailOwnershipRequired')
      }
      if (!acceptedTerms) errors.acceptedTerms = t('errors:acceptTerms')
    }

    if (step === 'profile') {
      if (role === 'student') {
        if (!isValidAge(studentProfile.age)) errors.age = t('errors:ageInvalid', { min: MIN_AGE, max: MAX_AGE })
        if (!studentProfile.school.trim()) errors.school = t('errors:schoolRequired')
        if (!studentProfile.grade.trim()) errors.grade = t('errors:gradeRequired')
        if (!isAdultAge(studentProfile.age)) {
          if (!studentProfile.parentName.trim()) errors.parentName = t('errors:parentNameRequired')
          if (!studentProfile.parentEmail.trim()) errors.parentEmail = t('errors:parentEmailRequired')
        }
        if (studentProfile.parentEmail.trim() && !isValidEmail(studentProfile.parentEmail)) {
          errors.parentEmail = t('errors:invalidEmail')
        }
        if (splitSubjects(studentSubjects).length === 0) errors.subjects = t('errors:subjectRequired')
      }
      if (role === 'parent') {
        if (!parentProfile.childName.trim()) errors.childName = t('errors:childNameRequired')
        if (!parentProfile.childGrade.trim()) errors.childGrade = t('errors:childGradeRequired')
        if (!isValidAge(parentProfile.childAge)) errors.childAge = t('errors:ageInvalid', { min: MIN_AGE, max: MAX_AGE })
        if (splitSubjects(parentSubjects).length === 0) errors.childSubjects = t('errors:subjectRequired')
      }
      if (role === 'teacher') {
        if (splitSubjects(tutorSubjects).length === 0) errors.teachingSubjects = t('errors:teachingSubjectRequired')
        if (!tutorProfile.educationBackground.trim()) errors.educationBackground = t('errors:educationRequired')
        if (!tutorProfile.introduction.trim()) errors.introduction = t('errors:introductionRequired')
      }
    }

    return errors
  }

  function applyValidation() {
    const errors = validateCurrentStep()
    setFieldErrors(errors)
    const hasError = Object.keys(errors).length > 0
    setError(hasError ? t('errors:fixHighlightedFields') : null)
    return !hasError
  }

  function handleNext() {
    if (!applyValidation()) return
    if (step === 'role') setStep('account')
    if (step === 'account') setStep('profile')
  }

  function handleBack() {
    setError(null)
    setFieldErrors({})
    if (step === 'profile') setStep('account')
    if (step === 'account') setStep('role')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (registerMutation.isPending || teacherApplicationMutation.isPending) return
    if (!applyValidation()) return

    if (role === 'teacher') {
      teacherApplicationMutation.mutate(
        {
          email: email.trim(),
          emailVerified: true,
          fullName: name.trim(),
          subjects: splitSubjects(tutorSubjects),
          statement: buildTeacherStatement({
            introduction: tutorProfile.introduction,
            educationBackground: tutorProfile.educationBackground,
            yearsOfExperience: tutorProfile.yearsOfExperience,
          }),
        },
        { onSuccess: () => setStep('done') },
      )
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

    registerMutation.mutate(payload, {
      onSuccess: () => setStep('done'),
    })
  }

  // The server marks the issues a person should read with a stable code; the
  // English prose beside it is only the fallback.
  const backendMessage = (code: string) =>
    t(`errors:backend.${code}`, { defaultValue: '' })

  const registrationError = registerMutation.isError
    ? toUserFacingError(registerMutation.error, t('auth:register.failed'), backendMessage)
    : teacherApplicationMutation.isError
      ? toUserFacingError(teacherApplicationMutation.error, t('auth:register.applicationFailed'))
      : null
  const registrationErrorMessage =
    registrationError === 'Password does not meet requirements' ? t('errors:passwordRequirements') : registrationError
  const submitting = registerMutation.isPending || teacherApplicationMutation.isPending

  if (step === 'done' && teacherApplicationMutation.data) {
    return <TeacherApplicationSubmitted application={teacherApplicationMutation.data} />
  }

  if (step === 'done' && registerMutation.data) {
    return <RegisterConfirmationStep data={registerMutation.data} />
  }

  return (
    // Same reason as the sign-in form: the browser's required-field prompts
    // follow its own language, so the wizard's per-field checks answer instead.
    <form className="space-y-6" noValidate onSubmit={handleSubmit}>
      <p className="text-sm text-muted-foreground">{t('auth:register.step', { step: stepNumber })}</p>

      {step === 'role' && <RegisterRoleStep selectedRole={role} onSelectRole={setRole} />}

      {step === 'account' && (
        <RegisterAccountStep
          name={name}
          email={email}
          password={password}
          acceptedTerms={acceptedTerms}
          errors={fieldErrors}
          hidePassword={role === 'teacher'}
          emailOwnershipConfirmed={role === 'teacher' ? emailOwnershipConfirmed : undefined}
          onChange={(values) => {
            if (values.name !== undefined) setName(values.name)
            if (values.email !== undefined) setEmail(values.email)
            if (values.password !== undefined) setPassword(values.password)
            if (values.acceptedTerms !== undefined) setAcceptedTerms(values.acceptedTerms)
            if (values.emailOwnershipConfirmed !== undefined) setEmailOwnershipConfirmed(values.emailOwnershipConfirmed)
          }}
        />
      )}

      {step === 'profile' && role === 'student' && (
        <StudentProfileStep
          value={studentProfile}
          subjectText={studentSubjects}
          errors={fieldErrors}
          onChange={(values) => setStudentProfile((current) => ({ ...current, ...values }))}
          onSubjectTextChange={setStudentSubjects}
        />
      )}

      {step === 'profile' && role === 'parent' && (
        <ParentProfileStep
          value={parentProfile}
          subjectText={parentSubjects}
          errors={{
            childName: fieldErrors.childName,
            childAge: fieldErrors.childAge,
            childGrade: fieldErrors.childGrade,
            subjects: fieldErrors.childSubjects,
          }}
          onChange={(values) => setParentProfile((current) => ({ ...current, ...values }))}
          onSubjectTextChange={setParentSubjects}
        />
      )}

      {step === 'profile' && role === 'teacher' && (
        <TutorProfileStep
          value={tutorProfile}
          subjectText={tutorSubjects}
          errors={{
            subjects: fieldErrors.teachingSubjects,
            educationBackground: fieldErrors.educationBackground,
            introduction: fieldErrors.introduction,
          }}
          onChange={(values) => setTutorProfile((current) => ({ ...current, ...values }))}
          onSubjectTextChange={setTutorSubjects}
        />
      )}

      {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{error}</p>}
      {registrationErrorMessage && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {registrationErrorMessage}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        {canGoBack ? (
          <Button type="button" variant="outline" onClick={handleBack}>
            {t('common:actions.back')}
          </Button>
        ) : (
          <Link
            className="self-center text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary/80"
            to="/login"
          >
            {t('auth:register.alreadyRegistered')}
          </Link>
        )}
        {step === 'profile' ? (
          <Button type="submit" disabled={submitting}>
            {submitting
              ? t('common:actions.creatingAccount')
              : role === 'teacher'
                ? t('auth:register.applyCta')
                : t('common:actions.createAccount')}
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

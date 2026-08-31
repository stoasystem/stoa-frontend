import { describe, expect, it } from 'vitest'
import { teacherHelpErrorKey } from '@/lib/teacherHelpErrors'
import { ApiError } from '@/services/api/httpClient'

describe('teacherHelpErrorKey', () => {
  it('never lets the admission wording reach the student', () => {
    const error = new ApiError('Teacher support admission is safely recoverable.', {
      status: 503,
      code: 'teacher_support_admission_recoverable',
    })

    expect(teacherHelpErrorKey(error)).toBe('teacher.errors.temporary')
  })

  it('names the plan when tutor support is not included', () => {
    const error = new ApiError('Teacher support is not included in the active plan.', {
      status: 403,
      code: 'teacher_support_not_included',
    })

    expect(teacherHelpErrorKey(error)).toBe('teacher.errors.planDenied')
  })

  it('names the weekly allowance when it is used up', () => {
    const error = new ApiError('The weekly teacher-support allowance is used.', {
      status: 429,
      code: 'teacher_support_allowance_exhausted',
    })

    expect(teacherHelpErrorKey(error)).toBe('teacher.errors.allowanceExhausted')
  })

  it('falls back to the status when the server sends a bare string detail', () => {
    const error = new ApiError('Teacher-support case identity conflicts with prior admission', {
      status: 409,
    })

    expect(teacherHelpErrorKey(error)).toBe('teacher.errors.alreadyOpen')
  })

  it('uses the generic retry for anything it does not recognise', () => {
    expect(teacherHelpErrorKey(new Error('boom'))).toBe('teacher.errors.generic')
    expect(teacherHelpErrorKey(new ApiError('nope', { status: 418 }))).toBe(
      'teacher.errors.generic',
    )
  })
})

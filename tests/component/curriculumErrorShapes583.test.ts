/**
 * The curriculum console reads a refusal's code from either body shape (#583).
 *
 * Some curriculum endpoints answer with a bare string, `{detail: "stale_pointer"}`;
 * the backend is moving every error body to `{detail: {code, message,
 * correlationId, ...}}` (stoa-backend#211, the curriculum part in #277). Until
 * that ships, and after, the console has to read both, and say the same thing
 * for the same code whichever shape it came in. Without the object shape the
 * phrase fell to the status copy; without the bare one, to the same.
 *
 * Both go through the real client (msw), not a hand-built `ApiError`, so a
 * change in how the client reads a body breaks this test too.
 */
import { http, HttpResponse, type JsonBodyType } from 'msw'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import enAdmin from '@/i18n/locales/en/admin.json'
import { curriculumErrorCode, curriculumErrorMessage } from '@/pages/admin/curriculumErrorMessage'
import { publishCurriculumVersion } from '@/services/admin/curriculumApi'
import { ApiError, SESSION_UNREACHABLE } from '@/services/api/httpClient'
import { TOKEN_KEY, useAuthStore } from '@/store/authStore'
import { mswServer } from '../mswServer'

const API = 'https://api.test'
const LANGUAGES = ['de', 'en', 'fr', 'it']
const ENGLISH_MESSAGE = 'Someone else published this lesson first.'

/** Every code the console has its own phrase for, except the one the client makes up itself. */
const BACKEND_CODES = Object.keys(enAdmin.curriculum.errors.code).filter((code) => code !== SESSION_UNREACHABLE)

const SHAPES = {
  'a bare string detail': (code: string) => ({ detail: code }),
  'a {detail: {code, message}} body': (code: string) => ({
    detail: { code, message: ENGLISH_MESSAGE, correlationId: 'corr-583', retryable: false },
  }),
}

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'bypass' }))
afterAll(async () => {
  mswServer.close()
  await i18n.changeLanguage('en')
})
beforeEach(() => {
  sessionStorage.setItem(TOKEN_KEY, 'access')
  useAuthStore.setState({ user: null, accessToken: 'access', isAuthenticated: true })
})
afterEach(() => {
  mswServer.resetHandlers()
  sessionStorage.clear()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})

/** The error a publish fails with when the backend answers `status` with `body`. */
async function refusal(body: JsonBodyType, status = 409): Promise<ApiError> {
  mswServer.use(
    http.post(`${API}/admin/curriculum/lessons/:id/publish`, () => HttpResponse.json(body, { status })),
  )
  try {
    await publishCurriculumVersion({ publicLessonId: 'lesson-1', versionId: 'v2', reason: 'ship' })
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError)
    return error as ApiError
  }
  throw new Error('expected the publish to fail')
}

const tIn = (language: string) => i18n.getFixedT(language, 'admin')

describe.each(Object.entries(SHAPES))('a curriculum refusal in %s', (_shape, bodyFor) => {
  it.each(BACKEND_CODES)('reads `%s` as its code and says its own phrase in every language', async (code) => {
    const error = await refusal(bodyFor(code))

    expect(curriculumErrorCode(error)).toBe(code)
    for (const language of LANGUAGES) {
      const t = tIn(language)
      expect(curriculumErrorMessage(error, t)).toBe(t(`curriculum.errors.code.${code}`))
    }
  })

  it('never shows the backend text or the raw code', async () => {
    const error = await refusal(bodyFor('stale_pointer'))

    for (const language of LANGUAGES) {
      const message = curriculumErrorMessage(error, tIn(language))
      expect(message).not.toContain(ENGLISH_MESSAGE)
      expect(message).not.toContain('stale_pointer')
    }
  })

  it('falls back on the status for a code it has no phrase for', async () => {
    const error = await refusal(bodyFor('some_new_rule'), 403)

    expect(curriculumErrorCode(error)).toBe('some_new_rule')
    expect(curriculumErrorMessage(error, tIn('en'))).toBe(tIn('en')('curriculum.errors.status.forbidden'))
  })
})

describe('the two shapes side by side', () => {
  it.each(BACKEND_CODES)('`%s` reads the same, phrase for phrase, in either shape', async (code) => {
    const bare = await refusal(SHAPES['a bare string detail'](code))
    const structured = await refusal(SHAPES['a {detail: {code, message}} body'](code))

    expect(curriculumErrorCode(structured)).toBe(curriculumErrorCode(bare))
    for (const language of LANGUAGES) {
      expect(curriculumErrorMessage(structured, tIn(language))).toBe(curriculumErrorMessage(bare, tIn(language)))
    }
  })

  it('does not take an English sentence in a bare string detail for a code', async () => {
    const error = await refusal({ detail: ENGLISH_MESSAGE }, 409)

    expect(curriculumErrorCode(error)).toBeUndefined()
    expect(curriculumErrorMessage(error, tIn('en'))).toBe(tIn('en')('curriculum.errors.status.conflict'))
  })
})

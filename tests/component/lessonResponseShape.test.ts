import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import type { PracticeChallenge, PracticeLesson } from '@/types/practice'

/*
 * What `GET /practice/lessons/:id` really sends, recorded from production on
 * 2026-10-07 and reduced to field names.
 *
 * `PracticeChallenge` declared `id`; the backend sends `challengeId`. Nothing
 * caught it: the fixtures in every other test used `id` too, so the type, the
 * code and the fixtures agreed with each other and disagreed with the server.
 * Every answer went to `/practice/challenges/undefined/answer` and came back
 * 404 — on production, no student could answer a single question.
 *
 * This is a stand-in. The real fix is a `response_model` on that route so the
 * OpenAPI document carries the shape and the dist e2e checks mocks against it
 * (the schema is `{}` today). Until then, re-record this file when the route
 * changes and let the mismatch show up here instead of in production.
 *
 * What catches what, measured by putting `id` back on the type: `npm run
 * typecheck` goes red (the `keyof` below stops compiling, and so do the
 * fourteen call sites). These runtime assertions stay green, because they
 * read the recording and the recording is right either way. So the guard is
 * the compiler; this file is what keeps the recording honest and says why.
 */
const recorded = JSON.parse(
  readFileSync(path.join(process.cwd(), 'tests/fixtures/lesson-response-shape.json'), 'utf8'),
) as { route: string; shape: Record<string, unknown> }

describe('the lesson response the frontend is typed against', () => {
  it('names the challenge identifier the way the backend does', () => {
    const challenge = (recorded.shape.challenges as Record<string, unknown>[])[0]

    expect(Object.keys(challenge)).toContain('challengeId')
    expect(Object.keys(challenge)).not.toContain('id')
  })

  it('types a challenge by a field the server actually sends', () => {
    const challenge = (recorded.shape.challenges as Record<string, unknown>[])[0]
    // Fails to compile if `challengeId` ever leaves the type.
    const id: keyof PracticeChallenge = 'challengeId'

    expect(Object.keys(challenge)).toContain(id)
  })

  it('still carries the fields the stage reads off a challenge', () => {
    const challenge = (recorded.shape.challenges as Record<string, unknown>[])[0]

    for (const field of ['prompt', 'type', 'options', 'lessonId'] as const) {
      expect(Object.keys(challenge)).toContain(field)
    }
  })

  it('carries the lesson fields the chapter reads', () => {
    const lesson: (keyof PracticeLesson)[] = ['id', 'title', 'challenges']

    for (const field of lesson) expect(Object.keys(recorded.shape)).toContain(field)
  })
})

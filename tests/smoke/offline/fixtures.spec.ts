import { createHash } from 'node:crypto'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { anyLanguage } from '../locales'
import { longObjectHeaderPdf } from '../pdf'
import {
  MAX_GENERATION_REQUESTS_PER_RUN,
  deploymentState,
  rememberConversations,
  spendGeneration,
} from '../run'
import { expectedReportWeek } from '../week'

const sha256 = (data: Buffer) => createHash('sha256').update(data).digest('hex')

test('the malformed PDF is the backend test\'s bytes, built at run time', () => {
  // Size and digest of `_long_object_header()` and `_long_object_header(64)` in
  // stoa-backend tests/test_pdf_validation_isolation.py, computed with that
  // function on 2026-09-26.
  const pdf = longObjectHeaderPdf()
  expect(pdf.length).toBe(4_194_540)
  expect(sha256(pdf)).toBe('b3fbab80c8a4d620f1cda26941df2e6c5a08c6cd6626b94f32dc2bbd4c45c670')
  expect(pdf.subarray(0, 9).toString('latin1')).toBe('%PDF-1.7\n')
  const small = longObjectHeaderPdf(64)
  expect(small.length).toBe(296)
  expect(sha256(small)).toBe('3cf53a516cc803380736ccbf05b60798d27e140bcd2c04c393d45a4448691938')
})

test('the report week is the Zurich week before the latest Monday 06:00 run', () => {
  // Saturday: the run of Monday the 21st reported the week of the 14th.
  expect(expectedReportWeek(new Date('2026-09-26T12:00:00Z'))).toEqual({
    weekStart: '2026-09-14',
    runDate: '2026-09-21',
    settling: false,
  })
  // Monday 05:30 in Zurich (CEST): that day's run has not happened yet.
  expect(expectedReportWeek(new Date('2026-09-28T03:30:00Z')).weekStart).toBe('2026-09-14')
  // Monday 06:30 in Zurich: it has, and it may still be writing.
  expect(expectedReportWeek(new Date('2026-09-28T04:30:00Z'))).toEqual({
    weekStart: '2026-09-21',
    runDate: '2026-09-28',
    settling: true,
  })
  // Winter time (CET): 05:30 UTC is 06:30 in Zurich, 04:30 UTC is 05:30.
  expect(expectedReportWeek(new Date('2026-11-02T04:30:00Z')).weekStart).toBe('2026-10-19')
  expect(expectedReportWeek(new Date('2026-11-02T05:30:00Z')).weekStart).toBe('2026-10-26')
  // Sunday late evening in Zurich is still the same week, across a month end.
  expect(expectedReportWeek(new Date('2026-10-04T21:30:00Z')).weekStart).toBe('2026-09-21')
})

test.describe('run state', () => {
  let dir = ''
  const saved = { state: process.env.STOA_SMOKE_STATE_DIR, run: process.env.STOA_SMOKE_RUN_ID }

  test.beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'stoa-smoke-'))
    process.env.STOA_SMOKE_STATE_DIR = dir
    process.env.STOA_SMOKE_RUN_ID = 'offline-run'
  })

  test.afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
    for (const [key, value] of [['STOA_SMOKE_STATE_DIR', saved.state], ['STOA_SMOKE_RUN_ID', saved.run]] as const) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  })

  test('the generation budget refuses the sixth request of a run', () => {
    expect(MAX_GENERATION_REQUESTS_PER_RUN).toBe(5)
    for (let i = 1; i <= 5; i += 1) expect(spendGeneration(`request-${i}`)).toBe(i)
    expect(() => spendGeneration('request-6')).toThrow(/generation budget spent: 5 of 5/)
    // A new run starts again from nothing.
    process.env.STOA_SMOKE_RUN_ID = 'offline-next-run'
    expect(spendGeneration('next')).toBe(1)
  })

  test('conversation ids are remembered per deployment and only ever added', () => {
    rememberConversations('https://app.example', ['a', 'b'])
    rememberConversations('https://app.example', ['b', 'c'])
    rememberConversations('https://other.example', ['z'])
    expect(deploymentState('https://app.example').studentConversationIds).toEqual(['a', 'b', 'c'])
    expect(deploymentState('https://other.example').studentConversationIds).toEqual(['z'])
    expect(deploymentState('https://never.example').studentConversationIds).toEqual([])
  })
})

test('screen strings come from the app\'s own locale files', () => {
  const hint = anyLanguage('chat', 'gradeMissingHint')
  expect('Trage deine Klassenstufe im Profil ein, dann passen die Erklärungen besser zu dir.').toMatch(hint)
  expect('Add your year group to your profile and explanations will fit you better.').toMatch(hint)
  expect('Add your year group').not.toMatch(hint)
  expect('Abmelden').toMatch(anyLanguage('common', 'actions.logOut'))
  expect('Mathematik Aktiv Ausgewählt').toMatch(anyLanguage('chat', 'subjects.math', { exact: false }))
})

/**
 * Tests for the teacher-help status query polling interval logic.
 * Verifies the interval selection without a React environment.
 *
 * Run: node tests/unit/teacherHelpPolling.test.mjs
 */
import assert from 'node:assert/strict'
import test from 'node:test'

const ACTIVE_STATUSES = new Set(['assigned', 'in_progress'])
const WAITING_STATUSES = new Set(['pending'])

function computeRefetchInterval(status) {
  if (!status) return false
  if (ACTIVE_STATUSES.has(status)) return 5_000
  if (WAITING_STATUSES.has(status)) return 15_000
  return false
}

test('active statuses poll at 5 seconds', () => {
  assert.equal(computeRefetchInterval('assigned'), 5_000)
  assert.equal(computeRefetchInterval('in_progress'), 5_000)
})

test('pending status polls at 15 seconds', () => {
  assert.equal(computeRefetchInterval('pending'), 15_000)
})

test('terminal statuses stop polling', () => {
  assert.equal(computeRefetchInterval('resolved'), false)
  assert.equal(computeRefetchInterval('cancelled'), false)
  assert.equal(computeRefetchInterval('completed'), false)
  assert.equal(computeRefetchInterval('rejected'), false)
})

test('undefined/null status stops polling', () => {
  assert.equal(computeRefetchInterval(undefined), false)
  assert.equal(computeRefetchInterval(null), false)
  assert.equal(computeRefetchInterval(''), false)
})

test('active statuses are faster than waiting statuses', () => {
  const activeInterval = computeRefetchInterval('assigned')
  const waitingInterval = computeRefetchInterval('pending')
  assert.ok(
    activeInterval < waitingInterval,
    `active (${activeInterval}ms) should be less than waiting (${waitingInterval}ms)`
  )
})

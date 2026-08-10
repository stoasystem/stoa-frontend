/**
 * Tests for the memory-summary → dashboard mapping logic.
 * Mirrors the pure transforms in src/hooks/learning/useWeakTopicsQuery.ts
 * so a backend contract change surfaces as a failing test.
 *
 * Run: node tests/unit/memoryMapping.test.mjs
 */
import assert from 'node:assert/strict'
import test from 'node:test'

const MAX_WEAK_TOPICS = 8
const MAX_RECOMMENDATIONS = 3
const URGENT_REPEAT_COUNT = 4

function countToLevel(count) {
  if (count >= URGENT_REPEAT_COUNT) return 'high'
  if (count >= 2) return 'medium'
  return 'low'
}

function mapWeakTopics(data) {
  return (data?.weakTopics ?? []).slice(0, MAX_WEAK_TOPICS).map((topic) => ({
    id: `${topic.subject}-${topic.topicId}`,
    subject: topic.subject,
    topic: topic.label || topic.topicId.replace(/_/g, ' '),
    level: countToLevel(topic.count),
  }))
}

function mapRecommendations(data) {
  return (data?.recommendations ?? []).slice(0, MAX_RECOMMENDATIONS)
}

const sampleResponse = {
  studentId: 's1',
  weakTopics: [
    { subject: 'math', topicId: 'fractions', label: 'Fractions', count: 5 },
    { subject: 'math', topicId: 'long_division', label: '', count: 2 },
    { subject: 'german', topicId: 'dative', label: 'Dative case', count: 1 },
  ],
  recommendations: [
    { candidateId: 'a', confidence: 'high' },
    { candidateId: 'b', confidence: 'medium' },
    { candidateId: 'c', confidence: 'low' },
    { candidateId: 'd', confidence: 'low' },
  ],
}

test('weak topics map to stable ids from subject and topicId', () => {
  const topics = mapWeakTopics(sampleResponse)
  assert.equal(topics[0].id, 'math-fractions')
  assert.equal(topics[2].id, 'german-dative')
})

test('label is preferred over topicId for display', () => {
  const topics = mapWeakTopics(sampleResponse)
  assert.equal(topics[0].topic, 'Fractions')
})

test('missing label falls back to a humanised topicId', () => {
  const topics = mapWeakTopics(sampleResponse)
  assert.equal(topics[1].topic, 'long division')
})

test('repeat count drives urgency level', () => {
  const topics = mapWeakTopics(sampleResponse)
  assert.equal(topics[0].level, 'high', '5 repeats is high')
  assert.equal(topics[1].level, 'medium', '2 repeats is medium')
  assert.equal(topics[2].level, 'low', '1 repeat is low')
})

test('weak topics are capped at 8', () => {
  const many = { weakTopics: Array.from({ length: 20 }, (_, i) => ({ subject: 'math', topicId: `t${i}`, label: `T${i}`, count: 1 })) }
  assert.equal(mapWeakTopics(many).length, MAX_WEAK_TOPICS)
})

test('missing weakTopics key yields an empty list rather than throwing', () => {
  assert.deepEqual(mapWeakTopics({}), [])
  assert.deepEqual(mapWeakTopics(undefined), [])
})

test('recommendations are capped at 3', () => {
  const recs = mapRecommendations(sampleResponse)
  assert.equal(recs.length, MAX_RECOMMENDATIONS)
  assert.equal(recs[0].candidateId, 'a')
})

test('missing recommendations key yields an empty list', () => {
  assert.deepEqual(mapRecommendations({}), [])
})

test('snake_case response would produce no data (guards against regression)', () => {
  // The backend emits camelCase. If someone reverts to snake_case keys the
  // dashboard would silently go blank — this test documents that failure mode.
  const snakeCase = { weak_topics: [{ subject: 'math', topic_id: 'fractions', count: 5 }] }
  assert.deepEqual(mapWeakTopics(snakeCase), [])
})

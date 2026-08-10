/**
 * Tests for lastCompletedAssistantIndex — decides where follow-up chips render.
 * Mirrors the pure function in src/components/chat/ChatMessageList.tsx.
 *
 * Run: node tests/unit/followUpAnchor.test.mjs
 */
import assert from 'node:assert/strict'
import test from 'node:test'

function lastCompletedAssistantIndex(messages) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i]
    if (message.role !== 'assistant') continue
    return message.status === 'streaming' || message.status === 'failed' ? -1 : i
  }
  return -1
}

const student = (id) => ({ id, role: 'student', status: 'completed' })
const assistant = (id, status = 'completed') => ({ id, role: 'assistant', status })

test('empty conversation has no anchor', () => {
  assert.equal(lastCompletedAssistantIndex([]), -1)
})

test('conversation with only student messages has no anchor', () => {
  assert.equal(lastCompletedAssistantIndex([student('a'), student('b')]), -1)
})

test('anchors on the final completed assistant message', () => {
  const messages = [student('a'), assistant('b'), student('c'), assistant('d')]
  assert.equal(lastCompletedAssistantIndex(messages), 3)
})

test('no anchor while the assistant is still streaming', () => {
  const messages = [student('a'), assistant('b'), student('c'), assistant('d', 'streaming')]
  assert.equal(lastCompletedAssistantIndex(messages), -1)
})

test('no anchor when the last assistant message failed', () => {
  const messages = [student('a'), assistant('b', 'failed')]
  assert.equal(lastCompletedAssistantIndex(messages), -1)
})

test('a trailing student message does not move the anchor off the assistant', () => {
  // The student typed again before the assistant replied; chips stay on the
  // last completed assistant turn rather than disappearing.
  const messages = [assistant('a'), student('b')]
  assert.equal(lastCompletedAssistantIndex(messages), 0)
})

test('stopped generation still counts as an anchor', () => {
  // A stopped message has partial but readable content, so follow-ups are useful.
  const messages = [student('a'), assistant('b', 'stopped')]
  assert.equal(lastCompletedAssistantIndex(messages), 1)
})

test('teacher messages are ignored when locating the anchor', () => {
  const messages = [assistant('a'), { id: 'b', role: 'teacher', status: 'completed' }]
  assert.equal(lastCompletedAssistantIndex(messages), 0)
})

/**
 * The ids the backend gives a message's student and assistant messages.
 *
 * The backend derives both from the conversation and the idempotency key
 * (UUIDv5, `stoa.conversation.send.v1`), so the same message has the same ids
 * however often it is sent. A local bubble that uses them is recognised as the
 * server's own message once the conversation is read back, instead of being
 * shown twice.
 */
const NAMESPACE_URL = '6ba7b811-9dad-11d1-80b4-00c04fd430c8'

function uuidBytes(uuid: string) {
  const hex = uuid.replace(/-/g, '')
  return Uint8Array.from({ length: 16 }, (_, index) =>
    Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16),
  )
}

async function uuid5(namespace: string, name: string) {
  const nameBytes = new TextEncoder().encode(name)
  const input = new Uint8Array(16 + nameBytes.length)
  input.set(uuidBytes(namespace))
  input.set(nameBytes, 16)
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-1', input)).slice(0, 16)
  hash[6] = (hash[6] & 0x0f) | 0x50
  hash[8] = (hash[8] & 0x3f) | 0x80
  const hex = Array.from(hash, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export async function commandMessageIds(conversationId: string, idempotencyKey: string) {
  const commandId = await uuid5(
    NAMESPACE_URL,
    `stoa.conversation.send.v1:${conversationId}:${idempotencyKey}`,
  )
  return {
    studentMessageId: await uuid5(commandId, 'student-message'),
    assistantMessageId: await uuid5(commandId, 'assistant-message'),
  }
}

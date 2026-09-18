const internalTerms = [
  /\bapi\b/gi,
  /backend/gi,
  /codex/gi,
  /contract/gi,
  /mock/gi,
  /demo/gi,
  /test account/gi,
  /local environment/gi,
  /provider/gi,
  /model/gi,
  /endpoint/gi,
  /exception/gi,
  /stack trace/gi,
  /traceback/gi,
]

const statusOnlyMessage = /^request failed with status code \d+$/i

function fieldLabel(loc: unknown): string {
  if (!Array.isArray(loc)) return ''
  const segments = loc.filter((part) => typeof part === 'string' && part !== 'body') as string[]
  if (segments.length === 0) return ''
  const name = segments[segments.length - 1]
  return name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, (char) => char.toUpperCase())
}

/**
 * Translate a validation issue the server marked with a code.
 *
 * The prose the server sends is English. Issues a person is meant to read
 * carry a stable `code` beside it, so those are looked up instead of being
 * shown as they arrived.
 */
function translatedIssue(issue: object, translate?: BackendMessageTranslator) {
  if (!translate) return ''
  const code = 'code' in issue ? String((issue as { code?: unknown }).code ?? '') : ''
  return code ? translate(code) : ''
}

/** FastAPI returns 422 `detail` as a list of issues, so turn it into one readable sentence. */
function fromValidationDetail(detail: unknown, translate?: BackendMessageTranslator) {
  if (!Array.isArray(detail)) return ''
  const sentences: string[] = []
  for (const issue of detail) {
    if (!issue || typeof issue !== 'object') continue
    const translated = translatedIssue(issue, translate)
    if (translated) {
      if (!sentences.includes(translated)) sentences.push(translated)
      continue
    }
    const raw = 'msg' in issue ? String((issue as { msg?: unknown }).msg ?? '') : ''
    const text = raw.replace(/^(value error|assertion failed|type error),\s*/i, '').trim()
    if (!text) continue
    const label = fieldLabel((issue as { loc?: unknown }).loc)
    const sentence = label && !text.toLowerCase().startsWith(label.toLowerCase()) ? `${label}: ${text}` : text
    if (!sentences.includes(sentence)) sentences.push(sentence)
  }
  return sentences.join(' ')
}

function isSafeMessage(message: string) {
  const exposesInternalTerm = internalTerms.some((term) => {
    term.lastIndex = 0
    return term.test(message)
  })
  return !exposesInternalTerm && !message.includes('http://') && !message.includes('https://')
}

/** Turns a server error code into a sentence in the reader's language, or '' when unknown. */
export type BackendMessageTranslator = (code: string) => string

export function toUserFacingError(
  error: unknown,
  fallback = 'We could not complete this action right now. Please try again.',
  translate?: BackendMessageTranslator,
) {
  const detail = error && typeof error === 'object' && 'detail' in error ? (error as { detail?: unknown }).detail : undefined
  const detailMessage = fromValidationDetail(detail, translate)
  if (detailMessage && isSafeMessage(detailMessage)) return detailMessage

  const message = error instanceof Error ? error.message : ''
  if (!message || statusOnlyMessage.test(message)) return fallback

  if (!isSafeMessage(message)) return fallback

  return message
}

import i18n from 'i18next'

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

/**
 * What the browser or axios says when the request never got an answer. It is
 * the transport talking, in English, under every interface language: "Network
 * Error", "Failed to fetch" (Chrome), "Load failed" (Safari), "NetworkError
 * when attempting to fetch resource." (Firefox), an axios timeout.
 */
const transportMessages = [
  /^network ?error\b/i,
  /^failed to fetch$/i,
  /^load failed$/i,
  /^timeout of \d+ms exceeded$/i,
  /^request aborted$/i,
]

/**
 * Whether the interface is in English. A message that arrives as prose —
 * the server's sentence, the browser's — is English, so it is only shown to a
 * reader of English; anyone else gets the caller's translated fallback (#265).
 * With no language set (i18next not started) it is read as English, as before.
 */
export function readsEnglish() {
  const language = i18n.resolvedLanguage ?? i18n.language
  return !language || language.toLowerCase().startsWith('en')
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

/**
 * FastAPI returns 422 `detail` as a list of issues; keep only the ones written
 * for a reader.
 *
 * An issue the server means a person to act on carries a stable `code`, and
 * that code has a phrase in all four languages. Everything else in that list is
 * the validator talking to whoever wrote the request: `loc` names a parameter
 * and `msg` is the framework's own English — "Field required", "Input should be
 * a valid integer". The teacher application queue printed exactly that,
 * `Application_id: Field required`, in red where a reviewer expected a sentence
 * about applications. Those never become user text; the caller's fallback does.
 */
function fromValidationDetail(detail: unknown, translate?: BackendMessageTranslator) {
  if (!Array.isArray(detail)) return ''
  const sentences: string[] = []
  for (const issue of detail) {
    if (!issue || typeof issue !== 'object') continue
    const translated = translatedIssue(issue, translate)
    if (translated && !sentences.includes(translated)) sentences.push(translated)
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

/**
 * One sentence for a failed action, in the reader's language.
 *
 * In order: issues the server marked with a code, the error's own code, both
 * through `translate`; then the error's message, but only in an English
 * interface and only when it is neither the transport's nor internal; and
 * otherwise `fallback`, which callers pass already translated.
 */
export function toUserFacingError(
  error: unknown,
  fallback = 'We could not complete this action right now. Please try again.',
  translate?: BackendMessageTranslator,
) {
  const detail = error && typeof error === 'object' && 'detail' in error ? (error as { detail?: unknown }).detail : undefined
  const detailMessage = fromValidationDetail(detail, translate)
  if (detailMessage && isSafeMessage(detailMessage)) return detailMessage

  const code = error && typeof error === 'object' && 'code' in error ? (error as { code?: unknown }).code : undefined
  const codeMessage = translate && typeof code === 'string' && code ? translate(code) : ''
  if (codeMessage) return codeMessage

  const message = error instanceof Error ? error.message.trim() : ''
  if (!message || statusOnlyMessage.test(message)) return fallback
  if (transportMessages.some((pattern) => pattern.test(message))) return fallback
  if (!readsEnglish()) return fallback

  if (!isSafeMessage(message)) return fallback

  return message
}

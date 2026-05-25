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

export function toUserFacingError(error: unknown, fallback = 'We could not complete this action right now. Please try again.') {
  const message = error instanceof Error ? error.message : ''
  if (!message) return fallback

  const exposesInternalTerm = internalTerms.some((term) => {
    term.lastIndex = 0
    return term.test(message)
  })

  if (exposesInternalTerm || message.includes('http://') || message.includes('https://')) {
    return fallback
  }

  return message
}

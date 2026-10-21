/**
 * Builds an API path whose every inserted value stays one path segment.
 *
 *   apiPath`/conversations/${conversationId}/messages`
 *
 * Ids often come from the address, which the router has already decoded: an
 * address holding `x%252F..` hands the page `x/..`, and inserted as it is that
 * walks the request to another API path (#91, #251). Each value is encoded with
 * `encodeURIComponent`, so `/`, `?` and `#` cannot end the segment, while plain
 * ids come out exactly as they went in.
 *
 * Encoding cannot help a value that is a whole segment of dots (#418): `..`
 * comes out as `..`, and the URL parser resolves it, like `%2e%2e`, to the
 * level above, while an empty value drops the segment altogether. Such a value
 * is refused with an `ApiPathValueError` before any request is made; a page
 * that takes ids from the address or a field checks them with
 * `isApiPathValue` first and says the id is not valid.
 *
 * Pass raw values: a value that is already encoded would be encoded twice.
 * The `src/services` lint rule `stoa/api-path-template` refuses a path template
 * that inserts a value without this tag.
 */
export function apiPath(
  strings: TemplateStringsArray,
  ...values: ReadonlyArray<string | number>
): string {
  return strings.reduce((path, chunk, index) => {
    if (index === 0) return chunk
    const value = String(values[index - 1])
    if (!isApiPathValue(value)) throw new ApiPathValueError(value)
    return path + encodeURIComponent(value) + chunk
  }, '')
}

/** Whether `value` can stand as one API path segment: not empty, `.` or `..`. */
export function isApiPathValue(value: string | number): boolean {
  const text = String(value)
  return text !== '' && text !== '.' && text !== '..'
}

export class ApiPathValueError extends Error {
  constructor(value: string) {
    super(`apiPath refuses ${JSON.stringify(value)}: it would not stay one path segment`)
    this.name = 'ApiPathValueError'
  }
}

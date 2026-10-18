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
 * Pass raw values: a value that is already encoded would be encoded twice.
 * The `src/services` lint rule `stoa/api-path-template` refuses a path template
 * that inserts a value without this tag.
 */
export function apiPath(
  strings: TemplateStringsArray,
  ...values: ReadonlyArray<string | number>
): string {
  return strings.reduce(
    (path, chunk, index) =>
      index === 0 ? chunk : path + encodeURIComponent(String(values[index - 1])) + chunk,
    '',
  )
}

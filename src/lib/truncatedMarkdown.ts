import { parseSegments } from '@/components/ui/MathRenderer'

/**
 * An excerpt of an assistant's Markdown, made safe to hand to `MathRenderer`.
 *
 * The teacher's preparation summary carries the start of the latest answer,
 * cut at 360 characters with its line breaks folded into spaces
 * (stoa-backend#181). The cut can fall inside a formula or between a pair of
 * asterisks, and what is left would be shown as written: a `$\frac{18` or a
 * `**Schritt 2` (#545). So:
 *
 * - a formula the cut left open is dropped, from its opening dollar on, and
 *   the excerpt ends in an ellipsis; a dollar before a digit or a space is a
 *   price and stays;
 * - a pair of asterisks, or a single one, left without its partner is taken
 *   out; whole pairs stay and are drawn as emphasis; an asterisk between
 *   spaces (`2 * 3`) is not emphasis and stays;
 * - heading marks (`### `) are taken out: with the line breaks gone they would
 *   stand in the middle of a sentence.
 */
export function settleTruncatedMarkdown(excerpt: string): string {
  let text = excerpt.replace(/(^|\s)#{1,6}\s+/g, '$1')
  let cut = false

  const segments = parseSegments(text)
  const last = segments[segments.length - 1]
  if (last?.type === 'text') {
    // A dollar the parser did not pair, opening something: a formula cut off.
    const open = last.value.search(/\$(?=[^\s\d])/)
    if (open >= 0) {
      text = text.slice(0, text.length - last.value.length + open).trimEnd()
      cut = true
    }
  }

  text = dropUnpairedStars(text)
  return cut ? `${text}…` : text
}

/**
 * Takes out the last `**`, and the last emphasis `*`, when each has no
 * partner. Scanned by hand rather than with a lookbehind, which Safari before
 * 16.4 cannot parse (#398).
 */
function dropUnpairedStars(text: string): string {
  const pairs: number[] = []
  const singles: number[] = []
  for (const run of text.matchAll(/\*+/g)) {
    const at = run.index
    if (run[0].length === 2) pairs.push(at)
    if (run[0].length !== 1) continue
    const before = at === 0 ? ' ' : text[at - 1]
    const after = at + 1 >= text.length ? ' ' : text[at + 1]
    if (!(/\s/.test(before) && /\s/.test(after))) singles.push(at)
  }
  const drop: Array<[number, number]> = []
  if (pairs.length % 2 === 1) drop.push([pairs[pairs.length - 1], 2])
  if (singles.length % 2 === 1) drop.push([singles[singles.length - 1], 1])
  if (drop.length === 0) return text
  let settled = text
  for (const [at, width] of drop.sort((a, b) => b[0] - a[0])) {
    settled = settled.slice(0, at) + settled.slice(at + width)
  }
  return settled.replace(/ {2,}/g, ' ').trimEnd()
}

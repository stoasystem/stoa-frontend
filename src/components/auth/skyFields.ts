/*
 * Text fields on the sky (#53): the sign-in form and the email verification
 * card inside it. No canvas board draws a field on a dark surface, so these
 * take candidate 04's underlined field and the sky tokens: a label above, the
 * value in white on the sky itself, and a rule under it that the contrast gate
 * rates at 3:1 (`--on-sky-field-rule`). An invalid field's rule turns white
 * and thicker, so the state never rests on colour alone. The focus ring is
 * the global one, which the sky block turns star-gold.
 *
 * Passed as `className` to the shared `Input` / `Label`; `cn` lets these win
 * over the light defaults those carry, the rule's colour included.
 */

export const skyLabelClass = 'block text-[13px] leading-[1.3] font-medium text-[color:var(--on-sky-text-body)]'

export const skyInputClass = [
  'h-11 rounded-none border-0 border-b bg-transparent px-0 py-0',
  'border-[color:var(--on-sky-field-rule)] focus-visible:border-on-sky aria-[invalid=true]:border-on-sky',
  'text-[17px] text-[color:var(--on-sky-text)] placeholder:text-[color:var(--on-sky-text-caption)]',
  'read-only:text-[color:var(--on-sky-text-body)]',
  // A browser's saved-address fill paints its own light box; keep the sky.
  'autofill:shadow-[inset_0_0_0_1000px_var(--sky)] autofill:[-webkit-text-fill-color:var(--on-sky-text)]',
].join(' ')

export const skyInvalidInputClass = 'border-b-2'

/** Nothing red sits on the sky (Motion and states: destructive, dark surface: "not used"). */
export const skyErrorClass = 'flex items-start gap-1.5 text-[13px] leading-[1.35] text-[color:var(--on-sky-text)]'

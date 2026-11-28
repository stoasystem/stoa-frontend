/**
 * How an exercise is answered and how its check is told, on the sky: the
 * practice stage's own controls, shared with the review (#181) so a question
 * that comes back looks and answers as it did in its lesson. Value in, value
 * out; what a run does with them stays with the screen.
 */
import { Check, X } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { MathRenderer } from '@/components/ui/MathRenderer'
import { ExerciseFigure, type FigureChoices } from '@/features/chapter/ExerciseFigure'
import { cn } from '@/lib/utils'
import type { ExerciseFigures, PracticeAnswer } from '@/types/practice'

/**
 * What is picked or typed. An order is a list of pieces; a set of options
 * (`multi_select`, stoa-backend#593) the numbers of those picked; everything
 * else is text.
 */
export type AnswerValue = PracticeAnswer

/** As much of an exercise or a review card as answering it needs. */
export type AnswerChallenge = Pick<ExerciseFigures, 'optionFigures'> & {
  challengeId: string
  type: string
  options?: string[] | null
}

export const bodyOnSky = 'text-[color:var(--on-sky-text-body)]'

/** The numbers of the options picked in a `multi_select` answer; none for any other value. */
export function pickedOptions(value: AnswerValue): number[] {
  return Array.isArray(value) ? value.filter((item): item is number => typeof item === 'number') : []
}

/**
 * The set with this option picked or put back, in the options' order: the
 * same set reads as the same answer however it was picked, from the list or
 * from the figure.
 */
export function toggleOption(value: AnswerValue, index: number): number[] {
  const picked = pickedOptions(value)
  return (picked.includes(index) ? picked.filter((item) => item !== index) : [...picked, index]).sort((a, b) => a - b)
}

/**
 * The hotspots of a `multi_select` question's figure (stoa-backend#593),
 * wired to the same answer as the list under it: picking one in the figure
 * picks that option in the list, and back. Undefined for any other kind, whose
 * figure is a drawing and nothing more.
 */
export function figureChoices({
  challenge,
  value,
  onChange,
  verdict = null,
  disabled,
}: {
  challenge: AnswerChallenge
  value: AnswerValue
  onChange: (value: AnswerValue) => void
  verdict?: 'right' | 'wrong' | null
  disabled: boolean
}): FigureChoices | undefined {
  const options = challenge.options ?? []
  if (challenge.type !== 'multi_select' || options.length === 0) return undefined
  return {
    labels: options,
    picked: pickedOptions(value),
    onToggle: (index) => onChange(toggleOption(value, index)),
    verdict,
    disabled,
  }
}

/**
 * The rule round a control not chosen yet: what tells it from the sky (WCAG
 * 1.4.11, 3:1). White at 10% was 1.37:1 (#191 review); this is the field rule
 * the contrast gate already rates on --sky (4.52:1) and on a glass card (4.44:1).
 */
const restingRule = 'border-[color:var(--on-sky-field-rule)]'

/** A glass card over the sky (Tokens board: glass cards). */
export const glass = {
  background: 'var(--sky-glass)',
  borderColor: 'var(--sky-glass-border)',
  backdropFilter: 'blur(var(--sky-glass-blur))',
  WebkitBackdropFilter: 'blur(var(--sky-glass-blur))',
} as const

/**
 * A display formula is a block of its own: the line breaks written round it
 * would stand as empty lines under `pre-line`.
 */
export function withoutBreaksAroundDisplayMath(body: string) {
  return body.replace(/[ \t]*\n?(\$\$[\s\S]+?\$\$)[ \t]*\n?/g, '$1')
}

/**
 * Text from the exercise bank -- a question, its working, the feedback on an
 * answer -- with its own line breaks kept (#732): a question's equations one
 * to a line, the working one step to a line. Run together they read as one
 * long number ("= 9.35. 31 ..."). A formula is not broken in the middle; one
 * wider than the column scrolls inside it rather than wrapping at an operator.
 * The same in the lesson, its quizzes and the review.
 */
export function BankText({ children }: { children: string }) {
  return (
    <span data-bank-text className="block overflow-x-auto overflow-y-hidden whitespace-pre-line [&_.katex]:whitespace-nowrap">
      <MathRenderer>{withoutBreaksAroundDisplayMath(children)}</MathRenderer>
    </span>
  )
}

/** "Richtig." under the heading "Richtig" says nothing new. */
function repeatsVerdict(text: string, verdict: string) {
  const bare = (value: string) => value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')
  return bare(text) === bare(verdict)
}

/**
 * The checked answer, told: right or not quite, the backend's feedback when it
 * says more than that, and the working once the answer is right (it states the
 * answer, so a wrong one does not get it). Formulas come as $...$ (#180).
 */
export function FeedbackCard({
  correct,
  feedback,
  explanation,
  children,
}: {
  correct: boolean
  feedback?: string | null
  explanation?: string | null
  /** Anything the screen adds under it: hearts left, when it comes back. */
  children?: ReactNode
}) {
  const { t } = useTranslation('chapter')
  const verdict = correct ? t('stage.correct') : t('stage.notQuite')
  return (
    <div data-quote-source="exercise" className="flex flex-col gap-1 rounded-[16px] border px-[18px] py-4 text-on-sky" style={glass}>
      <p className="m-0 flex items-center gap-2 text-[17px] font-semibold">
        {correct && <Check size={18} strokeWidth={2} aria-hidden="true" className="text-lit" />}
        {verdict}
      </p>
      {feedback && !repeatsVerdict(feedback, verdict) && (
        <p className={cn('m-0 text-[15px]', bodyOnSky)}>
          <BankText>{feedback}</BankText>
        </p>
      )}
      {correct && explanation && (
        <p className="m-0 text-[15px]">
          <BankText>{explanation}</BankText>
        </p>
      )}
      {children}
    </div>
  )
}

/**
 * The control an exercise of this kind is answered with. A kind this does not
 * know is typed, which is what the backend itself falls back to.
 */
export function AnswerInput({
  challenge,
  value,
  onChange,
  verdict = null,
  disabled,
}: {
  challenge: AnswerChallenge
  value: AnswerValue
  onChange: (value: AnswerValue) => void
  /** Once checked: how the chosen option is drawn. */
  verdict?: 'right' | 'wrong' | null
  disabled: boolean
}) {
  const { t } = useTranslation('chapter')
  const optionId = useId()
  const options = challenge.options ?? []

  if (challenge.type === 'multiple_choice' && options.length > 0) {
    const selected = Array.isArray(value) ? '' : value
    const figures = options.map((_, index) => challenge.optionFigures?.[index] || '')
    // Drawings side by side where they fit, one under another on a phone.
    const pictured = figures.some(Boolean)
    // The choice is gold while it is a choice; once checked it says what it was.
    // A wrong one stayed gold with a tick, which reads as right (#180).
    return (
      <fieldset className="m-0 min-w-0 border-0 p-0">
        <legend className="sr-only">{t('stage.chooseAnswer')}</legend>
        <div className={pictured ? 'grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] gap-2' : 'flex flex-col gap-2'}>
          {options.map((option, index) => {
            const chosen = selected === option
            const figure = figures[index]
            // Where the options are drawings, their text is the drawing's
            // label ("A", "B", ...) and the answer is judged by it: a one-letter
            // label is the badge, not the badge and the same letter again.
            const letter = figure && /^\p{L}$/u.test(option.trim()) ? option.trim() : null
            const row = (
              <>
                <span
                  id={`${optionId}-${index}-badge`}
                  aria-hidden="true"
                  className={cn(
                    'inline-flex size-[30px] shrink-0 items-center justify-center rounded-full text-[13px] font-semibold',
                    chosen && verdict !== 'wrong' ? 'bg-lit text-[color:var(--on-sky-button-text)]' : 'bg-white/10 text-[color:var(--on-sky-text-body)]',
                  )}
                >
                  {letter ?? String.fromCharCode(65 + index)}
                </span>
                <span id={`${optionId}-${index}`} className={letter ? 'sr-only' : 'flex-1 text-[17px] font-medium text-on-sky'}>
                  <MathRenderer>{option}</MathRenderer>
                </span>
                {letter && <span className="flex-1" />}
                {chosen && verdict === 'right' && <Check size={20} strokeWidth={2} aria-hidden="true" className="text-lit" />}
                {chosen && verdict === 'wrong' && <X size={20} strokeWidth={2} aria-hidden="true" className="text-[color:var(--red)]" />}
              </>
            )
            return (
              <label
                key={option}
                data-answer-option={chosen ? (verdict ?? 'chosen') : undefined}
                className={cn(
                  'relative flex cursor-pointer gap-3.5 rounded-[14px] border px-[18px] py-3.5 backdrop-blur-[16px] has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-ring',
                  figure ? 'min-w-0 flex-col' : 'items-center',
                  !chosen ? `${restingRule} bg-white/[0.06]` : verdict === 'wrong' ? 'border-[color:var(--red)] bg-white/[0.06]' : 'border-lit bg-lit/16',
                  disabled && 'cursor-default',
                )}
              >
                <input
                  type="radio"
                  name={`answer-${challenge.challengeId}`}
                  value={option}
                  checked={chosen}
                  disabled={disabled}
                  onChange={() => onChange(option)}
                  // Named by the option as shown, not by whatever else the
                  // row holds (#735); an option with no text by its letter.
                  aria-labelledby={option.trim() ? `${optionId}-${index}` : `${optionId}-${index}-badge`}
                  className="sr-only"
                />
                {figure ? (
                  <>
                    <span className="flex items-center gap-3.5">{row}</span>
                    <ExerciseFigure svg={figure} />
                  </>
                ) : (
                  row
                )}
              </label>
            )
          })}
        </div>
      </fieldset>
    )
  }

  if (challenge.type === 'multi_select' && options.length > 0) {
    const picked = pickedOptions(value)
    const figures = options.map((_, index) => challenge.optionFigures?.[index] || '')
    const pictured = figures.some(Boolean)
    // Options that are only a letter (the hotspots' labels in the figure) are
    // the badge alone, side by side; a letter beside the same letter says it twice.
    const lettersOnly = !pictured && options.every((option) => /^\p{L}$/u.test(option.trim()))
    return (
      <fieldset className="m-0 min-w-0 border-0 p-0">
        {/* Said, not counted: how many are right is not given away (stoa-backend#593). */}
        <legend className={cn('mb-2 p-0 text-[13px] font-semibold', bodyOnSky)}>{t('stage.chooseSeveral')}</legend>
        <div
          className={
            pictured
              ? 'grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] gap-2'
              : lettersOnly
                ? 'grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-2'
                : 'flex flex-col gap-2'
          }
        >
          {options.map((option, index) => {
            const chosen = picked.includes(index)
            const figure = figures[index]
            const letter = (figure || lettersOnly) && /^\p{L}$/u.test(option.trim()) ? option.trim() : null
            const row = (
              <>
                <span
                  id={`${optionId}-${index}-badge`}
                  aria-hidden="true"
                  // Square, not round: any number of these may be picked.
                  className={cn(
                    'inline-flex size-[30px] shrink-0 items-center justify-center rounded-[8px] text-[13px] font-semibold',
                    chosen && verdict !== 'wrong' ? 'bg-lit text-[color:var(--on-sky-button-text)]' : 'bg-white/10 text-[color:var(--on-sky-text-body)]',
                  )}
                >
                  {letter ?? String.fromCharCode(65 + index)}
                </span>
                <span id={`${optionId}-${index}`} className={letter ? 'sr-only' : 'flex-1 text-[17px] font-medium text-on-sky'}>
                  <MathRenderer>{option}</MathRenderer>
                </span>
                {letter && !lettersOnly && <span className="flex-1" />}
                {chosen && verdict === 'right' && <Check size={20} strokeWidth={2} aria-hidden="true" className="text-lit" />}
                {chosen && verdict === 'wrong' && <X size={20} strokeWidth={2} aria-hidden="true" className="text-[color:var(--red)]" />}
              </>
            )
            return (
              <label
                key={index}
                data-answer-option={chosen ? (verdict ?? 'chosen') : undefined}
                className={cn(
                  'relative flex min-h-11 cursor-pointer gap-3.5 rounded-[14px] border px-[18px] py-3.5 backdrop-blur-[16px] has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-ring',
                  figure ? 'min-w-0 flex-col' : 'items-center',
                  lettersOnly && 'justify-center gap-2 px-3',
                  !chosen ? `${restingRule} bg-white/[0.06]` : verdict === 'wrong' ? 'border-[color:var(--red)] bg-white/[0.06]' : 'border-lit bg-lit/16',
                  disabled && 'cursor-default',
                )}
              >
                <input
                  type="checkbox"
                  value={index}
                  checked={chosen}
                  disabled={disabled}
                  onChange={() => onChange(toggleOption(value, index))}
                  aria-labelledby={option.trim() ? `${optionId}-${index}` : `${optionId}-${index}-badge`}
                  className="sr-only"
                />
                {figure ? (
                  <>
                    <span className="flex items-center gap-3.5">{row}</span>
                    <ExerciseFigure svg={figure} />
                  </>
                ) : (
                  row
                )}
              </label>
            )
          })}
        </div>
      </fieldset>
    )
  }

  if (challenge.type === 'ordering' && options.length > 0) {
    const chosen = Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
    const toggle = (option: string) =>
      onChange(chosen.includes(option) ? chosen.filter((item) => item !== option) : [...chosen, option])
    return (
      <div className="flex flex-col gap-3">
        <p className={cn('m-0 text-[13px] font-semibold', bodyOnSky)}>{t('stage.order.available')}</p>
        <div className="flex flex-wrap gap-2">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={chosen.includes(option)}
              disabled={disabled}
              onClick={() => toggle(option)}
              className={cn(
                'min-h-11 rounded-[12px] border px-4 text-[15px] font-medium text-on-sky focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-40',
                chosen.includes(option) ? 'border-lit bg-lit/16' : `${restingRule} bg-white/[0.06]`,
              )}
            >
              <MathRenderer>{option}</MathRenderer>
            </button>
          ))}
        </div>
        <p className={cn('m-0 text-[13px] font-semibold', bodyOnSky)}>{t('stage.order.chosen')}</p>
        {chosen.length === 0 ? (
          <p className={cn('m-0 text-[15px]', bodyOnSky)}>{t('stage.order.empty')}</p>
        ) : (
          // Numbered: the order is the answer. A flex list drew no numbers at all.
          <ol className="m-0 list-decimal space-y-1 pl-6 text-[15px] text-on-sky marker:text-[color:var(--on-sky-text-body)]">
            {chosen.map((option) => (
              <li key={option}>
                <MathRenderer>{option}</MathRenderer>
              </li>
            ))}
          </ol>
        )}
      </div>
    )
  }

  const text = Array.isArray(value) ? value.join(', ') : value
  const field =
    'w-full rounded-[12px] border border-[color:var(--on-sky-field-rule)] bg-white/[0.06] px-4 text-[17px] text-on-sky placeholder:text-[color:var(--on-sky-text-caption)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-40'
  return (
    <label className="flex flex-col gap-2">
      <span className={cn('text-[13px] font-semibold', bodyOnSky)}>{t('stage.yourAnswer')}</span>
      {challenge.type === 'explanation' ? (
        <textarea
          rows={4}
          value={text}
          disabled={disabled}
          placeholder={t('stage.explainPlaceholder')}
          onChange={(event) => onChange(event.target.value)}
          className={cn(field, 'py-3 leading-[1.45]')}
        />
      ) : (
        <input
          type="text"
          value={text}
          disabled={disabled}
          autoComplete="off"
          placeholder={t('stage.answerPlaceholder')}
          onChange={(event) => onChange(event.target.value)}
          className={cn(field, 'h-12')}
        />
      )}
    </label>
  )
}


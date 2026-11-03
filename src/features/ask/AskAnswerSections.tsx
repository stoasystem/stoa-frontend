import { useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MathRenderer } from '@/components/ui/MathRenderer'
import type { KnowledgePoint, MessageQuote, StructuredAnswer } from '@/types/chat'

/** A step's place in its answer, as a quote names it (stoa-backend#132). */
export type AnswerStep = { messageId: string; index: number; text: string }

/**
 * Whether an answer is laid out in its sections (#506): one that carries them
 * and is not a follow-up. A follow-up is plain words, and so is every answer
 * written before the sections were kept: both show their text as they always did.
 */
export function hasSections(structured: StructuredAnswer | null | undefined): structured is StructuredAnswer {
  if (!structured || structured.kind !== 'answer') return false
  return Boolean(
    structured.steps?.length ||
      structured.answer?.trim() ||
      structured.hints?.length ||
      structured.similarExercises?.length ||
      structured.knowledgePoints?.length,
  )
}

/**
 * What an answer laid out in sections reads as on its own: the steps and the
 * answer, as the bubble shows them at first. The hints and the exercises stay
 * where the student opens them, also for a screen reader (#506).
 */
export function sectionsSpokenText(structured: StructuredAnswer): string {
  return [...(structured.steps ?? []), structured.answer?.trim() ?? ''].filter(Boolean).join('\n')
}

/** "Quoted", and which step when the quote is one step of an answer (#506). */
export function quoteCaption(quote: MessageQuote, t: (key: string, options?: Record<string, unknown>) => string) {
  const part = quote.source.part
  const title = t('ask.quote.title')
  if (part?.section !== 'steps' || typeof part.index !== 'number') return title
  return `${title} · ${t('ask.answer.stepNumber', { n: part.index + 1 })}`
}

/**
 * An answer in its sections (#506): the steps and the answer at once, each
 * step with its own "I don't get this step"; the hints and the similar
 * exercises closed, opened one at a time; the related knowledge points as a
 * line of small labels. At first sight it is no longer than the joined text
 * was, which also carried the first hint.
 *
 * A knowledge point leads to its star only when Ask is given the way there
 * (`onKnowledgePoint`) and the backend matched one; the star card that flies
 * there is #487's, not drawn again here.
 */
export function AskAnswerSections({
  messageId,
  structured,
  onAskAboutStep,
  onKnowledgePoint,
}: {
  messageId: string
  structured: StructuredAnswer
  /** Quote one step back to the assistant; absent where nothing can be asked. */
  onAskAboutStep?: (step: AnswerStep) => void
  onKnowledgePoint?: (point: KnowledgePoint & { unitId: string }) => void
}) {
  const { t } = useTranslation('chat')
  const steps = structured.steps ?? []
  const answer = structured.answer?.trim() ?? ''
  const points = structured.knowledgePoints ?? []

  return (
    <div data-answer-sections className="flex flex-col gap-3 whitespace-normal">
      {steps.length > 0 && (
        <ol aria-label={t('ask.answer.steps')} data-answer-section="steps" className="m-0 flex list-none flex-col gap-2.5 p-0">
          {steps.map((step, index) => (
            <li key={index} data-step-index={index} className="flex gap-2.5">
              <span
                aria-hidden="true"
                className="inline-flex shrink-0 items-center justify-center rounded-full bg-accent-tint text-[12px] font-semibold text-accent"
                style={{ width: 22, height: 22, marginTop: 1 }}
              >
                {index + 1}
              </span>
              <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                <span className="sr-only">{t('ask.answer.stepNumber', { n: index + 1 })}: </span>
                <span className="whitespace-pre-wrap break-words">
                  <MathRenderer>{step}</MathRenderer>
                </span>
                {onAskAboutStep && (
                  <button
                    type="button"
                    data-ask-about-step={index}
                    onClick={() => onAskAboutStep({ messageId, index, text: step })}
                    className="min-h-[28px] rounded-[8px] text-left text-[13px] font-medium text-accent underline-offset-2 hover:underline"
                  >
                    {t('ask.answer.stepUnclear')}{' '}
                    <span className="sr-only">({t('ask.answer.stepNumber', { n: index + 1 })})</span>
                  </button>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
      {answer && (
        <div data-answer-section="answer" className="flex flex-col gap-0.5">
          <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.04em] text-caption">{t('ask.answer.answer')}</p>
          <p className="m-0 whitespace-pre-wrap break-words">
            <MathRenderer>{answer}</MathRenderer>
          </p>
        </div>
      )}
      <RevealOneByOne
        section="hints"
        items={structured.hints ?? []}
        label={t('ask.answer.hints')}
        first={t('ask.answer.showHint')}
        next={t('ask.answer.nextHint')}
      />
      <RevealOneByOne
        section="similarExercises"
        items={structured.similarExercises ?? []}
        label={t('ask.answer.practice')}
        first={t('ask.answer.showExercise')}
        next={t('ask.answer.nextExercise')}
      />
      {points.length > 0 && (
        <ul aria-label={t('ask.answer.related')} data-answer-section="knowledgePoints" className="m-0 flex list-none flex-wrap gap-1.5 p-0">
          {points.map((point, index) => {
            const unitId = point.unitId
            const chip = 'inline-flex min-h-[26px] items-center rounded-full bg-fill px-2.5 text-[12px] font-medium text-ink'
            return (
              <li key={`${index}:${point.name}`} data-knowledge-point={unitId ?? ''}>
                {onKnowledgePoint && unitId ? (
                  <button
                    type="button"
                    onClick={() => onKnowledgePoint({ ...point, unitId })}
                    className={`${chip} hover:bg-[color-mix(in_srgb,var(--fill),black_8%)]`}
                  >
                    {point.name}
                  </button>
                ) : (
                  <span className={chip}>{point.name}</span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/**
 * A section opened one entry at a time (#506): a hint, then the next; an
 * exercise, then another. What was opened is read out as it appears, and the
 * keyboard stays on the button -- until the last one, when the button goes and
 * the keyboard moves onto what it opened instead of being dropped.
 */
function RevealOneByOne({
  section,
  items,
  label,
  first,
  next,
}: {
  section: 'hints' | 'similarExercises'
  items: string[]
  label: string
  first: string
  next: string
}) {
  const [shown, setShown] = useState(0)
  const listId = useId()
  const lastShown = useRef<HTMLLIElement>(null)
  if (items.length === 0) return null

  const open = () => {
    const count = Math.min(shown + 1, items.length)
    setShown(count)
    if (count === items.length) requestAnimationFrame(() => lastShown.current?.focus())
  }

  return (
    <div data-answer-section={section} className="flex flex-col items-start gap-1.5">
      <ol
        id={listId}
        aria-label={label}
        aria-live="polite"
        data-shown={shown}
        className="m-0 flex list-none flex-col gap-1.5 p-0"
      >
        {items.slice(0, shown).map((item, index) => (
          <li
            key={index}
            ref={index === shown - 1 ? lastShown : undefined}
            tabIndex={-1}
            className="whitespace-pre-wrap break-words rounded-[12px] bg-fill"
            style={{ padding: '8px 12px', fontSize: 14, lineHeight: 1.45 }}
          >
            <MathRenderer>{item}</MathRenderer>
          </li>
        ))}
      </ol>
      {shown < items.length && (
        <button
          type="button"
          aria-controls={listId}
          onClick={open}
          className="inline-flex min-h-[32px] items-center rounded-full border border-[color:var(--card-border)] px-3 text-[13px] font-semibold text-accent hover:bg-accent-tint"
        >
          {shown === 0 ? first : next}
          <span aria-hidden="true" className="ml-1.5 font-normal text-caption">
            {shown + 1}/{items.length}
          </span>
        </button>
      )}
    </div>
  )
}

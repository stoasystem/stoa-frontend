/*
 * The language first (#627, `useLanguageFirst`): one card before "About you",
 * over the map. Murmi asks which language to learn in and says what it is for;
 * the four languages, each by its own name and marked as that language for a
 * screen reader, in the order Switzerland speaks them. Picking one switches the
 * screen at once, this card included; "Continue" stores it.
 *
 * Not a modal, as "About you" is not: the map behind it still moves. The
 * language chosen takes the focus when it opens, so the arrow keys go through
 * the others and Enter goes on.
 */
import { useEffect, useId, useRef, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/base'
import { Murmi } from '@/components/brand/Murmi'
import { languageOptions, type SupportedLanguage } from '@/i18n/languages'

/** De, fr, it, then en: the country's languages first. */
const ORDER: readonly SupportedLanguage[] = ['de', 'fr', 'it', 'en']
const OPTIONS = ORDER.map((code) => languageOptions.find((option) => option.code === code)!)

export type LanguageFirstProps = {
  chosen: SupportedLanguage
  saving: boolean
  onPick: (language: SupportedLanguage) => void
  onConfirm: () => void
}

export function LanguageFirst({ chosen, saving, onPick, onConfirm }: LanguageFirstProps) {
  const { t } = useTranslation('starmap')
  const titleId = useId()
  const name = useId()
  const listRef = useRef<HTMLUListElement>(null)
  useEffect(() => {
    listRef.current?.querySelector<HTMLInputElement>('input:checked')?.focus({ preventScroll: true })
  }, [])

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!saving) onConfirm()
  }

  return (
    // A phone keeps the right edge for Ask's button (`data-ask-reopen`), the card beside it.
    <div data-language-first className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-y-auto p-4 max-[559px]:pr-[72px]">
      <section
        data-starmap-overlay
        aria-labelledby={titleId}
        className="starmap-first-landing pointer-events-auto w-[min(400px,100%)] rounded-[var(--corner-card)] border border-solid border-[color:var(--sky-glass-border)] px-5 py-4 text-on-sky"
        data-shown
        style={{ background: 'var(--sky-glass)', backdropFilter: 'blur(var(--sky-glass-blur))', WebkitBackdropFilter: 'blur(var(--sky-glass-blur))' }}
      >
        <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
          <div className="flex items-start gap-3">
            <Murmi mood="waving" size={40} />
            <div className="flex flex-col gap-1">
              <h2 id={titleId} className="m-0 text-[16px] font-semibold leading-snug text-[color:var(--on-sky-text)]">
                {t('languageFirst.title')}
              </h2>
              <p className="m-0 text-[13px] leading-5 text-[color:var(--on-sky-text-body)]">{t('languageFirst.why')}</p>
            </div>
          </div>
          <fieldset className="m-0 min-w-0 border-0 p-0">
            <legend className="sr-only">{t('languageFirst.choose')}</legend>
            <ul ref={listRef} className="m-0 grid list-none grid-cols-2 gap-2 p-0">
              {OPTIONS.map((option) => (
                <li key={option.code}>
                  <label
                    lang={option.code}
                    data-language={option.code}
                    className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border border-solid border-[color:var(--on-sky-field-rule)] px-3 text-[14px] text-[color:var(--on-sky-text)] has-[:checked]:bg-[color:var(--on-sky-selected)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring"
                  >
                    <input
                      type="radio"
                      name={name}
                      value={option.code}
                      className="size-4 accent-[color:var(--on-sky-button)]"
                      checked={option.code === chosen}
                      onChange={() => onPick(option.code)}
                    />
                    {option.label}
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
          <div className="flex">
            <Button type="submit" lift variant="onSky" size="regular" aria-disabled={saving || undefined}>
              {saving ? t('languageFirst.saving') : t('languageFirst.next')}
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}

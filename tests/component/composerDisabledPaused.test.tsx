/**
 * #615: once the usage period has ended, Ask's composer is shut, and it has to
 * look shut. It used to keep the white floating pill and its inviting
 * placeholder, and only the send arrow faded, so a child took the field for
 * broken. Shut, it says so in the field, drops onto the quiet fill without
 * the floating shadow, and every control in it is disabled.
 */
import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Composer, type ComposerVariant } from '@/components/base/Composer'

const WINDOWS =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'

beforeEach(() => {
  // A device the microphone knows, so the microphone is drawn.
  Object.defineProperty(window.navigator, 'userAgent', { value: WINDOWS, configurable: true })
})

afterEach(() => {
  Reflect.deleteProperty(window.navigator, 'userAgent')
})

function renderComposer(variant: ComposerVariant, disabled: boolean) {
  return render(
    <Composer
      variant={variant}
      value=""
      onChange={vi.fn()}
      onSubmit={vi.fn()}
      onAttach={vi.fn()}
      dictation
      label="Ask"
      placeholder="Ask about anything on the planet…"
      disabled={disabled}
      disabledPlaceholder="Asking is paused"
    />,
  )
}

describe.each<ComposerVariant>(['docked', 'full'])('the %s composer', (variant) => {
  it('shut, says so in the field, is marked, and disables every control', () => {
    const { container } = renderComposer(variant, true)
    const form = container.querySelector('form')!
    expect(form).toHaveAttribute('data-composer-disabled', 'true')
    expect(form.className).toContain('bg-fill')
    expect(form.className).not.toContain('bg-surface')
    expect(form.style.boxShadow).toBe('none')

    const field = screen.getByRole('textbox', { name: 'Ask' })
    expect(field).toBeDisabled()
    expect(field).toHaveAttribute('placeholder', 'Asking is paused')

    const add = container.querySelector('[data-composer-add]')
    const mic = container.querySelector('[data-composer-mic]')
    const send = screen.getByRole('button', { name: 'composer.send' })
    expect(add).toBeDisabled()
    expect(mic).toBeDisabled()
    expect(send).toBeDisabled()
    for (const button of screen.getAllByRole('button')) expect(button).toBeDisabled()
  })

  it('open, keeps its own placeholder and the floating surface', () => {
    const { container } = renderComposer(variant, false)
    const form = container.querySelector('form')!
    expect(form).not.toHaveAttribute('data-composer-disabled')
    expect(form.className).toContain('bg-surface')
    expect(form.style.boxShadow).toBe('var(--shadow-float)')

    const field = screen.getByRole('textbox', { name: 'Ask' })
    expect(field).toBeEnabled()
    expect(field).toHaveAttribute('placeholder', 'Ask about anything on the planet…')
    expect(container.querySelector('[data-composer-add]')).toBeEnabled()
    expect(container.querySelector('[data-composer-mic]')).toBeEnabled()
  })
})

it('shut without a placeholder of its own, keeps the one it has (a quiz in progress)', () => {
  render(
    <Composer value="" onChange={vi.fn()} onSubmit={vi.fn()} label="Ask" placeholder="Ask about this question…" disabled />,
  )
  expect(screen.getByRole('textbox', { name: 'Ask' })).toHaveAttribute('placeholder', 'Ask about this question…')
})

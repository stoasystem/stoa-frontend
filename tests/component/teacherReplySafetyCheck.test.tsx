/**
 * The reply composer refused ordinary maths as HTML (#268): "0 < a < 1" hit
 * the "<a" tag check and "set one = 1" the "on…=" handler check, so a teacher
 * could not send the answer. Only what a browser would read as a tag is
 * refused now, in text and formula blocks alike.
 */
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TeacherReplyComposer } from '@/components/teacher/TeacherReplyComposer'
import i18n from '@/i18n'

const REFUSED = 'HTML-Code ist in Antworten nicht erlaubt.'

beforeEach(async () => {
  await i18n.changeLanguage('de')
})

async function compose(text: string, mode: 'paragraph' | 'formula' = 'paragraph') {
  const onSubmit = vi.fn()
  render(
    <I18nextProvider i18n={i18n}>
      <TeacherReplyComposer isSubmitting={false} onSubmit={onSubmit} />
    </I18nextProvider>,
  )
  if (mode === 'formula') await userEvent.click(screen.getByRole('button', { name: 'Formel' }))
  fireEvent.change(screen.getByLabelText('Antwort der Lehrperson'), { target: { value: text } })
  return { onSubmit, send: screen.getByRole('button', { name: 'Antwort senden' }) }
}

describe('the reply composer lets maths and plain text through', () => {
  it.each([
    ['an inequality', '0 < a < 1', 'paragraph'],
    ['an inequality without spaces', '0<a<1', 'paragraph'],
    ['a chain of comparisons', 'a<b>c und x <= y', 'paragraph'],
    ['"one =" in a sentence', 'Set one = 1 first, once = 2 after', 'paragraph'],
    ['an inequality in a formula block', '0 < a < 1', 'formula'],
    ['LaTeX with angle brackets', String.raw`\left< a, b \right> < \frac{1}{a}`, 'formula'],
    ['LaTeX with "one ="', String.raw`\text{one} = 1,\ 0 < a \leq 1`, 'formula'],
  ] as const)('%s', async (_, text, mode) => {
    const { onSubmit, send } = await compose(text, mode)
    expect(screen.queryByText(REFUSED)).not.toBeInTheDocument()
    expect(send).toBeEnabled()
    await userEvent.click(send)
    expect(onSubmit).toHaveBeenCalledOnce()
  })
})

describe('the reply composer still refuses HTML', () => {
  it.each([
    ['a script tag', '<script>alert(1)</script>'],
    ['a script tag in capitals', 'Hallo <SCRIPT SRC=//x.ch/a.js></SCRIPT>'],
    ['an image with an error handler', '<img src=x onerror=alert(1)>'],
    ['a link', '<a href="https://example.com">hier</a>'],
    ['a link split across lines', '<a\nhref=javascript:alert(1)>x</a>'],
    ['a self-closing svg with a load handler', '<svg/onload=alert(1)>'],
    ['a handler on a tag not on the list', '<details open ontoggle=alert(1)>'],
    ['a handler behind a quoted ">"', '<div title=">" onclick=alert(1)>x</div>'],
  ])('%s', async (_, text) => {
    const { send } = await compose(text)
    expect(screen.getByText(REFUSED)).toBeInTheDocument()
    expect(send).toBeDisabled()
  })

  it('refuses a tag in a formula block too', async () => {
    const { send } = await compose('x = 1 <img src=x onerror=alert(1)>', 'formula')
    expect(screen.getByText(REFUSED)).toBeInTheDocument()
    expect(send).toBeDisabled()
  })

  it('checks a long reply without stalling', async () => {
    const started = performance.now()
    const { send } = await compose(`<div ${'a=b/ c= '.repeat(1000)}x`)
    expect(send).toBeEnabled()
    expect(performance.now() - started).toBeLessThan(1000)
  })
})

import { expect, test, type Page } from '@playwright/test'
import {
  E03_SCREEN,
  dominantLanguage,
  expectAnswerOnScreen,
  findErrorCode,
  plainSnippet,
  screenAnswer,
  shownAnswerText,
  type Screen,
  type StoredAnswer,
} from '../judge'

/*
 * The negative controls for AI answers (#27, 判据): fixed answers, written
 * here, that the keyword screen has to notice - a refusal, the wrong language,
 * no example. No model is asked. Passing them shows the screen can recognise
 * these answers; it does not make the screen a judge, and every real answer
 * still goes to a person.
 */

const DERIVATIVE: Screen = { language: 'de', topic: /Ableitung|Steigung|Änderung|ändert|Tangente/i, wantsExample: true }
const QUANTUM: Screen = { language: 'de', topic: /Quant|Teilchen|Atom|Energie|Licht|Welle|Photon/i, wantsExample: true }

const GOOD_DERIVATIVE =
  'Eine Ableitung sagt dir, wie schnell sich etwas ändert. Stell dir vor, du fährst mit dem Velo einen Hügel ' +
  'hinauf: die Steigung an einer Stelle ist genau das, was die Ableitung misst. Zum Beispiel ist bei einer ' +
  'Geraden die Steigung überall gleich, und dann ist auch die Ableitung überall gleich. Das lernst du erst ' +
  'später genauer, aber die Idee kannst du dir schon jetzt merken.'

const GOOD_QUANTUM =
  'Quantenphysik ist die Physik der ganz kleinen Dinge, wie Atome und Licht. Stell dir vor, Licht ist nicht nur ' +
  'eine Welle, sondern kommt auch in winzigen Paketen, die man Photonen nennt. Das ist ein bisschen wie bei ' +
  'Treppenstufen: man kann auf einer Stufe stehen, aber nicht zwischen zwei Stufen. So ist es auch mit der ' +
  'Energie von einem Atom, die nur bestimmte Werte haben kann.'

test('a German explanation with an example passes the screen', () => {
  expect(screenAnswer(GOOD_DERIVATIVE, DERIVATIVE)).toEqual([])
  expect(screenAnswer(GOOD_QUANTUM, QUANTUM)).toEqual([])
})

// User-confirmed synthetic response from the 2026-10-10 production smoke.
const GUIDED_EQUATION = String.raw`1. Start with the equation: $2x + 7 = 19$
2. We want to get $x$ alone on one side. First, remove the $+7$ by subtracting $7$ from **both sides**: $2x + 7 - 7 = 19 - 7$, which gives $2x = 12$
3. Now $x$ is multiplied by $2$. To undo that, divide **both sides** by $2$: $\frac{2x}{2} = \frac{12}{2}$
4. What do you get when you divide $12$ by $2$? That is your answer for $x$!

Try the last step yourself: $x = ?$ (divide 12 by 2)

**Hint:** Whatever you do to one side of the equation, you must do the same to the other side — that keeps the equation balanced, like a scale.`

test('an English equation explanation can leave the final step to the student', () => {
  expect(screenAnswer(GUIDED_EQUATION, E03_SCREEN)).toEqual([])
})

test('a refusal is flagged', () => {
  const refusal =
    'Das ist leider zu schwer für die 6. Klasse. Ableitungen lernst du erst viel später in der Schule, und ' +
    'darum kann ich dir das nicht erklären. Frag am besten deine Lehrerin, wenn du mehr wissen willst, oder ' +
    'warte, bis ihr das Thema im Unterricht habt.'
  expect(screenAnswer(refusal, DERIVATIVE)).toEqual(
    expect.arrayContaining([expect.stringMatching(/^reads as a refusal/)]),
  )
})

test('an answer in the wrong language is flagged', () => {
  const english =
    'A derivative tells you how fast something changes. For example, imagine you are riding a bike up a hill: ' +
    'the slope at one point is what the derivative measures, and it is the same everywhere on a straight line.'
  expect(dominantLanguage(english)).toBe('en')
  expect(screenAnswer(english, DERIVATIVE)).toEqual(
    expect.arrayContaining([expect.stringMatching(/^language: expected de/)]),
  )

  // E03 the other way round: German when the header chose English.
  const german = 'Wir ziehen zuerst 7 ab und teilen dann durch 2. Das ergibt x = 6, und das ist die Lösung, die du suchst.'
  expect(screenAnswer(german, E03_SCREEN)).toEqual(expect.arrayContaining([expect.stringMatching(/^language: expected en/)]))
  const englishE03 = 'First subtract 7 from both sides, so 2x = 12. Then divide by 2, and you get x = 6. That is the answer.'
  expect(screenAnswer(englishE03, E03_SCREEN)).toEqual([])
})

test('an English equation refusal is still flagged', () => {
  const refusal = 'I cannot explain this equation to you. You should ask your teacher for help with it instead.'
  expect(screenAnswer(refusal, E03_SCREEN)).toEqual(
    expect.arrayContaining([expect.stringMatching(/^reads as a refusal/)]),
  )
})

test('an English answer off the equation topic is flagged even when it contains 6', () => {
  const offTopic = 'The weather is warm at 6 in the morning, and you can take a walk in the park. There is no rain today.'
  expect(screenAnswer(offTopic, E03_SCREEN)).toEqual(
    expect.arrayContaining([expect.stringMatching(/^never mentions/)]),
  )
})

test('an explanation with no example or analogy is flagged', () => {
  const bare =
    'Eine Ableitung ist der Grenzwert des Differenzenquotienten. Sie gibt die Steigung der Tangente an einer ' +
    'Stelle der Funktion an und wird mit f\'(x) geschrieben. Man berechnet sie mit den Ableitungsregeln, die ' +
    'man in der Oberstufe lernt.'
  expect(screenAnswer(bare, DERIVATIVE)).toEqual(['no example or analogy'])
})

test('a short answer or one off the topic is flagged', () => {
  expect(screenAnswer('Das ist eine gute Frage, und die Antwort ist nicht so einfach.', QUANTUM)).toEqual(
    expect.arrayContaining([expect.stringMatching(/^never mentions/), expect.stringMatching(/characters; not an explanation$/)]),
  )
})

test('the on-screen snippet skips LaTeX and markdown', () => {
  expect(plainSnippet('$$f\'(x) = 2x$$\n**Kurz:** Die Ableitung misst, wie schnell sich etwas ändert.')).toBe(
    'Die Ableitung misst, wie schnell',
  )
  expect(plainSnippet('$x$')).toBeNull()
})

test('the on-screen snippet skips a list marker at the start of a line (#714)', () => {
  expect(plainSnippet('1. Stell dir vor, du fährst mit dem Fahrrad einen Hügel hinauf.')).toBe('Stell dir vor, du fährst mit dem')
  // A first step too short to use: the snippet comes from the second, still without its "2. ".
  expect(plainSnippet('1. Kurz gesagt:\n2) Die Ableitung misst, wie schnell sich etwas ändert.')).toBe(
    'Die Ableitung misst, wie schnell',
  )
  expect(plainSnippet('- Die Steigung einer Geraden ist überall gleich gross.')).toMatch(/^Die Steigung einer Geraden/)
  // A number that is part of the sentence stays.
  expect(plainSnippet('Am 1. August feiern wir in der Schweiz den Nationalfeiertag.')).toMatch(/^Am 1\. August/)
})

/*
 * The answer of the 2026-11-18 production run, as `GET /conversations/{id}`
 * returned it: the joined `content` the backend keeps beside the sections, and
 * the sections the page draws (#506, #714).
 */
const STEPS = [
  'Stell dir vor, du fährst mit dem **Velo** einen Hügel hinauf. Je steiler der Hügel, desto mehr musst du treten.',
  'Die Ableitung $f\'(x)$ sagt dir an jeder Stelle, wie steil es gerade ist.',
]
const STEPPED: StoredAnswer = {
  content:
    `1. ${STEPS[0]}\n2. ${STEPS[1]}\n\nDie Ableitung ist die Steigung an einer Stelle.\n\n` +
    'Tipp: Zeichne eine Gerade, die den Hügel an einer Stelle nur berührt.',
  structured: {
    kind: 'answer',
    steps: STEPS,
    answer: 'Die Ableitung ist die Steigung an einer Stelle.',
    hints: ['Tipp: Zeichne eine Gerade, die den Hügel an einer Stelle nur berührt.'],
    similarExercises: [],
    knowledgePoints: [],
  },
}

test('what the page shows of an answer in sections is its steps and answer, not the closed hint', () => {
  const shown = shownAnswerText(STEPPED)
  expect(shown).toContain(STEPS[0])
  expect(shown).not.toMatch(/^1\. /m)
  expect(shown).not.toContain('Tipp:')
  expect(plainSnippet(shown)).toBe('Stell dir vor, du fährst mit dem')
  // An answer from before the sections, or a follow-up, is shown as its text.
  expect(shownAnswerText({ content: 'Nur Text.', structured: null })).toBe('Nur Text.')
  expect(shownAnswerText({ content: 'Nur Text.', structured: { kind: 'followUp', steps: ['x'] } })).toBe('Nur Text.')
})

/** The assistant's bubble, laid out as src/features/ask/AskAnswerSections.tsx draws an answer in steps. */
function steppedBubble(steps: string[], answer: string): string {
  const cards = steps
    .map(
      (step, index) =>
        `<li data-step-index="${index}"><span aria-hidden="true">${index + 1}</span><div>` +
        `<span class="sr-only">Step ${index + 1}: </span>` +
        // MathRenderer: **bold** as <strong>, a formula as KaTeX's own markup.
        `<span>${step.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\$(.+?)\$/g, '<span class="katex">f′(x)</span>')}</span>` +
        `<button type="button">I don't get this step</button></div></li>`,
    )
    .join('')
  return (
    '<div data-message-role="assistant"><p class="sr-only">STOA assistant</p><div data-answer-sections>' +
    `<ol data-answer-section="steps">${cards}</ol>` +
    `<div data-answer-section="answer"><p>Answer</p><p>${answer}</p></div>` +
    '<div data-answer-section="hints"><ol data-shown="0"></ol><button type="button">Show a hint 1/1</button></div>' +
    '</div></div>'
  )
}

async function bubbles(page: Page, ...html: string[]): Promise<void> {
  await page.setContent(`<!doctype html><main>${html.join('')}</main>`)
}

test('an answer that starts with a numbered step is found on a page that draws it as step cards (#714)', async ({ page }) => {
  await bubbles(page, steppedBubble(STEPS, STEPPED.structured!.answer!))
  const shown = page.locator('[data-message-role=assistant]').last()
  // The bug: the stored text's "1. " is drawn as a number badge, never as text.
  await expect(shown).not.toContainText(`1. ${STEPS[0].slice(0, 20)}`, { timeout: 500 })
  await expectAnswerOnScreen(shown, STEPPED, 2_000)
  // The same text with no sections is drawn as typed, "1. " and all, and is found too.
  await bubbles(page, `<div data-message-role="assistant"><p>${STEPPED.content.replace(/\*\*/g, '')}</p></div>`)
  await expectAnswerOnScreen(page.locator('[data-message-role=assistant]').last(), { content: STEPPED.content }, 2_000)
})

test('the on-screen check fails when the bubble shows some other answer', async ({ page }) => {
  // The last bubble is still an earlier answer: the one asked for never arrived.
  await bubbles(
    page,
    steppedBubble(STEPS, STEPPED.structured!.answer!),
    steppedBubble(['Quantenphysik ist die Physik der ganz kleinen Dinge, wie Atome und Licht.'], 'Licht kommt in Paketen.'),
  )
  const shown = page.locator('[data-message-role=assistant]').last()
  await expect(expectAnswerOnScreen(shown, STEPPED, 500)).rejects.toThrow(/the answer is on screen/)
  // And an empty bubble fails the check for an answer with no plain stretch in it.
  await bubbles(page, '<div data-message-role="assistant"></div>')
  await expect(expectAnswerOnScreen(page.locator('[data-message-role=assistant]'), { content: '$x$' }, 500)).rejects.toThrow(
    /an answer is on screen/,
  )
})

test('an error code is found wherever the refusal nests it', () => {
  expect(findErrorCode({ detail: { code: 'upload_invalid', message: 'm' } })).toEqual({
    code: 'upload_invalid',
    path: 'detail.code',
  })
  expect(findErrorCode({ code: 'upload_invalid' })).toEqual({ code: 'upload_invalid', path: 'code' })
  expect(findErrorCode({ error: { detail: { code: 'upload_invalid' } } })).toEqual({
    code: 'upload_invalid',
    path: 'error.detail.code',
  })
  expect(findErrorCode({ detail: 'Not Found' })).toBeNull()
})

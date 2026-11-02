import type { MockBackend } from './support/backend'
import { expect, test } from './support/fixtures'
import { signInAsStudent } from './support/signIn'
import { StudentWorld } from './support/student'

/*
 * #504: an exercise's figures, drawn by the production build under the
 * content security policy the CDN sends (#533, enforced here by site.ts).
 *
 * The figure is inline SVG, cleaned by DOMPurify: no eval, no inline script,
 * no style element, so the policy has nothing to refuse. The question's figure
 * also carries what the cleaning must take out, written as the #504 audit
 * wrote it: an `onload`, and paint and a marker from another host in an
 * upper-case `URL(` and a CSS escape. In Chromium, as written, those fetch
 * from that host (and the policy refuses the handler); either would be a
 * problem here, since the suite's backend refuses every other host and every
 * policy violation fails the test.
 */

const SVG = 'http://www.w3.org/2000/svg'
const ELSEWHERE = 'https://figures.elsewhere.example'
const BACKSLASH = String.fromCharCode(92)

const CONE =
  `<svg xmlns="${SVG}" viewBox="0 0 240 120" onload="document.title='ran'">` +
  `<defs><marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="currentColor"/></marker></defs>` +
  `<polygon points="20,100 60,20 100,100" fill="#bbbbbb" stroke="#000000" stroke-width="2"/>` +
  `<rect x="140" y="20" width="60" height="80" fill="URL(${ELSEWHERE}/paint.svg#p)" stroke="currentColor"/>` +
  `<circle cx="120" cy="60" r="4" fill="${BACKSLASH}75 rl(${ELSEWHERE}/escaped.svg#p)"/>` +
  `<line x1="10" y1="110" x2="230" y2="110" stroke="currentColor" marker-end="url(#arrow)" marker-start="URL(${ELSEWHERE}/marker.svg#m)"/>` +
  `<text x="60" y="115" text-anchor="middle" font-size="12">Cone</text>` +
  `<text x="170" y="115" text-anchor="middle" font-size="12">Cylinder</text>` +
  `</svg>`

const option = (inner: string) => `<svg xmlns="${SVG}" viewBox="0 0 120 100">${inner}</svg>`
const OPTION_FIGURES = [
  option('<polygon points="10,90 110,90 70,12" fill="none" stroke="currentColor" stroke-width="2"/>'),
  option('<polygon points="15,90 105,90 15,15" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15,78 L27,78 L27,90" fill="none" stroke="currentColor"/>'),
  option('<polygon points="10,90 75,90 115,30" fill="none" stroke="currentColor" stroke-width="2"/>'),
]

const UNIT = 'reducing'
const LESSON = 'reducing-1'
const CHALLENGE = 'reducing-1-e1'
const PROMPT = 'Which triangle has a right angle?'

/** The chapter of the star StudentWorld's sky has, one lesson of one exercise with figures. */
function installLesson(backend: MockBackend) {
  backend.on('GET', '/practice/curriculum/catalog', () => ({
    status: 200,
    body: {
      subjects: [],
      topics: [],
      units: [{ id: UNIT, subjectId: 'math', gradeLevel: '8', topicId: 'fractions', title: 'Reducing fractions', description: '', rolloutState: 'active', order: 0 }],
      lessons: [
        {
          id: LESSON,
          subjectId: 'math',
          gradeLevel: '8',
          unitId: UNIT,
          topicId: 'fractions',
          title: 'Shapes first',
          objective: '',
          difficulty: 'intro',
          estimatedMinutes: 5,
          rolloutState: 'active',
          exerciseCount: 1,
          source: 'e2e',
        },
      ],
      rolloutSubjects: ['math'],
      includePreview: false,
      source: 'e2e',
    },
  }))
  backend.on('GET', '/practice/{subject_id}/{topic_id}/roadmap', () => ({
    status: 200,
    body: {
      subjectId: 'math',
      topicId: 'fractions',
      gradeLevel: '8',
      topic: { id: 'fractions', subjectId: 'math', gradeLevel: '8', title: 'Fractions', description: '', progress: 0 },
      progress: 0,
      currentLessonId: LESSON,
      units: [
        {
          id: UNIT,
          title: 'Reducing fractions',
          description: '',
          order: 0,
          lessons: [
            { id: LESSON, title: 'Shapes first', order: 1, status: 'current', estimatedMinutes: 5, subjectId: 'math', gradeLevel: '8', topicId: 'fractions', unitId: UNIT, challengeCount: 1 },
          ],
        },
      ],
    },
  }))
  backend.on('GET', '/practice/lessons/{lesson_id}', () => ({
    status: 200,
    body: {
      id: LESSON,
      unitId: UNIT,
      subjectId: 'math',
      gradeLevel: '8',
      topicId: 'fractions',
      title: 'Shapes first',
      topic: 'Reducing fractions',
      difficulty: 'intro',
      status: 'available',
      estimatedMinutes: 5,
      challenges: [
        {
          challengeId: CHALLENGE,
          lessonId: LESSON,
          unitId: UNIT,
          subjectId: 'math',
          gradeLevel: '8',
          topicId: 'fractions',
          topic: 'Reducing fractions',
          type: 'multiple_choice',
          prompt: PROMPT,
          figure: CONE,
          options: ['A', 'B', 'C'],
          optionFigures: OPTION_FIGURES,
          hintAvailable: false,
        },
      ],
    },
  }))
  backend.on('POST', '/practice/challenges/{challenge_id}/answer', ({ body }) => {
    const correct = (body as { answer?: unknown }).answer === 'B'
    return {
      status: 200,
      body: {
        attemptId: 'attempt-1',
        challengeId: CHALLENGE,
        correct,
        standardAnswer: 'B',
        explanation: 'Triangle B has a right angle, marked with the square.',
        feedback: correct ? 'Right.' : 'Not yet.',
        retryAllowed: !correct,
        attemptsRemaining: correct ? 0 : 2,
      },
    }
  })
}

for (const viewport of [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'phone', width: 375, height: 812 },
]) {
  test(`an exercise's figures are drawn under the content security policy, ${viewport.name} (#504)`, async ({ page, backend }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    new StudentWorld(backend).install()
    installLesson(backend)
    await signInAsStudent(page)
    await page.goto(`/chapter/${UNIT}/${LESSON}`)

    const heading = page.getByRole('heading', { level: 2, name: PROMPT })
    await expect(heading).toBeVisible()

    // The question's figure: drawn, under the question, named by it, sized by its viewBox.
    const figure = page.getByRole('img', { name: PROMPT })
    await expect(figure).toBeVisible()
    await expect(figure.locator('svg text').first()).toHaveText('Cone')
    const drawn = await figure.locator('svg').boundingBox()
    expect(drawn && drawn.width > 100 && drawn.height > 40, `the figure has a size: ${JSON.stringify(drawn)}`).toBe(true)
    expect(drawn!.width / drawn!.height).toBeCloseTo(2, 1)
    const headingBox = (await heading.boundingBox())!
    expect(drawn!.y).toBeGreaterThan(headingBox.y + headingBox.height - 1)

    // What the cleaning takes out is not there; its own marker is.
    await expect(figure.locator('svg [onload], svg [fill^="URL" i], svg [marker-start]')).toHaveCount(0)
    await expect(figure.locator('svg')).not.toHaveAttribute('onload', /.*/)
    await expect(figure.locator('line')).toHaveAttribute('marker-end', /^url\(#figure-.+-arrow\)$/)

    // Each option its drawing, with its letter; answered by the letter.
    const options = page.getByRole('radio')
    await expect(options).toHaveCount(3)
    for (let index = 0; index < 3; index += 1) {
      const box = await options.nth(index).locator('xpath=ancestor::label').locator('[data-exercise-figure] svg').boundingBox()
      expect(box && box.width > 40 && box.height > 30, `option ${index} has a drawing: ${JSON.stringify(box)}`).toBe(true)
    }
    await page.getByRole('radio', { name: 'B' }).locator('xpath=ancestor::label').click()
    await page.getByRole('button', { name: 'Check answer' }).click()
    await expect(page.getByText('Triangle B has a right angle, marked with the square.')).toBeVisible()
    expect(backend.callsTo('POST', '/practice/challenges/{challenge_id}/answer').map((call) => call.body)).toEqual([{ answer: 'B' }])

    // Nothing ran and nothing left: no handler, no sideways scroll on a phone.
    expect(await page.title()).not.toBe('ran')
    expect(await page.locator('html').evaluate((root) => root.scrollWidth)).toBeLessThanOrEqual(viewport.width)
  })
}

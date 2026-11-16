import type { MockBackend } from './support/backend'
import { expect, test } from './support/fixtures'
import { signInAsStudent } from './support/signIn'
import { StudentWorld } from './support/student'

/*
 * #692: a lesson's explanation cards (`sections`, stoa-backend#465), drawn by
 * the production build before the lesson's first exercise, formulas typeset,
 * on a phone as on a wide screen. The lesson read is checked against the
 * backend's OpenAPI document, so the cards' shape is the backend's.
 */

const UNIT = 'reducing'
const LESSON = 'reducing-1'
const CHALLENGE = 'reducing-1-e1'
const PROMPT = 'What is the speed?'

const SECTIONS = [
  {
    id: 'card-1',
    title: 'Speed is distance over time',
    body: 'An object that covers the distance $s$ in the time $t$ moves at\n$$v = \\frac{s}{t}$$\nwhich is measured in $\\mathrm{m/s}$.',
  },
  {
    id: 'card-2',
    title: 'Units first',
    body: 'Convert first: $72\\,\\mathrm{km/h} = 20\\,\\mathrm{m/s}$, because $1\\,\\mathrm{m/s} = 3.6\\,\\mathrm{km/h}$.',
  },
]

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
          title: 'Speed',
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
            { id: LESSON, title: 'Speed', order: 1, status: 'current', estimatedMinutes: 5, subjectId: 'math', gradeLevel: '8', topicId: 'fractions', unitId: UNIT, challengeCount: 1 },
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
      title: 'Speed',
      topic: 'Reducing fractions',
      difficulty: 'intro',
      status: 'available',
      estimatedMinutes: 5,
      sections: SECTIONS,
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
          options: ['10 m/s', '20 m/s', '72 m/s'],
          hintAvailable: false,
        },
      ],
    },
  }))
}

for (const viewport of [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'phone', width: 375, height: 812 },
]) {
  test(`a lesson's explanation cards come before its exercise, ${viewport.name} (#692)`, async ({ page, backend }, testInfo) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    new StudentWorld(backend).install()
    installLesson(backend)
    await signInAsStudent(page)
    await page.goto(`/chapter/${UNIT}/${LESSON}`)

    const cards = page.getByRole('region', { name: 'Explanation' })
    await expect(cards).toBeVisible()
    await expect(cards.getByRole('heading', { level: 3 })).toHaveText(SECTIONS.map((section) => section.title))
    // Formulas typeset, the display one on its own line; none left as written.
    await expect(cards.locator('.katex').first()).toBeVisible()
    await expect(cards.locator('.katex-display')).toHaveCount(1)
    await expect(cards).not.toContainText('$')
    await expect(page.getByRole('heading', { level: 2, name: PROMPT })).toHaveCount(0)
    expect(await page.locator('html').evaluate((root) => root.scrollWidth)).toBeLessThanOrEqual(viewport.width)
    await page.screenshot({ path: testInfo.outputPath(`cards-${viewport.name}.png`) })

    await page.getByRole('button', { name: 'Start the exercises' }).click()
    await expect(page.getByRole('heading', { level: 2, name: PROMPT })).toBeFocused()
    await expect(cards).toHaveCount(0)
  })
}

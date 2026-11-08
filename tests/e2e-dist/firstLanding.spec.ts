import { expect, test } from './support/fixtures'
import { signInAsStudent } from './support/signIn'
import { StudentWorld } from './support/student'

// The first landing (#467): a student who has not started anything does not
// open on the whole galaxy but on the recommended star's nebula, the route put
// right to it, with Murmi beside the star; "Look around first" sends Murmi away
// and leaves the camera where it is.
test('a newcomer lands on the recommended star, Murmi beside it, and can wave Murmi away', async ({ page, backend }) => {
  const world = new StudentWorld(backend)
  world.newcomer = true
  world.install()
  await signInAsStudent(page)

  await expect(page).toHaveURL('/map/math/fractions')
  const bubble = page.getByRole('complementary', { name: 'Start here: Reducing fractions' })
  await expect(bubble).toBeVisible()
  await expect(bubble.getByRole('link', { name: 'Start this star' })).toHaveAttribute('href', '/chapter/reducing')

  await bubble.getByRole('button', { name: 'Look around first' }).click()
  await expect(bubble).toBeHidden()
  await expect(page).toHaveURL('/map/math/fractions')
})

// "About you" (#591): a newcomer whose profile has no year group is asked it,
// and the subjects school is on, before the first landing. The answer is
// written as codes; the sky read again recommends by year group, and Murmi
// says so.
test('a newcomer with no year group is asked first, and lands where the year group starts', async ({ page, backend }) => {
  const world = new StudentWorld(backend)
  world.newcomer = true
  world.grade = ''
  world.primarySubjects = []
  world.install()
  await signInAsStudent(page)

  const about = page.getByRole('region', { name: 'About you' })
  await expect(about).toBeVisible()
  const grade = about.getByRole('combobox', { name: 'Your year group' })
  await expect(grade).toBeFocused()
  await expect(about.getByRole('checkbox', { name: 'Mathematics' })).toBeChecked()
  // The landing waits for the answer: the map stays where sign-in put it.
  await expect(page).toHaveURL('/')

  await grade.selectOption({ label: 'Year 6 (primary school)' })
  await about.getByRole('button', { name: 'Done' }).click()

  await expect(about).toBeHidden()
  expect(world.profileWrites).toEqual([{ grade: 'grade_6_primary', primarySubjects: ['math'] }])
  await expect(page).toHaveURL('/map/math/fractions')
  await expect(page.getByRole('complementary', { name: 'For your year group, start here: Reducing fractions' })).toBeVisible()
})

test('"Later" (or Escape) lands as before, and is not asked again in this tab', async ({ page, backend }) => {
  const world = new StudentWorld(backend)
  world.newcomer = true
  world.grade = '6. Klasse'
  world.install()
  await signInAsStudent(page)

  const about = page.getByRole('region', { name: 'About you' })
  await expect(about).toBeVisible()
  // Old text the backend cannot read: nothing chosen.
  await expect(about.getByRole('combobox', { name: 'Your year group' })).toHaveValue('')
  await page.keyboard.press('Escape')

  await expect(about).toBeHidden()
  expect(world.profileWrites).toEqual([])
  await expect(page).toHaveURL('/map/math/fractions')
  await expect(page.getByRole('complementary', { name: 'Start here: Reducing fractions' })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('complementary', { name: 'Start here: Reducing fractions' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'About you' })).toHaveCount(0)
  expect(world.profileWrites).toEqual([])
})

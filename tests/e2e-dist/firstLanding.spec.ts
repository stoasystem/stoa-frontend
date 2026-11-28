import { expect, test } from './support/fixtures'
import { signInAsStudent } from './support/signIn'
import { StudentWorld } from './support/student'

// The first landing (#467; on star clusters #747, #769): a student who has not started anything
// lands on the whole view of the subject's sky of clusters, Murmi beside the cluster that holds
// the recommended star, saying to begin there. The student opens that cluster themselves: its
// learning route scene opens on the recommended star with its card, Murmi there too; "Got it"
// sends Murmi away and leaves the scene as it is; back to the star map is the whole view, with
// neither the landing nor the clusters' hint again.
test('a newcomer lands on the whole view, Murmi beside the cluster to start in, which opens on the recommended star', async ({ page, backend }) => {
  const world = new StudentWorld(backend)
  world.newcomer = true
  world.install()
  await signInAsStudent(page)

  // The whole view, where sign-in put it.
  await expect(page).toHaveURL('/')
  const landing = page.getByRole('complementary', { name: 'Start in this cluster' })
  await expect(landing).toBeVisible()
  await expect(landing).toContainText('Your first star, Reducing fractions, is here.')
  await expect(page.locator('[data-cluster-landing="fractions"]')).toBeVisible()
  await expect(page.getByRole('complementary', { name: 'Your stars are in clusters now' })).toHaveCount(0)

  // The keyboard's way in, as a tap on the cluster.
  await page.locator('[data-nebula-link="fractions"]').focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL('/map/math/cluster/fractions?star=reducing')
  const bubble = page.getByRole('complementary', { name: 'Start here: Reducing fractions' })
  await expect(bubble).toBeVisible()
  const card = page.getByRole('dialog', { name: 'Reducing fractions' })
  await expect(card.getByRole('button', { name: 'Start practising' })).toBeVisible()

  await bubble.getByRole('button', { name: 'Got it' }).click()
  await expect(bubble).toBeHidden()
  await expect(page).toHaveURL('/map/math/cluster/fractions?star=reducing')

  await page.getByRole('button', { name: 'Back to the star map' }).click()
  await expect(page).toHaveURL('/map/math')
  await expect(page.locator('[data-starmap-stage]')).toBeVisible()
  await expect(page.getByRole('complementary', { name: 'Start in this cluster' })).toHaveCount(0)
  await expect(page.getByRole('complementary', { name: 'Your stars are in clusters now' })).toHaveCount(0)
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
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('complementary', { name: 'For your year group, start in this cluster' })).toBeVisible()
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
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('complementary', { name: 'Start in this cluster' })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('complementary', { name: 'Start in this cluster' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'About you' })).toHaveCount(0)
  expect(world.profileWrites).toEqual([])
})

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

import { test as base, expect } from '@playwright/test'
import { MockBackend } from './backend'
import { Contract } from './contract'
import { serveSite } from './site'

type Fixtures = { backend: MockBackend; pageErrors: string[] }
type WorkerFixtures = { contract: Contract }

/**
 * `page` serves the published dist; `backend` answers the API; nothing else
 * is reachable. A test fails if the backend saw anything the contract does
 * not allow, a request went anywhere else, a file was missing, or the page threw.
 */
export const test = base.extend<Fixtures, WorkerFixtures>({
  // Playwright requires the first argument to be a destructuring pattern, even an empty one.
  // eslint-disable-next-line no-empty-pattern
  contract: [async ({}, use) => use(Contract.load()), { scope: 'worker' }],
  pageErrors: async ({ page }, use) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message.slice(0, 300)))
    await use(errors)
    expect(errors, 'uncaught errors on the page').toEqual([])
  },
  backend: async ({ page, contract, pageErrors }, use) => {
    void pageErrors
    const backend = new MockBackend(contract)
    await backend.refuseEverythingElse(page)
    await serveSite(page, backend.problems)
    await backend.attach(page)
    await use(backend)
    expect(backend.problems, 'calls the backend contract does not allow').toEqual([])
  },
})

export { expect }

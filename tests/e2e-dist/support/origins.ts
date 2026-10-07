import path from 'node:path'

/**
 * Where the dist e2e pretends to be served from. Both hosts end in `.test`,
 * which never resolves: every request to them is answered inside Playwright.
 * They are https because the served-release check refuses anything else, and
 * not `localhost`, `staging` or `pilot` because a production release refuses
 * those hosts too.
 */
export const WEB_ORIGIN = 'https://app.stoa-e2e.test'
export const API_ORIGIN = 'https://api.stoa-e2e.test'

/** The backend's contract, owned and kept current by the backend (stoasystem/stoa-backend#80). */
export const OPENAPI_URL = 'https://raw.githubusercontent.com/stoasystem/stoa-backend/main/docs/api/openapi.json'

/** Scratch space for the published copy of dist and the contract; gitignored. */
export function workDir(repoRoot: string) {
  return path.join(repoRoot, '.e2e-dist')
}

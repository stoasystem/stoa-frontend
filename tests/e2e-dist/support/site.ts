import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import type { Page } from '@playwright/test'
import { contentSecurityPolicy } from '../../../scripts/content-security-policy.mjs'
import { contentTypeFor } from '../../../scripts/publish-web-release.mjs'
import { API_ORIGIN, WEB_ORIGIN, workDir } from './origins'
import { S3_ORIGIN } from './uploads'

const repoRoot = path.resolve(import.meta.dirname, '../../..')
const siteDir = path.join(workDir(repoRoot), 'site')

/**
 * Serves the published copy of dist at WEB_ORIGIN, the way the CDN does: a
 * file that exists is returned as it is, with the publisher's content type;
 * a missing file is a 404 and a problem; any other path gets index.html, so
 * the app's router decides.
 *
 * Every page is served under the content security policy, enforced, with this
 * suite's hosts in production's places (#533); a violation is a problem.
 */
export async function serveSite(page: Page, problems: string[]) {
  page.on('console', (message) => {
    if (message.type() === 'error' && /Content Security Policy/.test(message.text())) {
      problems.push(`CSP: ${message.text().slice(0, 300)}`)
    }
  })
  await page.route(`${WEB_ORIGIN}/**`, async (route) => {
    const { pathname } = new URL(route.request().url())
    const relative = decodeURIComponent(pathname).replace(/^\/+/, '') || 'index.html'
    const file = path.join(siteDir, relative)
    const inside = file.startsWith(siteDir + path.sep)
    const found = inside && (await isFile(file))
    // A file the build should have made (it has an extension) is missing:
    // the CDN answers 404 for that, and it is a broken build, not a route.
    if (!found && path.extname(relative) !== '') {
      problems.push(`GET ${pathname}: the site has no such file`)
      await route.fulfill({ status: 404, contentType: 'text/plain', body: 'Not Found' })
      return
    }
    const served = found ? relative : 'index.html'
    await route.fulfill({
      status: 200,
      contentType: contentTypeFor(served),
      headers: { 'cache-control': 'no-store', 'content-security-policy': POLICY },
      body: await readFile(found ? file : path.join(siteDir, 'index.html')),
    })
  })
}

/** The policy production is served with, for this suite's hosts. */
export const POLICY = contentSecurityPolicy({ apiOrigin: API_ORIGIN, uploadOrigin: S3_ORIGIN })

async function isFile(file: string) {
  try {
    return (await stat(file)).isFile()
  } catch {
    return false
  }
}

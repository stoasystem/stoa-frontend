import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import type { Page } from '@playwright/test'
import { contentTypeFor } from '../../../scripts/publish-web-release.mjs'
import { WEB_ORIGIN, workDir } from './origins'

const repoRoot = path.resolve(import.meta.dirname, '../../..')
const siteDir = path.join(workDir(repoRoot), 'site')

/**
 * Serves the published copy of dist at WEB_ORIGIN, the way the CDN does: a
 * file that exists is returned as it is, with the publisher's content type;
 * any other path gets index.html, so the app's router decides.
 */
export async function serveSite(page: Page) {
  await page.route(`${WEB_ORIGIN}/**`, async (route) => {
    const { pathname } = new URL(route.request().url())
    const relative = decodeURIComponent(pathname).replace(/^\/+/, '') || 'index.html'
    const file = path.join(siteDir, relative)
    const inside = file.startsWith(siteDir + path.sep)
    const found = inside && (await isFile(file))
    const served = found ? relative : 'index.html'
    await route.fulfill({
      status: 200,
      contentType: contentTypeFor(served),
      headers: { 'cache-control': 'no-store' },
      body: await readFile(found ? file : path.join(siteDir, 'index.html')),
    })
  })
}

async function isFile(file: string) {
  try {
    return (await stat(file)).isFile()
  } catch {
    return false
  }
}

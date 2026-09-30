/**
 * Runs once before the dist e2e (#29).
 *
 * 1. Copies the built `dist/` to `.e2e-dist/site` and publishes it there with
 *    the real publisher (`scripts/publish-web-release.mjs`) and a stand-in for
 *    the AWS CLI, so `runtime-config.json` and `served-release.json` are made
 *    by the same code, with the same rules, as in production. `dist/` itself is
 *    left as the build wrote it.
 * 2. Fetches the backend's OpenAPI document, the contract every mocked
 *    response and every request the page sends is checked against. It comes
 *    from stoa-backend main (stoasystem/stoa-backend#80) unless
 *    `STOA_OPENAPI_PATH` names a local copy.
 */
import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { PRODUCTION_DEFAULTS, publishWebRelease, sha256Hex } from '../../../scripts/publish-web-release.mjs'
import { API_ORIGIN, OPENAPI_URL, WEB_ORIGIN, workDir } from './origins'

const repoRoot = path.resolve(import.meta.dirname, '../../..')

export default async function globalSetup() {
  const distDir = path.join(repoRoot, 'dist')
  try {
    await stat(path.join(distDir, 'index.html'))
  } catch {
    throw new Error('dist/index.html is missing: run `npm run build` before the dist e2e.')
  }

  const work = workDir(repoRoot)
  const siteDir = path.join(work, 'site')
  await rm(work, { recursive: true, force: true })
  await mkdir(work, { recursive: true })
  await cp(distDir, siteDir, { recursive: true })

  // Answers the three AWS calls the publisher makes; nothing leaves the machine.
  const runner = async (argv: string[]) => {
    if (argv.includes('get-bucket-versioning')) return JSON.stringify({ Status: 'Enabled' })
    if (argv.includes('put-object')) {
      const key = argv[argv.indexOf('--key') + 1]
      return `e2e-${key.replaceAll(/[^A-Za-z0-9]+/g, '')}-version`
    }
    if (argv.includes('create-invalidation')) return 'E2E'
    throw new Error(`unexpected AWS call: ${argv.join(' ')}`)
  }
  // Types come from the JS by inference, which reads each default as the only
  // allowed literal (the production bucket, the production origins).
  const publish = publishWebRelease as unknown as (options: {
    distDir: string
    bucket: string
    distributionId: string
    environment: string
    webOrigin: string
    apiOrigin: string
    features: Readonly<Record<string, boolean>>
    backendArtifactSha256: string
    runner: (argv: string[]) => Promise<string>
  }) => Promise<unknown>
  await publish({
    distDir: siteDir,
    bucket: 'e2e-bucket',
    distributionId: 'E2E',
    environment: PRODUCTION_DEFAULTS.environment,
    webOrigin: WEB_ORIGIN,
    apiOrigin: API_ORIGIN,
    features: PRODUCTION_DEFAULTS.features,
    backendArtifactSha256: sha256Hex('stoa-frontend dist e2e'),
    runner,
  })

  const openapi = process.env.STOA_OPENAPI_PATH
    ? await readFile(process.env.STOA_OPENAPI_PATH, 'utf8')
    : await fetchOpenApi()
  const parsed = JSON.parse(openapi)
  if (typeof parsed.openapi !== 'string' || !parsed.paths || !parsed.components?.schemas) {
    throw new Error('The backend OpenAPI document has no paths or component schemas.')
  }
  await writeFile(path.join(work, 'openapi.json'), openapi, 'utf8')
}

async function fetchOpenApi() {
  const response = await fetch(OPENAPI_URL)
  if (!response.ok) {
    throw new Error(
      `Could not read the backend OpenAPI document (${response.status} ${OPENAPI_URL}). ` +
        'Set STOA_OPENAPI_PATH to a local export to run without it.',
    )
  }
  return response.text()
}

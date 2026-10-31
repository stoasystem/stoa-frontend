/**
 * The content security policy production is served with (#533).
 *
 * CloudFront sends it from stoa-infra's FrontendStack, which copies the value
 * pinned here; a change to the policy is a change in both repositories, and
 * the smoke compares what production sends against `contentSecurityPolicy`.
 * The dist e2e serves the built app under the same policy, enforced, and
 * fails on any violation; its controls show that it does.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { contentSecurityPolicy, PRODUCTION_SOURCES } from '../../scripts/content-security-policy.mjs'

const repoRoot = path.resolve(__dirname, '../..')

const PRODUCTION_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.stoaedu.ch wss://api.stoaedu.ch https://stoa-images-562923011260.s3.eu-central-2.amazonaws.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const file = path.join(directory, name)
    if (statSync(file).isDirectory()) return sourceFiles(file)
    return /\.(ts|tsx)$/.test(name) ? [file] : []
  })
}

describe('the content security policy', () => {
  it('is, for production, exactly the value stoa-infra sends', () => {
    expect(contentSecurityPolicy(PRODUCTION_SOURCES)).toBe(PRODUCTION_POLICY)
  })

  it('names the hosts it is given, by origin, and the API’s WebSocket on the same host', () => {
    const policy = contentSecurityPolicy({
      apiOrigin: 'https://api.example.test/',
      uploadOrigin: 'https://bucket.example.test/some/path?x=1',
    })
    expect(policy).toContain(
      "connect-src 'self' https://api.example.test wss://api.example.test https://bucket.example.test;",
    )
  })

  it('lets no script run but the app’s own files: no inline script, no eval', () => {
    const directives = PRODUCTION_POLICY.split('; ')
    expect(PRODUCTION_POLICY).not.toContain("'unsafe-eval'")
    expect(directives.filter((directive) => directive.includes("'unsafe-inline'"))).toEqual([
      "style-src 'self' 'unsafe-inline'",
    ])
    expect(directives.find((directive) => directive.startsWith('script-src'))).toBe("script-src 'self'")
    const page = readFileSync(path.join(repoRoot, 'index.html'), 'utf8')
    const inline = [...page.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].filter(
      ([, attributes, body]) => !/\bsrc=/.test(attributes) || body.trim() !== '',
    )
    expect(inline).toEqual([])
  })

  it('is met by the HEIC decoder: the app loads the build of heic-to that needs no eval', () => {
    const bare = sourceFiles(path.join(repoRoot, 'src')).filter((file) =>
      /['"]heic-to['"]/.test(readFileSync(file, 'utf8')),
    )
    expect(bare.map((file) => path.relative(repoRoot, file))).toEqual([])
    const prepare = readFileSync(path.join(repoRoot, 'src/services/files/prepareImage.ts'), 'utf8')
    expect(prepare).toContain("import('heic-to/csp')")
  })
})

import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import {
  buildReleaseIdentities,
  buildRuntimeConfig,
  buildServedRelease,
  canonicalize,
  digestCanonical,
  hashFileTree,
  publishWebRelease,
  sha256Hex,
} from '../../scripts/publish-web-release.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const sha = (character) => character.repeat(64)

async function loadRuntimeDigest() {
  const source = await readFile(path.join(repoRoot, 'src/lib/runtimeConfig.ts'), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2020 },
    fileName: 'runtimeConfig.ts',
  })
  const url = `data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`
  const runtime = await import(url)
  return runtime.digestRuntimeConfig
}

test('publisher digest matches the Web client canonical digest', async () => {
  const digestRuntimeConfig = await loadRuntimeDigest()
  const release = buildReleaseIdentities({
    frontendArtifactSha256: sha('3'),
    backendArtifactSha256: sha('4'),
    environment: 'production',
  })
  const config = buildRuntimeConfig({
    release,
    environment: 'production',
    webOrigin: 'https://app.stoaedu.ch',
    apiOrigin: 'https://api.stoaedu.ch',
    features: {
      analytics: false,
      errorMonitoring: false,
      feedback: true,
      parentReports: true,
      payments: false,
      publicRegistration: true,
      realtimeNotifications: true,
      referrals: true,
      supportTickets: true,
      teacherHelp: true,
    },
  })
  assert.equal(await digestRuntimeConfig(config), digestCanonical(config))
  assert.equal(config.realtime.endpoint, 'wss://api.stoaedu.ch/realtime')
  assert.equal(config.web.origin, 'https://app.stoaedu.ch')
})

test('publish uploads hashed assets, then the pointer documents, and refuses an unversioned bucket', async () => {
  const distDir = await mkdir(path.join(os.tmpdir(), `stoa-publish-${Date.now()}`), { recursive: true })
  await mkdir(path.join(distDir, 'assets'), { recursive: true })
  await writeFile(path.join(distDir, 'index.html'), '<html></html>')
  await writeFile(path.join(distDir, 'assets/app.js'), 'console.log(1)')
  await writeFile(path.join(distDir, 'runtime-config.json.template'), '{}')

  const calls = []
  const runner = async (argv) => {
    calls.push(argv)
    if (argv.includes('get-bucket-versioning')) {
      return JSON.stringify({ Status: 'Enabled' })
    }
    if (argv.includes('put-object')) {
      const key = argv[argv.indexOf('--key') + 1]
      return `version-${key.replaceAll(/[^A-Za-z0-9]+/g, '')}-abcdefgh`
    }
    if (argv.includes('create-invalidation')) return 'I0'
    throw new Error(argv.join(' '))
  }

  const result = await publishWebRelease({
    distDir,
    backendArtifactSha256: sha('4'),
    runner,
  })

  const putKeys = calls
    .filter((argv) => argv.includes('put-object'))
    .map((argv) => argv[argv.indexOf('--key') + 1])
  assert.deepEqual(putKeys, [
    'assets/app.js',
    'index.html',
    'runtime-config.json',
    'served-release.json',
  ])
  assert.equal(result.webEntryVersionId.startsWith('version-indexhtml'), true)
  assert.equal(calls.some((argv) => argv.includes('create-invalidation')), true)

  const unversioned = async (argv) => {
    if (argv.includes('get-bucket-versioning')) return JSON.stringify({})
    throw new Error('should not upload')
  }
  await assert.rejects(
    publishWebRelease({ distDir, backendArtifactSha256: sha('4'), runner: unversioned }),
    { code: 'BUCKET_VERSIONING_REQUIRED' },
  )
})

test('tree hash is path-stable and ignores templates', () => {
  const left = hashFileTree([
    { path: 'a.js', sha256: sha('a') },
    { path: 'b.js', sha256: sha('b') },
  ])
  const right = hashFileTree([
    { path: 'a.js', sha256: sha('a') },
    { path: 'b.js', sha256: sha('b') },
  ])
  assert.equal(left, right)
  assert.equal(sha256Hex('x').length, 64)
  const served = buildServedRelease({
    release: buildReleaseIdentities({
      frontendArtifactSha256: sha('3'),
      backendArtifactSha256: sha('4'),
      environment: 'production',
    }),
    environment: 'production',
    webOrigin: 'https://app.stoaedu.ch',
    runtimeConfigSha256: sha('5'),
    runtimeVersionId: 'runtime-version_A1b2c3d4',
    webEntrySha256: sha('6'),
    webEntryVersionId: 'web-version_E5f6g7h8',
  })
  assert.equal(JSON.parse(canonicalize(served)).runtimeConfig.key, 'runtime-config.json')
})

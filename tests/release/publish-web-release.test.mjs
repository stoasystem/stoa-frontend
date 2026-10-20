import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath, URL } from 'node:url'
import ts from 'typescript'
import {
  buildReleaseIdentities,
  buildRuntimeConfig,
  buildServedRelease,
  canonicalize,
  digestCanonical,
  hashFileTree,
  PRODUCTION_DEFAULTS,
  publishWebRelease,
  runtimeConfigKeyFor,
  sha256Hex,
} from '../../scripts/publish-web-release.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const sha = (character) => character.repeat(64)

async function loadRuntimeModule() {
  const source = await readFile(path.join(repoRoot, 'src/lib/runtimeConfig.ts'), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2020 },
    fileName: 'runtimeConfig.ts',
  })
  const url = `data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`
  return import(url)
}

async function loadRuntimeDigest() {
  return (await loadRuntimeModule()).digestRuntimeConfig
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

test('production publishes no realtime endpoint until the WebSocket exists', async () => {
  // Card 029 [D-03]: /realtime answers 400, so production must not advertise it.
  const runtime = await loadRuntimeModule()
  const release = buildReleaseIdentities({
    frontendArtifactSha256: sha('3'),
    backendArtifactSha256: sha('4'),
    environment: 'production',
  })
  const config = buildRuntimeConfig({
    release,
    environment: PRODUCTION_DEFAULTS.environment,
    webOrigin: PRODUCTION_DEFAULTS.webOrigin,
    apiOrigin: PRODUCTION_DEFAULTS.apiOrigin,
    features: PRODUCTION_DEFAULTS.features,
  })
  assert.deepEqual(config.realtime, { enabled: false, endpoint: null })
  assert.equal(config.features.realtimeNotifications, false)
  const parsed = await runtime.validateRuntimeConfig(config, {
    expectedDigest: digestCanonical(config),
    expectedRelease: { ...config.release },
    expectedEnvironment: 'production',
    expectedWebOrigin: PRODUCTION_DEFAULTS.webOrigin,
  })
  assert.equal(parsed.realtime.endpoint, null)
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
  // #344: the digest-named config before anything that could lead to it, the
  // descriptor - the only object overwritten in place - last.
  assert.equal(result.runtimeConfigKey, runtimeConfigKeyFor(result.runtimeConfigSha256))
  assert.deepEqual(putKeys, [
    'assets/app.js',
    result.runtimeConfigKey,
    'index.html',
    'served-release.json',
  ])
  assert.equal(result.webEntryVersionId.startsWith('version-indexhtml'), true)
  const configPut = calls.find((argv) => argv.includes(result.runtimeConfigKey))
  assert.equal(configPut[configPut.indexOf('--cache-control') + 1], 'public,max-age=31536000,immutable')
  assert.equal(configPut[configPut.indexOf('--content-type') + 1], 'application/json')
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
  const parsed = JSON.parse(canonicalize(served))
  assert.equal(parsed.runtimeConfig.key, `runtime-config.${sha('5')}.json`)
  assert.equal(parsed.runtimeConfig.url, `https://app.stoaedu.ch/runtime-config.${sha('5')}.json`)
  assert.throws(() => runtimeConfigKeyFor('latest'), { code: 'RELEASE_HASH_INVALID' })
})

// ---- What a visitor can see while a publish runs (#344) --------------------
// A bucket in memory: every put lands at once, as S3 does per object. After
// each one, a visitor starts the app the way src/bootstrap.ts does - the
// descriptor, then the config it names, checked by the client's own code.

async function loadServedModule() {
  const source = await readFile(path.join(repoRoot, 'src/lib/servedRelease.ts'), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2020 },
    fileName: 'servedRelease.ts',
  })
  return import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`)
}

function memoryBucket() {
  const objects = new Map()
  let versions = 0
  return {
    objects,
    async put(key, bodyPath) {
      versions += 1
      objects.set(key, await readFile(bodyPath, 'utf8'))
      return `memory-version-${String(versions).padStart(8, '0')}`
    },
  }
}

async function visitorStarts(bucket, webOrigin) {
  const served = await loadServedModule()
  const runtime = await loadRuntimeModule()
  const fetchImpl = async (url) => {
    const key = new URL(url).pathname.slice(1)
    const body = bucket.objects.get(key)
    if (body === undefined) {
      return { ok: false, status: 404, redirected: false, url, headers: { get: () => null }, text: async () => '' }
    }
    return {
      ok: true,
      status: 200,
      redirected: false,
      url,
      headers: { get: (name) => (name.toLowerCase() === 'content-type' ? 'application/json' : null) },
      text: async () => body,
    }
  }
  const descriptor = await served.loadServedRelease({ webOrigin, fetchImpl })
  const options = served.toRuntimeConfigLoadOptions(descriptor, { expectedWebOrigin: webOrigin })
  return runtime.loadRuntimeConfig({ ...options, fetchImpl })
}

// Publishes `distDir` into `bucket`; `onPut` runs after each upload lands, and
// the upload of `failOn` fails the way an AWS CLI error does.
function publishInto(bucket, { distDir, backend, failOn }) {
  const runner = async (argv) => {
    if (argv.includes('get-bucket-versioning')) return JSON.stringify({ Status: 'Enabled' })
    if (argv.includes('create-invalidation')) return 'I0'
    if (!argv.includes('put-object')) throw new Error(argv.join(' '))
    const key = argv[argv.indexOf('--key') + 1]
    if (key === failOn) throw new Error(`upload of ${key} failed`)
    return bucket.put(key, argv[argv.indexOf('--body') + 1])
  }
  return {
    run: (onPut) => publishWebRelease({
      distDir,
      backendArtifactSha256: sha(backend),
      environment: 'staging',
      webOrigin: 'https://staging.stoaedu.ch',
      apiOrigin: 'https://api.staging.stoaedu.ch',
      runner: async (argv) => {
        const out = await runner(argv)
        if (argv.includes('put-object')) await onPut(argv[argv.indexOf('--key') + 1])
        return out
      },
    }),
  }
}

async function freshDist(label, script) {
  const distDir = await mkdir(path.join(os.tmpdir(), `stoa-publish-${label}-${Date.now()}-${Math.random().toString(16).slice(2)}`), { recursive: true })
  await mkdir(path.join(distDir, 'assets'), { recursive: true })
  await writeFile(path.join(distDir, 'index.html'), `<html>${label}</html>`)
  await writeFile(path.join(distDir, `assets/${label}.js`), script)
  return distDir
}

test('a visitor arriving between any two uploads of a publish starts one whole release', async () => {
  const webOrigin = 'https://staging.stoaedu.ch'
  const bucket = memoryBucket()
  const first = publishInto(bucket, { distDir: await freshDist('a', 'console.log(1)'), backend: '4' })
  const released = await first.run(async () => {})
  assert.equal((await visitorStarts(bucket, webOrigin)).release.releaseId, released.release.releaseId)

  const second = publishInto(bucket, { distDir: await freshDist('b', 'console.log(2)'), backend: '7' })
  const seen = []
  const next = await second.run(async (key) => {
    const config = await visitorStarts(bucket, webOrigin)
    seen.push([key, config.release.releaseId])
  })
  assert.notEqual(next.release.releaseId, released.release.releaseId)
  // Every visitor before the descriptor lands gets the first release, whole;
  // the one after it gets the second.
  assert.deepEqual(seen, [
    ['assets/b.js', released.release.releaseId],
    [next.runtimeConfigKey, released.release.releaseId],
    ['index.html', released.release.releaseId],
    ['served-release.json', next.release.releaseId],
  ])
})

test('a publish that fails before its descriptor lands leaves the served release working', async () => {
  const webOrigin = 'https://staging.stoaedu.ch'
  for (const failOn of ['index.html', 'served-release.json']) {
    const bucket = memoryBucket()
    const first = publishInto(bucket, { distDir: await freshDist('a', 'console.log(1)'), backend: '4' })
    const released = await first.run(async () => {})
    const second = publishInto(bucket, { distDir: await freshDist('b', 'console.log(2)'), backend: '7', failOn })
    await assert.rejects(second.run(async () => {}), /upload of/, failOn)
    const config = await visitorStarts(bucket, webOrigin)
    assert.equal(config.release.releaseId, released.release.releaseId, failOn)
  }
})

// ---- Production deploy workflow --------------------------------------------
// These pins used to sit in the preview section (#28), beside the checks that
// the preview never called production. The preview workflow is gone with
// app-planet; what it guarded about production stays. Line-based, so no YAML
// dependency, and strict about indentation because GitHub reads it that way.

const PRODUCTION_WORKFLOW = '.github/workflows/deploy-production.yml'

async function readWorkflow(relativePath) {
  return (await readFile(path.join(repoRoot, relativePath), 'utf8')).split(/\r?\n/)
}

const isComment = (line) => /^\s*#/.test(line)
const indentOf = (line) => line.match(/^ */)[0].length

// Lines of a top-level key's block, up to the next top-level key. Comments
// and blank lines never end it.
function topLevel(lines, key) {
  const start = lines.findIndex((line) => line === `${key}:` || line.startsWith(`${key}: `))
  assert.ok(start >= 0, `the workflow has a top-level \`${key}\``)
  let end = start + 1
  while (end < lines.length) {
    const line = lines[end]
    if (line.trim() && !isComment(line) && indentOf(line) === 0) break
    end += 1
  }
  return lines.slice(start, end)
}

test('the production workflow deploys only from main, to the publisher defaults, as the frontend role', async () => {
  const production = await readWorkflow(PRODUCTION_WORKFLOW)
  assert.deepEqual(
    topLevel(production, 'on').filter((line) => line.trim() && !isComment(line)),
    ['on:', '  push:', '    branches: [main]'],
    'a push to main is the only trigger',
  )
  const text = production.join('\n')
  // Only what GitHub runs: a comment may well mention the old preview.
  const code = production.filter((line) => !isComment(line)).join('\n')
  assert.doesNotMatch(code, /preview|planet|vars\.|environment:/, 'no preview target, no variable-driven target, no Environment')
  assert.match(text, /^ {10}role-to-assume: arn:aws:iam::562923011260:role\/stoa-github-frontend-deploy$/m)
  assert.match(text, /^ {12}git -C stoa-backend rev-parse HEAD \| sha256sum \| awk '\{print \$1\}'$/m,
    'the backend artifact hash comes from the checked-out backend')
  assert.match(text, /^ {10}node scripts\/publish-web-release\.mjs \\\n {12}--dist dist \\\n {12}--backend-artifact-sha256 "\$backend_artifact_sha256"$/m,
    'production publishes to the publisher defaults, with no bucket or distribution override')
})

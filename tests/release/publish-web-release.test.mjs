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
  PRODUCTION_DEFAULTS,
  publishWebRelease,
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

// ---- Preview deploy workflow (#28) ----------------------------------------
// deploy-preview.yml publishes redesign/planet to app-planet.stoaedu.ch. These
// tests pin its shape the way verify-release.test.mjs pins the production
// gate (#101): line-based, so no YAML dependency, and strict about indentation
// because GitHub reads it that way. The Publisher tests step runs this file in
// the production, redesign and preview gates, and `test:release` is untouched,
// so the release verifier's fixed list does not change.

const PREVIEW_WORKFLOW = '.github/workflows/deploy-preview.yml'
const PRODUCTION_WORKFLOW = '.github/workflows/deploy-production.yml'
const PREVIEW_BRANCH = 'redesign/planet'
const PREVIEW_WEB_ORIGIN = 'https://app-planet.stoaedu.ch'
const PREVIEW_JOB_IF = `if: github.ref == 'refs/heads/${PREVIEW_BRANCH}'`

async function readWorkflow(relativePath) {
  return (await readFile(path.join(repoRoot, relativePath), 'utf8')).split(/\r?\n/)
}

const isComment = (line) => /^\s*#/.test(line)
const indentOf = (line) => line.match(/^ */)[0].length

// Lines of a block that starts at a key, up to the next key at the same or a
// lower indent. Comments and blank lines never end it.
function blockAt(lines, start) {
  assert.ok(start >= 0, 'the block exists')
  const indent = indentOf(lines[start])
  let end = start + 1
  while (end < lines.length) {
    const line = lines[end]
    if (line.trim() && !isComment(line) && indentOf(line) <= indent) break
    end += 1
  }
  return lines.slice(start, end)
}

function topLevel(lines, key) {
  const at = lines.findIndex((line) => line === `${key}:` || line.startsWith(`${key}: `))
  assert.ok(at >= 0, `the workflow has a top-level \`${key}\``)
  return blockAt(lines, at)
}

function jobsOf(lines) {
  const jobs = topLevel(lines, 'jobs')
  const result = new Map()
  jobs.forEach((line, index) => {
    const match = line.match(/^ {2}([A-Za-z][\w-]*):\s*$/)
    if (match) result.set(match[1], blockAt(jobs, index))
  })
  return result
}

function stepsOf(job) {
  const starts = job.flatMap((line, index) => (/^ {6}- /.test(line) ? [index] : []))
  return starts.map((start, i) => job
    .slice(start, starts[i + 1] ?? job.length)
    .filter((line) => line.trim() && !isComment(line)))
}

const stepName = (step) => step[0].match(/^ {6}- name: (.+?)\s*$/)?.[1]
const stepText = (step) => step.join('\n')
const jobKey = (job, key) => job.filter((line) => new RegExp(`^ {4}${key}:`).test(line))
const trimmed = (lines) => lines.filter((line) => line.trim() && !isComment(line)).map((line) => line.trim())

test('the preview workflow triggers only on redesign/planet and a dispatch with no inputs', async () => {
  const on = topLevel(await readWorkflow(PREVIEW_WORKFLOW), 'on').filter((line) => line.trim() && !isComment(line))
  assert.deepEqual(on, [
    'on:',
    '  push:',
    `    branches: [${PREVIEW_BRANCH}]`,
    '  workflow_dispatch:',
  ], 'push to redesign/planet and an input-less workflow_dispatch are the only triggers')
})

test('every preview job is held to redesign/planet, and one job maps it to one Environment', async () => {
  const lines = await readWorkflow(PREVIEW_WORKFLOW)
  const jobs = jobsOf(lines)
  assert.deepEqual([...jobs.keys()], ['verify', 'deploy-planet'])
  for (const [name, job] of jobs) {
    assert.deepEqual(trimmed(jobKey(job, 'if')), [PREVIEW_JOB_IF], `${name} has the branch \`if\``)
  }
  // The one mapping: exactly one Environment, exactly one branch ref.
  assert.equal(lines.filter((line) => /^\s+environment:/.test(line)).length, 1, 'one job names an Environment')
  const deploy = jobs.get('deploy-planet')
  assert.deepEqual(trimmed(blockAt(deploy, deploy.indexOf('    environment:'))), [
    'environment:',
    'name: preview-planet',
    `url: ${PREVIEW_WEB_ORIGIN}`,
  ])
  const code = lines.filter((line) => !isComment(line)).join('\n')
  assert.deepEqual([...new Set(code.match(/refs\/heads\/[\w./-]+/g))], [`refs/heads/${PREVIEW_BRANCH}`])
  assert.doesNotMatch(code, /redesign\/cute|preview-cute|\binputs\b/, 'no second target and no dispatch inputs')
})

test('the preview publish is serialised per target and never cancelled', async () => {
  const lines = await readWorkflow(PREVIEW_WORKFLOW)
  const deploy = jobsOf(lines).get('deploy-planet')
  assert.deepEqual(trimmed(blockAt(deploy, deploy.indexOf('    concurrency:'))), [
    'concurrency:',
    'group: frontend-preview-planet',
    'cancel-in-progress: false',
  ])
  assert.ok(!lines.some((line) => /cancel-in-progress:\s*true/.test(line)), 'nothing cancels a run in progress')
  const production = await readWorkflow(PRODUCTION_WORKFLOW)
  assert.ok(!production.some((line) => /frontend-preview-planet/.test(line)), 'production does not share the group')
})

test('the preview gate runs every production gate step, unsoftened, before the publish job', async () => {
  const preview = jobsOf(await readWorkflow(PREVIEW_WORKFLOW))
  const production = jobsOf(await readWorkflow(PRODUCTION_WORKFLOW))
  const gate = stepsOf(preview.get('verify'))
  assert.deepEqual(gate.map(stepName), [
    'Check out frontend',
    'Set up Node.js',
    'Install locked dependencies',
    'Lint',
    'Typecheck',
    'API contract guard',
    'Translation guard',
    'Contrast guard',
    'Unit tests',
    'Release contract tests',
    'Release verifier tests',
    'Publisher tests',
  ])
  // Every production gate step is here with the same commands and action pins.
  for (const step of stepsOf(production.get('verify'))) {
    const twin = gate.find((candidate) => stepName(candidate) === stepName(step))
    assert.ok(twin, `the preview gate has production's \`${stepName(step)}\` step`)
    assert.equal(stepText(twin), stepText(step), `\`${stepName(step)}\` matches production`)
  }
  const runOf = (name) => stepText(gate.find((step) => stepName(step) === name))
  assert.match(runOf('Contrast guard'), /\n {8}run: npm run check:contrast$/)
  assert.match(runOf('Release verifier tests'), /\n {8}run: node --test tests\/release\/verify-release\.test\.mjs$/)
  assert.match(runOf('Publisher tests'), /\n {8}run: node --test tests\/release\/publish-web-release\.test\.mjs$/)

  const softening = /^\s*(- )?(if|continue-on-error):/
  for (const [name, job] of preview) {
    for (const step of stepsOf(job)) {
      assert.ok(!step.some((line) => softening.test(line)), `\`${stepName(step)}\` in ${name} has no \`if:\` or \`continue-on-error:\``)
    }
    assert.deepEqual(jobKey(job, 'continue-on-error'), [], `${name} has no continue-on-error`)
  }
  const deploy = preview.get('deploy-planet')
  assert.deepEqual(trimmed(jobKey(deploy, 'needs')), ['needs: verify'])
  assert.deepEqual(stepsOf(deploy).map(stepName), [
    'Check out frontend',
    'Check out backend',
    'Set up Node.js',
    'Install locked dependencies',
    'Build',
    'Check preview target',
    'Configure AWS credentials (OIDC)',
    'Publish served release',
  ])
  const build = stepText(stepsOf(deploy).find((step) => stepName(step) === 'Build'))
  assert.match(build, /\n {8}run: npm run build$/)
})

test('only the publish job may mint an OIDC token, as the preview role in the production region', async () => {
  const lines = await readWorkflow(PREVIEW_WORKFLOW)
  assert.deepEqual(trimmed(topLevel(lines, 'permissions')), ['permissions:', 'contents: read'])
  const jobs = jobsOf(lines)
  assert.deepEqual(jobKey(jobs.get('verify'), 'permissions'), [], 'the gate keeps the read-only default')
  const deploy = jobs.get('deploy-planet')
  assert.deepEqual(trimmed(blockAt(deploy, deploy.indexOf('    permissions:'))), [
    'permissions:',
    'contents: read',
    'id-token: write',
  ])
  assert.equal(lines.filter((line) => /id-token:/.test(line)).length, 1, 'id-token appears once')

  const aws = stepText(stepsOf(deploy).find((step) => stepName(step) === 'Configure AWS credentials (OIDC)'))
  assert.match(aws, /^ {10}role-to-assume: arn:aws:iam::562923011260:role\/stoa-github-frontend-preview$/m)
  const productionRegion = (await readWorkflow(PRODUCTION_WORKFLOW)).filter((line) => /aws-region:/.test(line))
  assert.deepEqual(aws.match(/^\s+aws-region: .+$/gm), productionRegion, 'same region as production')
  assert.doesNotMatch(lines.join('\n'), /stoa-github-frontend-deploy/, 'never the production role')
})

test('the preview publish names its bucket, distribution and origins, and refuses production targets', async () => {
  const deploy = jobsOf(await readWorkflow(PREVIEW_WORKFLOW)).get('deploy-planet')
  const steps = stepsOf(deploy)
  const publish = stepText(steps.find((step) => stepName(step) === 'Publish served release'))
  const call = publish.slice(publish.indexOf('node scripts/publish-web-release.mjs'))
  const flags = [...call.matchAll(/--([a-z0-9-]+)(?: +("[^"]*"|[^\s\\]+))?/g)].map(([, flag, value]) => [flag, value])
  assert.deepEqual(flags, [
    ['dist', 'dist'],
    ['bucket', '"$PREVIEW_BUCKET"'],
    ['distribution-id', '"$PREVIEW_DISTRIBUTION_ID"'],
    ['web-origin', PREVIEW_WEB_ORIGIN],
    ['api-origin', PRODUCTION_DEFAULTS.apiOrigin],
    ['backend-artifact-sha256', '"$backend_artifact_sha256"'],
  ])
  assert.notEqual(PREVIEW_WEB_ORIGIN, PRODUCTION_DEFAULTS.webOrigin)
  // Variables reach the shell through env, never interpolated into the script.
  for (const name of ['PREVIEW_BUCKET', 'PREVIEW_DISTRIBUTION_ID']) {
    assert.match(publish, new RegExp(`^ {10}${name}: \\$\\{\\{ vars\\.${name} \\}\\}$`, 'm'))
  }
  const script = publish.slice(publish.indexOf('run: |'))
  assert.doesNotMatch(script, /\$\{\{/, 'no expression inside the publish script')

  // Same backend hash as production takes it.
  const production = stepText(stepsOf(jobsOf(await readWorkflow(PRODUCTION_WORKFLOW)).get('deploy'))
    .find((step) => stepName(step) === 'Publish served release'))
  const hashLine = /git -C stoa-backend rev-parse HEAD \| sha256sum \| awk '\{print \$1\}'/
  assert.match(publish, hashLine)
  assert.match(production, hashLine)

  // An empty variable would fall back to production's bucket and distribution;
  // the check step stops that before any credentials exist.
  const check = stepText(steps.find((step) => stepName(step) === 'Check preview target'))
  assert.match(check, /set -euo pipefail/)
  assert.doesNotMatch(check.slice(check.indexOf('run: |')), /\$\{\{/)
  assert.ok(check.includes(`!= "${PRODUCTION_DEFAULTS.bucket}"`), 'refuses the production bucket')
  assert.ok(check.includes(`!= "${PRODUCTION_DEFAULTS.distributionId}"`), 'refuses the production distribution')
})

test('the production workflow stays production-only and the preview never calls it', async () => {
  const preview = await readWorkflow(PREVIEW_WORKFLOW)
  const code = preview.filter((line) => !isComment(line)).join('\n')
  assert.doesNotMatch(code, /deploy-production|workflow_run|workflow_call|uses: \.\//)
  const production = await readWorkflow(PRODUCTION_WORKFLOW)
  assert.deepEqual(topLevel(production, 'on').filter((line) => line.trim()), ['on:', '  push:', '    branches: [main]'])
  const text = production.join('\n')
  assert.doesNotMatch(text, /preview|planet|vars\.|environment:/, 'production has no preview target')
  assert.match(text, /^ {10}role-to-assume: arn:aws:iam::562923011260:role\/stoa-github-frontend-deploy$/m)
  assert.match(text, /^ {12}--dist dist \\\n {12}--backend-artifact-sha256 "\$backend_artifact_sha256"$/m,
    'production still publishes to the publisher defaults')
})

test('a release published for the preview origin is accepted by the Web client there', async () => {
  const runtime = await loadRuntimeModule()
  const release = buildReleaseIdentities({
    frontendArtifactSha256: sha('3'),
    backendArtifactSha256: sha('4'),
    environment: PRODUCTION_DEFAULTS.environment,
  })
  const config = buildRuntimeConfig({
    release,
    environment: PRODUCTION_DEFAULTS.environment,
    webOrigin: PREVIEW_WEB_ORIGIN,
    apiOrigin: PRODUCTION_DEFAULTS.apiOrigin,
    features: PRODUCTION_DEFAULTS.features,
  })
  const parsed = await runtime.validateRuntimeConfig(config, {
    expectedDigest: digestCanonical(config),
    expectedRelease: { ...config.release },
    expectedEnvironment: PRODUCTION_DEFAULTS.environment,
    expectedWebOrigin: PREVIEW_WEB_ORIGIN,
  })
  assert.equal(parsed.web.origin, PREVIEW_WEB_ORIGIN)
  assert.equal(parsed.api.origin, PRODUCTION_DEFAULTS.apiOrigin)

  const source = await readFile(path.join(repoRoot, 'src/lib/servedRelease.ts'), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2020 },
    fileName: 'servedRelease.ts',
  })
  const servedModule = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`)
  const served = buildServedRelease({
    release,
    environment: PRODUCTION_DEFAULTS.environment,
    webOrigin: PREVIEW_WEB_ORIGIN,
    runtimeConfigSha256: digestCanonical(config),
    runtimeVersionId: 'runtime-version_A1b2c3d4',
    webEntrySha256: sha('6'),
    webEntryVersionId: 'web-version_E5f6g7h8',
  })
  const accepted = servedModule.validateServedRelease(JSON.parse(canonicalize(served)), {
    expectedWebOrigin: PREVIEW_WEB_ORIGIN,
  })
  assert.equal(accepted.runtimeConfig.url, `${PREVIEW_WEB_ORIGIN}/runtime-config.json`)
  assert.equal(accepted.webEntry.url, `${PREVIEW_WEB_ORIGIN}/index.html`)
})

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { TestInfo } from '@playwright/test'

/**
 * What one run observed, kept on this machine for the person who reports it.
 *
 * `.smoke/` at the repository root (ignored by git), or `STOA_SMOKE_STATE_DIR`:
 *   runs/<runId>.json   every observation, the generation requests spent, the
 *                       AI answers waiting for a person to confirm them
 *   state.json          what outlives a run: the conversation ids already seen,
 *                       per deployment, which item 6 checks are still listed
 *   lambda-versions.json  written by record-lambda-versions.sh before a run
 *
 * Nothing here holds a token or a password.
 */

/** #27: at most five generation requests per run, retries included. */
export const MAX_GENERATION_REQUESTS_PER_RUN = 5

export function stateDir(): string {
  return process.env.STOA_SMOKE_STATE_DIR ?? fileURLToPath(new URL('../../.smoke', import.meta.url))
}

/** Set once per `playwright test` by global-setup.ts, so a restarted worker keeps it. */
export function runId(): string {
  const id = process.env.STOA_SMOKE_RUN_ID
  if (!id) throw new Error('STOA_SMOKE_RUN_ID is not set; run through playwright.smoke.config.ts')
  return id
}

type RunRecord = {
  runId: string
  entries: Array<{ at: string; item: string; test: string; data: unknown }>
  generationRequests: Array<{ at: string; label: string }>
}

function runFile(): string {
  return join(stateDir(), 'runs', `${runId()}.json`)
}

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as T
  } catch {
    return fallback
  }
}

function writeJson(file: string, value: unknown): void {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

function readRun(): RunRecord {
  return readJson<RunRecord>(runFile(), { runId: runId(), entries: [], generationRequests: [] })
}

/** Keep an observation in the run record, on the test's report, and on the console. */
export async function record(testInfo: TestInfo, item: string, data: unknown): Promise<void> {
  const run = readRun()
  run.entries.push({ at: new Date().toISOString(), item, test: testInfo.title, data })
  writeJson(runFile(), run)
  const text = JSON.stringify(data, null, 2)
  await testInfo.attach(`${item}.json`, { body: text, contentType: 'application/json' })
  console.log(`[smoke ${item}] ${text}`)
}

/**
 * Count one generation request against the run's budget before it is sent.
 *
 * Throws instead of sending once five are spent, so a retried or repeated
 * test cannot go past #27's limit; a worker restarted after a failure reads
 * the same count from the run file.
 */
export function spendGeneration(label: string): number {
  const run = readRun()
  if (run.generationRequests.length >= MAX_GENERATION_REQUESTS_PER_RUN) {
    throw new Error(
      `generation budget spent: ${run.generationRequests.length} of ` +
        `${MAX_GENERATION_REQUESTS_PER_RUN} requests this run (${run.generationRequests
          .map((entry) => entry.label)
          .join(', ')}); not sending "${label}"`,
    )
  }
  run.generationRequests.push({ at: new Date().toISOString(), label })
  writeJson(runFile(), run)
  return run.generationRequests.length
}

type DeploymentState = { studentConversationIds: string[] }

function stateFile(): string {
  return join(stateDir(), 'state.json')
}

export function deploymentState(baseURL: string): DeploymentState {
  const all = readJson<Record<string, DeploymentState>>(stateFile(), {})
  return all[baseURL] ?? { studentConversationIds: [] }
}

/** Remember conversation ids as seen; ids are only ever added. */
export function rememberConversations(baseURL: string, ids: readonly string[]): void {
  const all = readJson<Record<string, DeploymentState>>(stateFile(), {})
  const known = new Set(all[baseURL]?.studentConversationIds ?? [])
  for (const id of ids) known.add(id)
  all[baseURL] = { studentConversationIds: [...known] }
  writeJson(stateFile(), all)
}

export function readStateFile<T>(name: string): T | null {
  return readJson<T | null>(join(stateDir(), name), null)
}

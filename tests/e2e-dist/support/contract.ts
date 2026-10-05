import { readFileSync } from 'node:fs'
import path from 'node:path'
import { Ajv2020, type ValidateFunction } from 'ajv/dist/2020.js'
import addFormatsModule from 'ajv-formats'
import { workDir } from './origins'

type Json = null | boolean | number | string | Json[] | { [key: string]: Json }
type Parameter = { name: string; in: string; required?: boolean }
type Operation = {
  parameters?: Parameter[]
  requestBody?: { content?: Record<string, { schema?: Json }> }
  responses?: Record<string, { content?: Record<string, { schema?: Json }> }>
}
type OpenApi = { paths: Record<string, Record<string, Operation>>; components: { schemas: Record<string, Json> } }

export type MatchedOperation = { template: string; method: string; operation: Operation }

/**
 * FastAPI's HTTPException body: `detail` is a message, or the stable public
 * fields `{ code, message, correlationId }` the backend's error registries give.
 */
const ERROR_ENVELOPE: Json = {
  type: 'object',
  required: ['detail'],
  properties: {
    detail: {
      anyOf: [
        { type: 'string' },
        {
          type: 'object',
          required: ['code', 'message'],
          properties: { code: { type: 'string' }, message: { type: 'string' }, correlationId: { type: 'string' } },
        },
      ],
    },
  },
}

/** Absolute, so references resolve the same from every compiled check. */
const DOC_ID = 'https://stoa-e2e.test/openapi.json'
const addFormats = addFormatsModule as unknown as (ajv: Ajv2020) => Ajv2020

/**
 * The backend's OpenAPI document, used to check both sides of every mocked
 * call: the body the page sends, and the body the mock answers with.
 *
 * Checks are stricter than the backend's own validation in one way: an object
 * may only carry the properties its schema names. The backend would ignore an
 * extra property, but a mock that sends one is describing a field the backend
 * does not have -- a renamed optional field would otherwise pass unnoticed.
 */
export class Contract {
  private readonly doc: OpenApi
  private readonly ajv: Ajv2020
  private readonly compiled = new Map<string, ValidateFunction>()

  constructor(doc: OpenApi) {
    this.doc = doc
    this.ajv = new Ajv2020({ strict: false, allErrors: true, validateFormats: true })
    addFormats(this.ajv)
    this.ajv.addSchema({ $id: DOC_ID, components: closeObjects(doc.components) as Json })
  }

  static load(): Contract {
    const repoRoot = path.resolve(import.meta.dirname, '../../..')
    const file = path.join(workDir(repoRoot), 'openapi.json')
    return new Contract(JSON.parse(readFileSync(file, 'utf8')) as OpenApi)
  }

  /** The operation a request goes to; a literal segment wins over a parameter. */
  match(method: string, pathname: string): MatchedOperation | null {
    const lower = method.toLowerCase()
    const candidates = Object.entries(this.doc.paths)
      .filter(([template, item]) => item[lower] && templatePattern(template).test(pathname))
      .sort(([left], [right]) => paramCount(left) - paramCount(right))
    const found = candidates[0]
    return found ? { template: found[0], method: lower, operation: found[1][lower] } : null
  }

  /** Why a request body breaks the contract, or null when it keeps it. */
  checkRequest(op: MatchedOperation, body: unknown): string | null {
    const schema = op.operation.requestBody?.content?.['application/json']?.schema
    if (schema === undefined) return body === undefined ? null : 'sends a body the operation does not take'
    if (typeof body === 'string') return 'sends a body that is not JSON'
    return this.check(`${op.method} ${op.template} request`, schema, body)
  }

  /** Why a query string breaks the contract: a required parameter missing, or one the operation does not take. */
  checkQuery(op: MatchedOperation, query: URLSearchParams): string | null {
    const declared = (op.operation.parameters ?? []).filter((parameter) => parameter.in === 'query')
    const missing = declared.filter((parameter) => parameter.required && !query.has(parameter.name)).map((p) => p.name)
    const known = new Set(declared.map((parameter) => parameter.name))
    const unknown = [...new Set(query.keys())].filter((name) => !known.has(name))
    const faults = [
      missing.length ? `missing required ${missing.join(', ')}` : '',
      unknown.length ? `sends ${unknown.join(', ')}, which the operation does not take` : '',
    ].filter(Boolean)
    return faults.length ? faults.join('; ') : null
  }

  /** Why a response breaks the contract, or null when it keeps it. */
  checkResponse(op: MatchedOperation, status: number, body: unknown): string | null {
    const response = op.operation.responses?.[String(status)]
    // The backend's OpenAPI declares no error responses beyond 422, so an
    // undeclared 4xx is held to the envelope every HTTPException has instead.
    if (!response && status >= 400 && status < 500) return this.check('error envelope', ERROR_ENVELOPE, body)
    if (!response) return `answers ${status}, which the operation does not declare`
    const schema = response.content?.['application/json']?.schema
    if (schema === undefined) return body === undefined ? null : `answers ${status} with a body the operation does not declare`
    return this.check(`${op.method} ${op.template} ${status}`, schema, body)
  }

  private check(key: string, schema: Json, body: unknown): string | null {
    let validate = this.compiled.get(key)
    if (!validate) {
      validate = this.ajv.compile({
        $id: `https://stoa-e2e.test/check/${encodeURIComponent(key)}`,
        ...(closeObjects(resolveRefs(schema)) as object),
      })
      this.compiled.set(key, validate)
    }
    if (validate(body)) return null
    return this.ajv.errorsText(validate.errors, { separator: '; ' })
  }
}

function templatePattern(template: string) {
  const escaped = template
    .split('/')
    .map((segment) => (/^\{[^}]+\}$/.test(segment) ? '[^/]+' : segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    .join('/')
  return new RegExp(`^${escaped}$`)
}

function paramCount(template: string) {
  return (template.match(/\{/g) ?? []).length
}

/** `#/components/...` inside an operation points into the registered document. */
function resolveRefs(value: Json): Json {
  if (Array.isArray(value)) return value.map(resolveRefs)
  if (value && typeof value === 'object') {
    const out: Record<string, Json> = {}
    for (const [key, child] of Object.entries(value)) {
      out[key] = key === '$ref' && typeof child === 'string' && child.startsWith('#/') ? `${DOC_ID}${child}` : resolveRefs(child)
    }
    return out
  }
  return value
}

/** Every object schema that names its properties admits no others. */
function closeObjects(value: Json): Json {
  if (Array.isArray(value)) return value.map(closeObjects)
  if (value && typeof value === 'object') {
    const out: Record<string, Json> = {}
    for (const [key, child] of Object.entries(value)) {
      // Keys under `properties` are field names, not keywords; walk their schemas.
      out[key] = key === 'properties' && child && typeof child === 'object' && !Array.isArray(child)
        ? Object.fromEntries(Object.entries(child).map(([name, schema]) => [name, closeObjects(schema)]))
        : closeObjects(child)
    }
    if (out.properties && typeof out.properties === 'object' && !('additionalProperties' in out)) {
      out.unevaluatedProperties = false
    }
    return out
  }
  return value
}

// The parts of check-api-contract.mjs that read source and compare paths, kept
// apart from the command so a test can feed them sources that must fail.

import ts from 'typescript'

const HTTP_METHODS = new Set(['get', 'post', 'patch', 'put', 'delete'])

// Fewer calls than this means the reader stopped recognising how services are
// written, not that the app stopped calling the backend. A pass on a handful
// of calls proves nothing (#345). Raise it when the count grows; lower it only
// together with the deletion that removed the calls.
export const MIN_CHECKED_CALLS = 150

// Calls that are not a new request and so have no path of their own to check.
export const PASSTHROUGH_CALLS = [
  // The 401 interceptor replays the request it was handed, which was made
  // through a checked call.
  { file: 'src/services/api/httpClient.ts', text: 'httpClient.request(config)' },
]

// Calls the backend does not serve yet, each with why that is safe for now.
// An entry fails the check once it is no longer needed, so the list cannot
// outlive the gap it excuses.
export const KNOWN_GAPS = [
  {
    file: 'src/services/monitoring/frontendErrorMonitoring.ts',
    call: 'POST /monitoring/frontend-errors',
    // Sent only when the runtime config turns errorMonitoring on, and every
    // release ships it off (tests/release/runtime-monitoring-flag.test.mjs).
    // Found when this check started reading constant paths (#345).
    reason: 'error reporting is switched off in every release',
  },
]

// `/students/${id}/summary` and `/students/{student_id}/summary` must compare equal.
// A template literal holding a ternary ends the string match early, leaving an
// unterminated `${`; everything from there on is not part of the path.
export function normalise(path) {
  const openIndex = path.indexOf('${')
  const truncated =
    openIndex !== -1 && !path.slice(openIndex).includes('}') ? path.slice(0, openIndex) : path
  const normalised = truncated
    .split('?')[0]
    .replace(/\$\{[^}]*\}/g, '{}')
    .replace(/\{[^}]*\}/g, '{}')
    .replace(/\/+$/, '')
  return normalised || '/'
}

export function loadBackendRoutes(inventory) {
  const routes = new Map()
  for (const route of inventory) {
    const key = normalise(route.path)
    if (!routes.has(key)) routes.set(key, new Set())
    routes.get(key).add(route.method.toUpperCase())
  }
  return routes
}

function lineOf(source, index) {
  return source.slice(0, index).split('\n').length
}

// `const LOGOUT_PATH = '/auth/logout'` anywhere in the services, so a call that
// passes the constant is checked against the path it holds.
function collectPathConstants(sources) {
  const constants = new Map()
  const pattern = /\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*['"`](\/[^'"`$]*)['"`]/g
  for (const { source } of sources) {
    for (const match of source.matchAll(pattern)) constants.set(match[1], match[2])
  }
  return constants
}

// The path argument: apiPath`/x/${id}` (#251), a plain string, or a constant,
// then the end of the argument. A string may carry a query on the end, as in
// '/x' + (query ? `?${query}` : ''); any other concatenation could change the
// path, so it is not read. One level of nested generics
// (`post<Record<string, unknown>>`) is allowed.
const HTTP_CALL = new RegExp(
  [
    /httpClient\.(\w+)\s*(?:<(?:[^<>]|<[^<>]*>)*>)?\s*\(\s*/.source,
    '(?:',
    /(?:apiPath)?`((?:[^`$]|\$\{[^}]*\}|\$(?!\{))*)`/.source,
    /|'([^'\n]*)'|"([^"\n]*)"/.source,
    /|([A-Za-z_$][\w$]*)/.source,
    ')',
    /\s*(?:[,)]|\+\s*\(\s*[\w$.]+\s*\?\s*`\?)/.source,
  ].join(''),
  'y',
)

// fetch(`${apiBaseUrl}/auth/refresh`), fetch(`${apiBaseUrl}${apiPath`/x/${id}`}`)
// or fetch(`${apiBaseUrl}${ENDPOINT}`), with the method read from the options.
const FETCH_CALL =
  /fetch\s*\(\s*`\$\{apiBaseUrl\}(?:\$\{apiPath`([^`]+)`\}|\$\{([A-Za-z_$][\w$]*)\}|((?:[^`$]|\$\{[^}]*\})+))`/y

// The method each fetch( call in a file sends, keyed by where the word `fetch`
// starts. It is read from that call's own options, parsed, because the first
// `method:` after the URL could belong to the next call (#374).
function fetchMethods(file, source) {
  const kind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, false, kind)
  const methods = new Map()
  const visit = (node) => {
    if (ts.isCallExpression(node)) {
      const callee = ts.isPropertyAccessExpression(node.expression) ? node.expression.name : node.expression
      if (ts.isIdentifier(callee) && callee.text === 'fetch') {
        methods.set(callee.getStart(tree), methodOf(node.arguments[1]))
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(tree)
  return methods
}

// `x as T`, `x satisfies T` and `(x)` are x.
function unwrap(node) {
  while (
    node &&
    (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isSatisfiesExpression(node))
  ) {
    node = node.expression
  }
  return node
}

// GET when there are no options or they name no method; null when the method
// could come from somewhere this cannot see (a variable, a spread or a
// computed key after it).
function methodOf(argument) {
  const options = unwrap(argument)
  if (!options) return 'GET'
  if (!ts.isObjectLiteralExpression(options)) return null
  let method = 'GET'
  for (const property of options.properties) {
    if (ts.isSpreadAssignment(property) || ts.isComputedPropertyName(property.name)) {
      method = null
    } else if (property.name.text === 'method') {
      const value = ts.isPropertyAssignment(property) && unwrap(property.initializer)
      method = value && ts.isStringLiteralLike(value) ? value.text.toUpperCase() : null
    }
  }
  return method
}

/**
 * Every request the services make, and every place that looks like one but
 * could not be read. An unread call is a failure, never a silent skip: the
 * guard used to pass while missing exactly those (#345).
 */
export function collectCalls(sources) {
  const constants = collectPathConstants(sources)
  const calls = []
  const unparsed = []

  for (const { file, source } of sources) {
    const passthrough = PASSTHROUGH_CALLS.filter((entry) => entry.file === file)

    for (const start of source.matchAll(/\bhttpClient\.(\w+)\s*[<(]/g)) {
      const at = start.index
      if (passthrough.some((entry) => source.startsWith(entry.text, at))) continue
      HTTP_CALL.lastIndex = at
      const match = HTTP_CALL.exec(source)
      const method = start[1]
      const path = match && (match[2] ?? match[3] ?? match[4] ?? constants.get(match[5]))
      if (!HTTP_METHODS.has(method) || !path) {
        unparsed.push({ file, line: lineOf(source, at), text: source.slice(at, at + 60).split('\n')[0] })
        continue
      }
      calls.push({ method: method.toUpperCase(), path, file })
    }

    let methods
    for (const start of source.matchAll(/\bfetch\s*\(/g)) {
      const at = start.index
      FETCH_CALL.lastIndex = at
      const match = FETCH_CALL.exec(source)
      const path = match && (match[1] ?? (match[2] ? constants.get(match[2]) : match[3]))
      methods ??= fetchMethods(file, source)
      const method = methods.get(at)
      if (!path || !method) {
        unparsed.push({ file, line: lineOf(source, at), text: source.slice(at, at + 60).split('\n')[0] })
        continue
      }
      calls.push({ method, path, file })
    }
  }

  return { calls, unparsed }
}

// A call can interpolate a value the backend spells out as separate routes, as in
// `drafts/${id}/${action}` against `/accept`, `/reject` and `/archive`. Such a
// segment matches a literal one so those calls are not reported as missing.
export function matchesBackendRoute(backend, callPath, method) {
  const callSegments = callPath.split('/')
  for (const [backendPath, methods] of backend) {
    if (!methods.has(method)) continue
    const backendSegments = backendPath.split('/')
    if (backendSegments.length !== callSegments.length) continue
    const compatible = callSegments.every(
      (segment, index) =>
        segment === backendSegments[index] || segment === '{}' || backendSegments[index] === '{}',
    )
    if (compatible) return true
  }
  return false
}

/**
 * Calls with no backend route, grouped by file, and the known gaps that no
 * longer excuse anything (the call is gone, or the backend serves it now).
 */
export function findMissing(backend, calls, knownGaps = KNOWN_GAPS) {
  const missing = new Map()
  const used = new Set()
  for (const call of calls) {
    if (matchesBackendRoute(backend, normalise(call.path), call.method)) continue
    const label = `${call.method} ${call.path}`
    const gap = knownGaps.find((entry) => entry.file === call.file && entry.call === label)
    if (gap) {
      used.add(gap)
      continue
    }
    if (!missing.has(call.file)) missing.set(call.file, [])
    missing.get(call.file).push(label)
  }
  const staleGaps = knownGaps.filter((entry) => !used.has(entry))
  return { missing, staleGaps }
}

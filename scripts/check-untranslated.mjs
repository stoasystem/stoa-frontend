#!/usr/bin/env node
/**
 * Find sentences a signed-in user would read that were never translated.
 *
 * The review screens shipped in English to a German-speaking country because
 * nothing was watching. This looks for English prose rendered directly in the
 * screens, rather than trusting a sweep by eye.
 *
 * Until #281 this was a line scan with regexes over a hand-kept list of
 * folders, and it was blind in ways that kept the count low while the screens
 * still carried English: six of its folders did not exist, `src/hooks`,
 * `src/lib` and `src/services` were never read, any line containing `to=`,
 * `className`, `aria-` or `key=` was skipped whole (so `<Link to={…}>Weekly
 * report</Link>` passed, #255), and JSX text across lines, lowercase text and
 * toast messages could not match at all.
 *
 * Now it parses every file under `src/` with the TypeScript compiler (already
 * a dependency) and looks at what a reader can see:
 *
 *   jsx-text   text between tags, on one line or many;
 *   jsx-attr   a string in an attribute people read or hear: aria-label,
 *              title, placeholder, alt, label and the other TEXT_ATTRS;
 *   jsx-expr   a string a `{…}` puts on the screen: `{busy ? 'Saving' : t(…)}`;
 *   toast      the message of `toast.*()`, and its `description`;
 *   text-prop  `{ title: 'Weekly report' }` in an object, which is how most
 *              screens hand copy to a shared component;
 *   literal    any other quoted English sentence, which is where helpers that
 *              return copy hide it.
 *
 * What is not counted, and why:
 *   - anything inside a translation call (`t('…')`, `i18n.t`): a key, or a
 *     defaultValue a missing key would show; missing keys are another test's job;
 *   - `new Error('…')`, `console.*`: since #265, `toUserFacingError` never shows
 *     transport or thrown English to a reader outside the English UI;
 *   - code: imports, comparisons, `case` labels, types, object keys,
 *     className, data-*, href, to, key and other attributes nobody reads;
 *   - a map keyed by language (`{ de: '…', en: '…' }`): that is a translation;
 *   - anything under a comment `// untranslated-ok: <why>`, for strings that
 *     are data rather than copy (a backend sentence matched to pick a
 *     translation, a reason stored with a record). The reason is required;
 *     the marker covers the node the comment sits on and everything inside it;
 *   - EXCLUDE: tests, dev-only tools, the locale files, and the billing pages
 *     frozen by Card 007 (#257 is their unfreeze checklist).
 *
 * The count jumped when this replaced the line scan (see the baseline note).
 * Nothing regressed: the scan now looks where the reader does.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

// Paths (relative to the scanned root, `/`-separated) that are not screens.
export const EXCLUDE = [
  // Tests and test helpers.
  /(^|\/)__tests__\//,
  /\.(test|spec)\.tsx?$/,
  /\.d\.ts$/,
  /\.test-d\.ts$/,
  // Dev-only tools that never reach a production bundle's reader.
  /^src\/dev\//,
  /^src\/mocks\//,
  /^src\/components\/dev\//,
  /^src\/components\/internal\//,
  // The translations themselves.
  /^src\/i18n\//,
  // Billing is frozen (Card 007): the routes are commented out and the backend
  // answers 410. #257 lists what must be fixed, copy included, before it returns.
  /^src\/pages\/billing\//,
  /^src\/components\/billing\//,
  /^src\/components\/pricing\//,
  /^src\/hooks\/billing\//,
  /^src\/services\/billing\//,
  /^src\/pages\/admin\/AdminSubscriptionRequestsPage\.tsx$/,
  /^src\/pages\/admin\/AdminBillingCheckoutPage\.tsx$/,
  // The parent's plan cards, unmounted by Card 007 (their imports in the parent
  // pages are commented out, not deleted).
  /^src\/components\/parent\/ParentSubscriptionOperationsCard\.tsx$/,
  /^src\/components\/parent\/UpgradePromptCard\.tsx$/,
]

// Attributes a reader sees or a screen reader speaks, and the props shared
// components turn into visible text.
const TEXT_ATTRS = new Set([
  'aria-label',
  'aria-description',
  'aria-valuetext',
  'aria-roledescription',
  'aria-placeholder',
  'title',
  'alt',
  'placeholder',
  'label',
  'description',
  'message',
  'emptyMessage',
  'emptyTitle',
  'eyebrow',
  'subtitle',
  'heading',
  'cta',
  'actionLabel',
  'confirmLabel',
  'cancelLabel',
  'caption',
  'hint',
  'tooltip',
  'helperText',
])

// Object properties that carry copy into a component.
const TEXT_PROPS = new Set([...TEXT_ATTRS].filter((name) => !name.startsWith('aria-')))

// Properties that hold code or metadata a reader never sees.
const CODE_PROPS =
  /^(purpose|module|className|id|key|testId|queryKey|path|href|to|type|kind|status|code|role|variant|icon|tone|area|name|value|method|url|mode|scope|event|source|reason|ns|i18nKey|labelKey|titleKey)$/

// Calls whose string arguments are not copy.
const CODE_CALLS =
  /^(console\.\w+|cn|clsx|twMerge|cva|require|import|querySelector\w*|\w+\.querySelector\w*|addEventListener|\w+\.addEventListener|removeEventListener|\w+\.removeEventListener|\w+\.(get|set|remove)Item|\w+\.(startsWith|endsWith|includes|indexOf|split|replace|replaceAll|match|test|join|localeCompare|getAttribute|setAttribute|hasAttribute|closest)|RegExp|new RegExp|JSON\.\w+|Symbol|\w*[Ll]og(ger)?\.\w+|track\w*|\w+\.track\w*|matchMedia|\w+\.matchMedia|createElement|\w+\.createElement|encodeURIComponent|apiPath|navigate|useNavigate|useSearchParams|\w+\.(get|has|set|delete|append)|lazyPage|apiErrorFromBody|sanitizeText|vi\.\w+|describe|it|test|expect)$/

// A translation call: whatever it is given is a key, not copy.
const TRANSLATE = /^(t|i18n\.t|i18next\.t|\w+\.t|translate|tt)$/

// Words that read the same in the languages we ship, or are not prose.
const ALLOW =
  /^(STOA|OK|Email|E-Mail|PDF|AI|KaTeX|LaTeX|Markdown|ID|URL|CHF|Mathematics|Physics|German|English|Deutsch|Français|Italiano|Total|Status|Info|Chat|Quiz|Start|Stop|Murmi|STOA Edu|Stripe|Google|Cognito|SVG|PNG|JPG|JPEG|HEIC|Ctrl|Cmd|Enter|Esc|Shift|Tab)$/i

// Names and codes that stay as they are in every language, inside a longer string.
const BRAND = /^(STOA|STOA Edu|Murmi|KaTeX|LaTeX|Markdown|PDF|AI|ID|URL|CHF|OK|E-Mail|Email)$/i

const hasCjk = (text) => /[\u3400-\u9fff]/.test(text)

/** Text a reader could read: words, not ids, keys, paths or class lists. */
export function isReadable(raw) {
  const text = raw.replace(/\s+/g, ' ').trim()
  if (!text) return false
  if (hasCjk(text)) return true
  if (!/[A-Za-zÀ-ÿ]{2,}/.test(text)) return false
  // Brand names and words that read the same in every language we ship do not
  // make a string prose on their own: `| STOA` is not a sentence.
  const words = text.split(/[^\p{L}'\u2019-]+/u).filter(Boolean)
  if (words.every((word) => BRAND.test(word) || word.length < 2)) return false
  if (/^(https?:|mailto:|tel:|\/|#|\.\/|data:)/.test(text)) return false
  // A key or an id: `common:actions.back`, `review-due`, `student_id`.
  if (/^[\w-]+([.:][\w-]+)+$/.test(text)) return false
  if (/^[a-z0-9]+([_-][a-z0-9]+)+$/.test(text)) return false
  if (/^[A-Z0-9_]+$/.test(text) && text.length <= 4) return false
  if (/^[\w.+-]+@[\w-]+(\.[\w-]+)+$/.test(text)) return false
  // A Tailwind class list.
  if (/^[\w:/[\]().%#-]+(\s+[\w:/[\]().%#-]+)*$/.test(text) && /(^|\s)(flex|grid|text-|bg-|p[xytblr]?-|m[xytblr]?-|rounded|border|w-|h-|items-|justify-|gap-|font-|sr-only|hidden|block|inline)/.test(text))
    return false
  // A date or number format: `dd.MM.yyyy`, `HH:mm`.
  if (/^[dMyHhmsSaEZ.:/ ,'-]+$/.test(text)) return false
  return true
}

/** An id or a list of ids in an attribute: `math`, `fractions,linear-equations`, `chk_public_…`. */
const isIdLike = (text) => /^[a-z0-9_,.:…-]+$/.test(text.trim())

/** A sentence in English: what a quoted literal outside JSX must look like to count. */
export function isSentence(raw) {
  const text = raw.replace(/\s+/g, ' ').trim()
  if (hasCjk(text)) return true
  if (ALLOW.test(text)) return false
  return /^[A-Z][a-z]+(?:['\u2019]?[a-z]+)?(?: [A-Za-z'\u2019&(][A-Za-z'\u2019&.,:;?!()/-]*){1,}[.?!…:]?$/.test(text)
}

const OK_MARKER = /untranslated-ok:\s*\S/

/** A `// untranslated-ok: <why>` comment directly above (or on) this node. */
function markedOk(node, sourceText) {
  const comments = ts.getLeadingCommentRanges(sourceText, node.getFullStart()) ?? []
  return comments.some((range) => OK_MARKER.test(sourceText.slice(range.pos, range.end)))
}

function underOkMarker(node, sourceText) {
  for (let current = node; current; current = current.parent) if (markedOk(current, sourceText)) return true
  return false
}

function extendsError(node) {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (ts.isClassLike(parent))
      return (parent.heritageClauses ?? []).some((clause) => clause.types.some((type) => /Error$/.test(type.expression.getText())))
  }
  return false
}

const calleeText = (call) => (ts.isNewExpression(call) ? `new ${call.expression.getText()}` : call.expression.getText())

function stringText(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
  if (ts.isTemplateExpression(node)) return [node.head.text, ...node.templateSpans.map((span) => span.literal.text)].join(' ')
  return undefined
}

/** Where a string sits decides whether it is copy; this walks up to find out. */
function context(node, sourceText) {
  if (underOkMarker(node, sourceText)) return { skip: true }
  let child = node
  for (let parent = node.parent; parent; child = parent, parent = parent.parent) {
    if (ts.isCallExpression(parent) || ts.isNewExpression(parent)) {
      const callee = calleeText(parent)
      if (child !== parent.expression) {
        if (TRANSLATE.test(callee)) return { skip: true }
        if (/^(new \w*Error|\w*Error)$/.test(callee)) return { skip: true }
        // `super('…')` in a class that extends an Error: the message of a thrown error.
        if (callee === 'super' && extendsError(parent)) return { skip: true }
        if (CODE_CALLS.test(callee)) return { skip: true }
        if (/^toast(\.\w+)?$/.test(callee)) return { kind: 'toast' }
      }
      // Any other call: the string is an argument to code we cannot see into.
      return { kind: 'literal' }
    }
    if (ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent) || ts.isImportTypeNode(parent)) return { skip: true }
    if (ts.isLiteralTypeNode(parent) || ts.isTypeNode(parent)) return { skip: true }
    if (ts.isCaseClause(parent) && child === parent.expression) return { skip: true }
    if (ts.isElementAccessExpression(parent) && child === parent.argumentExpression) return { skip: true }
    if (ts.isBinaryExpression(parent)) {
      const op = parent.operatorToken.kind
      if (
        op === ts.SyntaxKind.EqualsEqualsEqualsToken ||
        op === ts.SyntaxKind.ExclamationEqualsEqualsToken ||
        op === ts.SyntaxKind.EqualsEqualsToken ||
        op === ts.SyntaxKind.ExclamationEqualsToken ||
        op === ts.SyntaxKind.InKeyword
      )
        return { skip: true }
    }
    if (ts.isPropertyAssignment(parent)) {
      if (child === parent.name) return { skip: true }
      const name = parent.name.getText().replace(/^['"]|['"]$/g, '')
      if (CODE_PROPS.test(name)) return { skip: true }
      // `{ de: '…', en: '…', fr: '…', it: '…' }` is already translated.
      if (/^(de|en|fr|it)$/.test(name)) return { skip: true }
      // `{ label, labelKey }`: the key is what is shown; the label is its fallback.
      const siblings = ts.isObjectLiteralExpression(parent.parent) ? parent.parent.properties : []
      if (siblings.some((p) => p.name?.getText() === `${name}Key`)) return { skip: true }
      // A nav entry's `description` is copied by lib/navigation.ts and never rendered.
      if (name === 'description' && siblings.some((p) => p.name?.getText() === 'labelKey')) return { skip: true }
      if (TEXT_PROPS.has(name)) return { kind: 'text-prop' }
      // Any other property: whoever receives the object decides.
    }
    if (ts.isJsxAttribute(parent)) {
      const name = parent.name.getText()
      return TEXT_ATTRS.has(name) ? { kind: 'jsx-attr' } : { skip: true }
    }
    if (ts.isJsxExpression(parent) && (ts.isJsxElement(parent.parent) || ts.isJsxFragment(parent.parent))) {
      return { kind: 'jsx-expr' }
    }
    if (ts.isJsxSpreadAttribute(parent)) return { skip: true }
    if (
      ts.isVariableDeclaration(parent) ||
      ts.isReturnStatement(parent) ||
      ts.isArrowFunction(parent) ||
      ts.isFunctionLike(parent) ||
      ts.isClassLike(parent) ||
      ts.isStatement(parent)
    ) {
      return { kind: 'literal' }
    }
  }
  return { kind: 'literal' }
}

/** Every untranslated string a reader would meet in one file. */
export function scanSource(fileName, source) {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    fileName.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )
  const findings = []
  const record = (node, kind, text) => {
    const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
    findings.push({ file: fileName, line: line + 1, kind, text: text.replace(/\s+/g, ' ').trim().slice(0, 68) })
  }

  const visit = (node) => {
    if (ts.isJsxText(node)) {
      if (isReadable(node.text) && !underOkMarker(node, source)) record(node, 'jsx-text', node.text)
      return
    }
    const text = stringText(node)
    if (text !== undefined) {
      const where = context(node, source)
      if (!where.skip) {
        const counts =
          where.kind === 'literal' ? isSentence(text) : isReadable(text) && !isIdLike(text)
        if (counts) record(node, where.kind, text)
      }
      if (!ts.isTemplateExpression(node)) return
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return findings
}

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) out.push(...walk(path))
    else if (/\.(ts|tsx)$/.test(path)) out.push(path)
  }
  return out
}

/** Scan `root/src`, minus EXCLUDE. Paths in findings are relative to `root`. */
export function scan(root = '.') {
  const findings = []
  for (const path of walk(join(root, 'src'))) {
    const file = relative(root, path).split(sep).join('/')
    if (EXCLUDE.some((pattern) => pattern.test(file))) continue
    findings.push(...scanSource(file, readFileSync(path, 'utf8')))
  }
  return findings
}

function readBaseline(root) {
  try {
    return JSON.parse(readFileSync(join(root, 'scripts/untranslated-baseline.json'), 'utf8')).count
  } catch {
    return 0
  }
}

function main() {
  // `node scripts/check-untranslated.mjs [root]`: the root holds `src/` (and,
  // unless UNTRANSLATED_BASELINE is set, `scripts/untranslated-baseline.json`).
  const root = process.argv[2] ?? '.'
  try {
    statSync(join(root, 'src'))
  } catch {
    console.error(`no src/ under ${root}: nothing to scan is not a pass`)
    process.exit(1)
  }
  const findings = scan(root)
  // A count that may only fall. The screens carry more English than one pass
  // can translate, and a check that fails on all of it would simply be turned
  // off; this lets the number be worked down without ever growing back.
  const baseline = Number(process.env.UNTRANSLATED_BASELINE ?? readBaseline(root))

  if (findings.length === 0) {
    console.log('every sentence in the screens comes from a translation')
    process.exit(0)
  }

  console.log(`${findings.length} untranslated sentence(s) in the screens (baseline ${baseline}):\n`)
  for (const { file, line, kind, text } of findings) {
    console.log(`  ${file}:${line} [${kind}]\n    ${text}`)
  }

  if (findings.length > baseline) {
    console.log(`\nthis is ${findings.length - baseline} more than the baseline; translate them or lower the baseline deliberately`)
    process.exit(1)
  }
  if (findings.length < baseline) {
    console.log(`\n${baseline - findings.length} fewer than the baseline; update scripts/untranslated-baseline.json to hold the ground`)
  }
  process.exit(0)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main()

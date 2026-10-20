// Lint rule for src: no regular expression that Safari 15 cannot parse
// (#398), which is what the iPadOS 15 iPads many schools have run. esbuild
// cannot rewrite a lookbehind or the `v` flag for the build target; it only
// moves the pattern into `new RegExp("…")`, which throws a SyntaxError there
// when the module runs, and every page that imports the module fails to load.
//
// Regex literals are read, and so are patterns handed to `RegExp` as a string
// or a template; each value inside a template counts as one plain character.

/** Whether a pattern holds a lookbehind, `(?<=` or `(?<!`, outside a character class. */
function hasLookbehind(pattern) {
  let inClass = false
  for (let at = 0; at < pattern.length; at += 1) {
    const char = pattern[at]
    if (char === '\\') at += 1
    else if (inClass) inClass = char !== ']'
    else if (char === '[') inClass = true
    else if (pattern.startsWith('(?<=', at) || pattern.startsWith('(?<!', at)) return true
  }
  return false
}

/** The text of a string or template argument (`String.raw` too), or null when it is neither. */
function staticText(node) {
  if (node?.type === 'Literal' && typeof node.value === 'string') return node.value
  if (node?.type === 'TemplateLiteral') return node.quasis.map((quasi) => quasi.value.cooked ?? quasi.value.raw).join('x')
  if (node?.type === 'TaggedTemplateExpression') return node.quasi.quasis.map((quasi) => quasi.value.raw).join('x')
  return null
}

const rule = {
  meta: {
    type: 'problem',
    docs: { description: 'Write only regular expressions that Safari 15 can parse' },
    messages: {
      lookbehind:
        'Safari before 16.4 cannot parse a lookbehind, and the module then fails to load on iPadOS 15 (#398). Check the characters before the match in code instead.',
      vFlag: 'Safari before 17 cannot parse the `v` flag, and the module then fails to load on iPadOS 15 (#398).',
    },
    schema: [],
  },
  create(context) {
    const check = (node, pattern, flags) => {
      if (pattern !== null && hasLookbehind(pattern)) context.report({ node, messageId: 'lookbehind' })
      if (flags?.includes('v')) context.report({ node, messageId: 'vFlag' })
    }
    const checkConstructor = (node) => {
      if (node.callee.type === 'Identifier' && node.callee.name === 'RegExp') {
        check(node, staticText(node.arguments[0]), staticText(node.arguments[1]))
      }
    }
    return {
      Literal(node) {
        if (node.regex) check(node, node.regex.pattern, node.regex.flags)
      },
      NewExpression: checkConstructor,
      CallExpression: checkConstructor,
    }
  },
}

export default { rules: { 'regexp-safari': rule } }

// Lint rule for src/services: a path template must insert its values through
// `apiPath` (src/services/api/apiPath.ts), which keeps each one a single path
// segment (#251). A plain template such as `/conversations/${id}` would let a
// router-decoded id holding `/`, `?` or `#` walk the request to another path.
//
// A template counts as a path when text before one of its values holds a `/`
// (so `Score ${n}/${d}` would be refused too; disable it on that line). A
// string ending in `/` joined to a value with `+` is refused the same way, and
// so is encodeURIComponent inside apiPath, which would encode twice.
// `${apiBaseUrl}${apiPath`/x/${id}`}` passes: the outer template has no `/`.

const rule = {
  meta: {
    type: 'problem',
    docs: { description: 'Insert values into service paths only through apiPath' },
    messages: {
      bare: 'Build this path with apiPath`...` so every inserted value is encoded as one segment (#251).',
      twice: 'apiPath already encodes each value; pass it raw so it is not encoded twice (#251).',
    },
    schema: [],
  },
  create(context) {
    const endsInSlash = (node) =>
      (node.type === 'Literal' && typeof node.value === 'string' && node.value.endsWith('/')) ||
      (node.type === 'TemplateLiteral' && node.quasis.at(-1).value.raw.endsWith('/'))
    return {
      BinaryExpression(node) {
        if (node.operator === '+' && endsInSlash(node.left)) {
          context.report({ node, messageId: 'bare' })
        }
      },
      TemplateLiteral(node) {
        const parent = node.parent
        if (
          parent?.type === 'TaggedTemplateExpression' &&
          parent.quasi === node &&
          parent.tag.type === 'Identifier' &&
          parent.tag.name === 'apiPath'
        ) {
          for (const expression of node.expressions) {
            if (
              expression.type === 'CallExpression' &&
              expression.callee.type === 'Identifier' &&
              expression.callee.name === 'encodeURIComponent'
            ) {
              context.report({ node: expression, messageId: 'twice' })
            }
          }
          return
        }
        const beforeValues = node.quasis.slice(0, node.expressions.length)
        if (beforeValues.some((quasi) => quasi.value.raw.includes('/'))) {
          context.report({ node, messageId: 'bare' })
        }
      },
    }
  },
}

export default { rules: { 'api-path-template': rule } }

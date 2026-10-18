// Lint rule for src/services: a path template must insert its values through
// `apiPath` (src/services/api/apiPath.ts), which keeps each one a single path
// segment (#251). A plain template such as `/conversations/${id}` would let a
// router-decoded id holding `/`, `?` or `#` walk the request to another path.
//
// A template counts as a path when text before one of its values holds a `/`.
// `${apiBaseUrl}${apiPath`/x/${id}`}` passes: the outer template has no `/`.

const rule = {
  meta: {
    type: 'problem',
    docs: { description: 'Insert values into service paths only through apiPath' },
    messages: {
      bare: 'Build this path with apiPath`...` so every inserted value is encoded as one segment (#251).',
    },
    schema: [],
  },
  create(context) {
    return {
      TemplateLiteral(node) {
        const parent = node.parent
        if (
          parent?.type === 'TaggedTemplateExpression' &&
          parent.quasi === node &&
          parent.tag.type === 'Identifier' &&
          parent.tag.name === 'apiPath'
        ) {
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

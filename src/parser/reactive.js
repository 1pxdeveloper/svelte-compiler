const babel = Babel
window.babel = babel

function makeReactive({types: t}) {
  window.t = t

  return {
    visitor: {
      ExpressionStatement(path) {
        if (path.parentKey !== "body") return
        if (path.shouldSkip) return

        const keys = Object.keys(path.scope.globals)

        path.shouldSkip = true
        path.replaceWith(
          t.arrayExpression([
            t.arrowFunctionExpression(keys.map(key => t.identifier(key)), path.node.expression),
            ...keys.map(key => t.stringLiteral(key))
          ])
        )
      },
    }
  }
}


babel.registerPlugin('makeReactive', makeReactive)


export function transformReactive(source) {
  const output = babel.transform(source, {
    comments: false,
    compact: true,
    plugins: ['makeReactive']
  })

  console.log(source, output)

  if (output.ast.program.body[0] && output.ast.program.body[0].type !== "ExpressionStatement") {
    throw new Error("{...} must be expression.")
  }

  return output
}
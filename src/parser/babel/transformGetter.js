const babel = Babel

function makeGetter({types: t}) {
  window.t = t

  return {
    visitor: {
      Program(path) {
        path.node.body = [
          t.arrayExpression([
            t.arrowFunctionExpression([], path.node.body[0].expression),
            t.numericLiteral(0)
          ])
        ]
      },
    }
  }
}

babel.registerPlugin('makeGetter', makeGetter)

export function transformGetter(source) {
  return babel.transform(source, {
    comments: false,
    compact: true,
    plugins: ['makeGetter']
  })
}
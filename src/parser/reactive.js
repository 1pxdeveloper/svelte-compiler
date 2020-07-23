import {setIndentifiers} from "./identifiers"

const babel = Babel
window.babel = babel

let identifiers_mask

function makeReactive({types: t}) {
  window.t = t

  return {
    visitor: {
      Program(path) {
        if (path.shouldSkip) return

        const keys = Object.keys(path.scope.globals)
        identifiers_mask = keys.map(setIndentifiers).reduce((a, b) => a | b, 0)

        console.log(identifiers_mask, identifiers_mask)

        path.shouldSkip = true
        path.node.body = [t.arrowFunctionExpression([], path.node.body[0].expression)]

        console.warn("Program", path)
      },
    }
  }
}

babel.registerPlugin('makeReactive', makeReactive)

export function transformReactive(source) {
  const output = babel.transform(source, {
    ast: false,
    comments: false,
    compact: true,
    plugins: ['makeReactive']
  })

  output.identifiers_mask = identifiers_mask
  console.log(source, output.code)

  // if (output.ast.program.body[0] && output.ast.program.body[0].type !== "ExpressionStatement") {
  //   throw new Error("{...} must be expression.")
  // }

  console.groupEnd()

  return output
}
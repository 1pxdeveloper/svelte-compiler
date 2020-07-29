import {setIndentifiers} from "../table/identifiers.js"
import {setReactive} from "../table/reactives"

const babel = Babel
window.babel = babel


let identifiers
let identifiers_mask
let $mutableTable

function makeReactive({types: t}) {
  window.t = t

  return {
    visitor: {
      Program(path) {
        if (path.shouldSkip) return

        identifiers = Object.keys(path.scope.globals)
        identifiers_mask = identifiers.map(key => setIndentifiers(key, $mutableTable)).reduce((a, b) => a | b, 0)

        console.log("identifiers, identifiers_mask", identifiers, identifiers_mask, ({...path}))

        path.shouldSkip = true

        if (path.node.body) {
          path.node.body = [t.arrowFunctionExpression([], path.node.body[0].expression)]
        }

        console.warn("Program", path)
      },
    }
  }
}

babel.registerPlugin('makeReactive', makeReactive)

export function transformReactive(source, mutableTable) {
  identifiers_mask = 0
  identifiers = []
  $mutableTable = mutableTable

  const output = babel.transform(source, {
    ast: false,
    comments: false,
    compact: true,
    plugins: ['makeReactive']
  })

  output.index = setReactive(output.code)
  output.identifiers_mask = identifiers_mask
  console.warn(source, output.code)
  return output
}
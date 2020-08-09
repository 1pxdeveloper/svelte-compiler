const babel = Babel

import {setIndentifiers} from "../table/identifiers.js"
import {setReactive} from "../table/reactives"
import {INVALIDATE_FUNC_NAME} from "./config"

let identifiers

function makeGetter({types: t}) {
  window.t = t

  return {
    visitor: {
      Program(path) {
        identifiers = Object.keys(path.scope.globals)
        path.node.body = [t.arrowFunctionExpression([], path.node.body[0].expression)]
      },
    }
  }
}

babel.registerPlugin('makeGetter', makeGetter)

export function transformGetter(source) {
  const output = babel.transform(source, {
    comments: false,
    compact: true,
    plugins: ['makeGetter']
  })

  // output.index = setReactive(output.code)
  // output.identifiers_mask = identifiers_mask
  // console.warn(source, output.code, set_args)
  output.identifiers = identifiers
  identifiers = null
  return output
}
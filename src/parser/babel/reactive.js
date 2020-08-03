/*
setter / getter 를 만드는 babel plugin

() => { ... }
value => { .... } = value

의 형태를 만들어 낸다.

mutableTable에서 필요한 identifiers_mask를 생성하여 watch 함.

 */
import {setIndentifiers} from "../table/identifiers.js"
import {setReactive} from "../table/reactives"

const babel = Babel
window.babel = babel


let identifiers
let identifiers_mask
let $mutableTable
let $set_args

function makeReactive({types: t}) {
  window.t = t

  return {
    visitor: {
      Program: {
        exit(path) {
          identifiers = Object.keys(path.scope.globals)
          identifiers_mask = identifiers.map(key => setIndentifiers(key, $set_args ? path.scope.globals : $mutableTable)).reduce((a, b) => a | b, 0)

          if (path.node.body) {
            path.node.body = [t.arrowFunctionExpression($set_args.map(v => t.identifier(v)), path.node.body[0].expression)]
          }
        },
      }
    }
  }
}

babel.registerPlugin('makeReactive', makeReactive)

export function transformReactive(source, mutableTable, set_args = []) {
  $mutableTable = mutableTable
  $set_args = set_args
  identifiers = []
  identifiers_mask = 0

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
const babel = Babel

let identifiers

function makeSetter({types: t}) {
  window.t = t

  return {
    visitor: {
      Program(path) {
        identifiers = Object.keys(path.scope.globals)
        path.node.body = [t.arrowFunctionExpression([t.identifier('value')], path.node.body[0].expression)]
      },
    }
  }
}

babel.registerPlugin('makeSetter', makeSetter)

export function transformSetter(source) {
  source = source + '=value'
  console.log("??????????????????", source)

  const output = babel.transform(source, {
    comments: false,
    compact: true,
    plugins: ['makeSetter']
  })

  // output.index = setReactive(output.code)
  // output.identifiers_mask = identifiers_mask
  // console.warn(source, output.code, set_args)
  output.identifiers = identifiers
  identifiers = null
  return output
}
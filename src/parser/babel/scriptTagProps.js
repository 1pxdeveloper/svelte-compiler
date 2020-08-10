const babel = Babel

function analyzeIdentifiers({types: t}) {
  return {
    visitor: {
      // props
      ExportNamedDeclaration(path) {
        const kind = path.node.declaration.kind
        if (kind === 'const') return

        path.node.declaration.declarations.forEach(node => {
          $props[node.id.name] = $generateSetter(node.id.name)
        })
      },
    }
  }
}

babel.registerPlugin('analyzeIdentifiers', analyzeIdentifiers)


let $generateSetter
let $props

export function analyzeScript(source, generateSetter, props) {

  $generateSetter = generateSetter
  $props = props

  const output = babel.transform(source, {
    ast: false,
    comments: false,
    plugins: ['analyzeIdentifiers']
  })

  return output
}
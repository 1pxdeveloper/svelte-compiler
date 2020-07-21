const babel = Babel
const INVALIDATE_FUNC_NAME = "_$"

function getRootScope(scope) {
  while (scope.parent) {
    scope = scope.parent
  }
  return scope
}

function makeInvalidateExpression(t, key) {
  return t.expressionStatement(t.callExpression(t.identifier(INVALIDATE_FUNC_NAME), [t.stringLiteral(key), t.identifier(key)]))
}

function insertInvalidate(t, path, node) {
  const rootScope = getRootScope(path.scope)
  console.log("rootScope", rootScope)

  while (node.object) {
    node = node.object
  }
  const key = node.name
  console.log("key", key)

  if (!rootScope.bindings[key] && !rootScope.globals[key]) return
  if (rootScope !== path.scope && path.scope.bindings[key]) return

  // path.node.left.name
  path.shouldSkip = true
  path.insertAfter(makeInvalidateExpression(t, key))
}

function makeInvalidate({types: t}) {
  window.t = t

  return {
    visitor: {
      Program: {
        exit(path) {
          if (path.shouldSkip) return

          console.group("Program")
          console.log("path", path)
          console.log("scope", path.scope)
          console.log("bindings", path.scope.bindings)
          console.groupEnd()

          Object.keys(path.scope.bindings).forEach(key => {
            path.pushContainer("body", makeInvalidateExpression(t, key))
          })

          path.shouldSkip = true
          path.replaceWith(
            t.program([
              ...path.node.body.filter(t.isImportDeclaration),
              t.functionDeclaration(t.identifier("createInstance"), [t.identifier(INVALIDATE_FUNC_NAME)], t.blockStatement(path.node.body.filter(node => !t.isImportDeclaration(node))))
            ])
          )
        }
      },

      UpdateExpression(path) {
        if (path.shouldSkip) return

        console.group("UpdateExpression")
        console.log("UpdateExpression", path)
        insertInvalidate(t, path, path.node.argument)
        console.groupEnd()
      },

      AssignmentExpression(path) {
        if (path.shouldSkip) return

        console.group("AssignmentExpression")
        console.log("path", path)
        console.log("scope", path.scope)

        insertInvalidate(t, path, path.node.left)
        console.groupEnd()
      }
    }
  }
}

babel.registerPlugin('makeInvalidate', makeInvalidate)


export function transformScript(source) {
  return babel.transform(source, {
    ast: false,
    plugins: ['makeInvalidate']
  })
}
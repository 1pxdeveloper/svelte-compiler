import {setIndentifiers} from "./identifiers"

const babel = Babel
const INVALIDATE_FUNC_NAME = "invalidate"

let $reactives

function getRootScope(scope) {
  while (scope.parent) {
    scope = scope.parent
  }
  return scope
}

function makeInvalidateExpression(t, path, key) {
  const args = [path.node, t.numericLiteral(setIndentifiers(key))]
  return t.expressionStatement(t.callExpression(t.identifier(INVALIDATE_FUNC_NAME), args))
}

function insertInvalidate(t, path, node, postfix) {
  const rootScope = getRootScope(path.scope)
  // console.log("rootScope", rootScope)

  while (node.object) {
    node = node.object
  }
  const key = node.name
  // console.log("key", key)
  // console.log(path)

  if (!rootScope.bindings[key] && !rootScope.globals[key]) return
  if (rootScope !== path.scope && path.scope.bindings[key]) return

  // path.node.left.name
  path.shouldSkip = true
  path.replaceWith(makeInvalidateExpression(t, path, key, postfix))
}

function makeInvalidate({types: t}) {
  window.t = t

  return {
    visitor: {
      UpdateExpression(path) {
        if (path.shouldSkip) return
        if (path.scope.parent === null) return
        insertInvalidate(t, path, path.node.argument, !path.node.prefix)
      },

      AssignmentExpression(path) {
        if (path.shouldSkip) return
        if (path.scope.parent === null) return
        insertInvalidate(t, path, path.node.left)
      },

      Program: {
        exit(path) {
          if (path.shouldSkip) return

          // console.group("Program")
          // console.log("path", path)
          // console.log("scope", path.scope)
          // console.log("bindings", path.scope.bindings)
          // console.groupEnd()

          // Object.keys(path.scope.bindings).forEach(key => {
          //   path.pushContainer("body", makeInvalidateExpression(t, key))
          // })

          path.shouldSkip = true
          path.replaceWith(
            t.program([
              ...path.node.body.filter(t.isImportDeclaration),
              t.functionDeclaration(
                t.identifier("createInstance"),
                [t.identifier(INVALIDATE_FUNC_NAME)],
                t.blockStatement([
                  ...path.node.body.filter(node => !t.isImportDeclaration(node)),
                  t.returnStatement(t.identifier("[" + $reactives.join(',') + "]"))
                ]))
            ])
          )
        }
      },
    }
  }
}

babel.registerPlugin('makeInvalidate', makeInvalidate)


export function transformScript(source, reactives) {

  $reactives = reactives
  console.log("reactives", reactives)

  return babel.transform(source, {
    ast: false,
    plugins: ['makeInvalidate']
  })
}
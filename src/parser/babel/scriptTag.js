const babel = Babel
const INVALIDATE_FUNC_NAME = "invalidate"

function getRootScope(scope) {
  while (scope.parent) scope = scope.parent
  return scope
}

function isMutable(scope, key) {
  const rootScope = getRootScope(scope)
  if (rootScope === scope) return false
  if (!rootScope.bindings[key] && !rootScope.globals[key]) return false
  if (rootScope.bindings[key] && rootScope.bindings[key].kind === "const") return false
  if (rootScope !== scope && scope.bindings[key]) return false
  return true
}

let $mutableTable

function markMutable(t, path, ...nodes) {
  for (let node of nodes) {
    while (node.object) node = node.object
    const key = node.name
    if (isMutable(path.scope, key)) {
      $mutableTable[key] = true
    }
  }
}


// @TODO: 같은 블록에서는 한번만 invalidate해주면 좋을듯..

function analyzeIdentifiers({types: t}) {
  return {
    visitor: {
      UpdateExpression(path) {
        markMutable(t, path, path.node.argument)
      },

      AssignmentExpression(path) {
        if (t.isArrayPattern(path.node.left)) return markMutable(t, path, ...path.node.left.elements)
        markMutable(t, path, path.node.left)
      },

      // BlockStatement(path) {
      //   console.warn("BlockStatement", path)
      // },
      //
      // ArrowFunctionExpression(path) {
      //   console.warn("ArrowFunctionExpression", path)
      // }
    }
  }
}

babel.registerPlugin('analyzeIdentifiers', analyzeIdentifiers)

export function analyzeScript(source, mutableTable) {
  $mutableTable = mutableTable

  babel.transform(source, {
    ast: false,
    comments: false,
    code: false,
    plugins: ['analyzeIdentifiers']
  })

  return $mutableTable
}


//////////////////////////////////////////////////////////////////////////////////////////////////////

import {setIndentifiers} from "../table/identifiers.js"

let $reactives
let $identifiers
let $module_soruces
let $module_specifiers
let $code

function makeInvalidateExpression(t, path, key) {
  const args = [t.numericLiteral(setIndentifiers(key, $mutableTable)), path.node]
  return t.expressionStatement(t.callExpression(t.identifier(INVALIDATE_FUNC_NAME), args))
}

function insertInvalidate(t, path, ...nodes) {
  for (let node of nodes) {
    while (node.object) node = node.object
    const key = node.name

    if (!isMutable(path.scope, key)) continue
    if (!$identifiers[key]) continue

    path.shouldSkip = true
    path.replaceWith(makeInvalidateExpression(t, path, key))
  }
}

function makeInvalidate({types: t}) {
  window.t = t

  return {
    visitor: {
      UpdateExpression(path) {
        if (path.shouldSkip) return
        insertInvalidate(t, path, path.node.argument)
      },

      AssignmentExpression: {
        exit(path) {
          if (path.shouldSkip) return
          if (t.isArrayPattern(path.node.left)) return insertInvalidate(t, path, ...path.node.left.elements)
          insertInvalidate(t, path, path.node.left)
        }
      },

      ExportNamedDeclaration(path) {
        if (path.shouldSkip) return

        console.group("ExportDefaultDeclaration", path)
        console.groupEnd()

        path.shouldSkip = true
        path.replaceWith(path.node.declaration)
      },

      ImportDeclaration(path) {

        const source = path.node.source
        const specifiers = path.node.specifiers

        console.warn("ImportDeclaration.source", source.value)
        console.warn("ImportDeclaration.specifiers", specifiers)

        $module_soruces.push(source.value)

        /// @FIXME:
        $module_specifiers.push(specifiers[0].local.name)

        console.warn("$module_soruces", $module_soruces)
        console.warn("$module_specifiers", $module_specifiers)

        path.remove()
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

          const test = (code) => {
            if (typeof code === "string") return code
            if (Array.isArray(code)) {
              const [params, array] = code
              return params + '=> [\n' + array.map(test).join(',\n') + ']'
            }
          }


          path.shouldSkip = true

          // path.replaceWith(
          //   t.program([
          //     ...path.node.body.filter(t.isImportDeclaration),
          //
          //     t.functionDeclaration(
          //       t.identifier("createInstance"),
          //       [t.identifier(INVALIDATE_FUNC_NAME)],
          //       t.blockStatement([
          //         ...path.node.body.filter(node => !t.isImportDeclaration(node)),
          //         t.returnStatement(t.identifier("[\n" + $reactives.map(test).join(',\n') + "]"))
          //       ])),
          //
          //     t.returnStatement(t.identifier($code))
          //   ])
          // )


          const blocks = [
            t.functionDeclaration(
              t.identifier("createInstance"),
              [t.identifier(INVALIDATE_FUNC_NAME)],

              t.blockStatement([
                ...path.node.body.filter(node => !t.isImportDeclaration(node)),
                t.returnStatement(t.identifier("[\n" + $reactives.map(test).join(',\n') + "]"))
              ])),

            t.returnStatement(t.identifier($code))
          ]


          const importPaths = $module_soruces.map(source => t.stringLiteral(source))

          /// @FIXME:
          const importSpecifiers = $module_specifiers.map(source => t.identifier(source))


          path.replaceWith(
            t.program([
              t.returnStatement(
                t.callExpression(t.callExpression(t.identifier('module'), importPaths), [t.arrowFunctionExpression(importSpecifiers, t.blockStatement(blocks))])
              )
            ])
          )


        }
      },
    }
  }
}

babel.registerPlugin('makeInvalidate', makeInvalidate)


export function transformScript(source, mutableTable, reactives, identifiers, code) {
  $mutableTable = mutableTable
  $reactives = reactives
  $identifiers = identifiers
  $code = code

  $module_soruces = []
  $module_specifiers = []

  console.log("reactives", reactives)

  return babel.transform(source, {
    ast: false,
    plugins: ['makeInvalidate']
  })
}



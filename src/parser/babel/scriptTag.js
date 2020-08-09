const babel = Babel

import {INVALIDATE_FUNC_NAME} from "./config"
import {setIndentifiers} from "../table/identifiers.js"

let $mutableTable
let $reactives
let $identifiers
let $module_soruces
let $module_specifiers
let $code
let $props

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

      /// props
      ExportNamedDeclaration(path) {
        if (path.shouldSkip) return

        console.group("ExportDefaultDeclaration", path)
        console.groupEnd()

        const kind = path.node.declaration.kind
        $props[kind] = $props[kind] || []

        path.node.declaration.declarations.forEach(node => {
          console.log("node", node)
          console.log("node.id", node.id)
          console.log("node.init", node.init)

          $props[kind].push([node.id, node.init])
        })

        // @TODO: Cannot declare props in destructured declaration (3:12)


        path.shouldSkip = true
        path.remove()
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


          const repl = (kind, props) => {
            console.log(kind, props)

            return t.variableDeclaration(kind, [
              t.variableDeclarator(
                t.objectPattern(props.map(s => s[1] ? t.objectProperty(s[0], t.assignmentPattern(...s)) : t.objectProperty(s[0], s[0], false, true))),
                t.identifier("$$props"))
            ])
          }

          const blocks = [
            t.functionDeclaration(
              t.identifier("createInstance"),
              [
                t.identifier(INVALIDATE_FUNC_NAME),
                t.identifier('$$props')
              ],

              t.blockStatement([
                ...Object.entries($props).map(([kind, props]) => repl(kind, props)),
                ...path.node.body.filter(node => !t.isImportDeclaration(node)),
                t.returnStatement(t.identifier("[[\n" + $reactives.map(test).join(',\n') + "], {x:2}]"))
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
  $props = []
  console.log("reactives", reactives)

  return babel.transform(source, {
    ast: false,
    plugins: ['makeInvalidate']
  })
}





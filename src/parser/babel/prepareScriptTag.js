const babel = Babel
import {INVALIDATE_FUNC_NAME} from "./config.js"


let $reactive
let $props
let $module_soruces
let $module_specifiers
let $code


const transformReactive = (t) => (arr) => {
  return t.arrayExpression(arr.map(node => {

    /// scope ex) (row, index) => [ ... ]
    if (Array.isArray(node)) {
      const [params, arr2] = node
      const output = babel.transform(params, {})
      const arrow = output.ast.program.body[0].expression
      arrow.body = transformReactive(t)(arr2)
      return arrow
    }

    node.mask = 0
    return node
  }))
}

const findReactivePathNode = (path) => {

  while (path.parentPath) {
    if (path.node.mask >= 0) {
      return path.node
    }
    path = path.parentPath
  }
}

function analyzeIdentifiers({types: t}) {

  console.log("$reactive$reactive$reactive$reactive", $reactive)

  let context = t.returnStatement(transformReactive(t)($reactive))

  console.log(context)


  return {
    visitor: {
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

      // props
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
      },

      Program: {
        enter(path) {
          if (path.shouldSkip) return
          path.node.body.push(context)
        },

        exit(path) {
          if (path.shouldSkip) return

          console.log("Scope", path.scope)

          const rootScopeUid = path.scope.uid
          const refs = Object.values(path.scope.bindings)
            .filter(binding => !binding.constant)
            .sort((a, b) => b.constantViolations.length - a.constantViolations.length)

          console.log("#########################", refs)

          refs.forEach((binding, index) => {
            const flag = 1 << index // @FIXME: flag는 32개까지만 가능하다.

            // invalidate To assignment or update expression
            for (const constantViolation of binding.constantViolations) {
              const {uid} = constantViolation.scope
              if (uid === rootScopeUid) continue

              const path = constantViolation.isAssignmentExpression() ? constantViolation : constantViolation.parentPath
              path.replaceWith(t.callExpression(t.identifier(INVALIDATE_FUNC_NAME), [path.node, t.numericLiteral(flag)]))
            }

            // ref
            console.log("binding", binding)
            const {referencePaths} = binding
            console.log(referencePaths)

            for (const referencePath of referencePaths) {
              const node = findReactivePathNode(referencePath)

              if (node) {
                node.mask |= flag
              }

              console.log("@@@@@@@@@@@@@@@@@rrr", node)
            }
          })


          console.log("$props$props$props$props$props", $props)


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
                ...path.node.body.filter(node => !t.isImportDeclaration(node) && !t.isExportDeclaration(node)),
              ])),

            t.returnStatement(t.identifier($code()))
          ]


          const importPaths = $module_soruces.map(source => t.stringLiteral(source))

          /// @FIXME:
          const importSpecifiers = $module_specifiers.map(source => t.identifier(source))


          path.shouldSkip = true
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

babel.registerPlugin('analyzeIdentifiers', analyzeIdentifiers)


export function analyzeScript(source, reactive, createCode) {
  $reactive = reactive

  $module_soruces = []
  $module_specifiers = []
  $props = Object.create(null)

  $code = createCode

  const output = babel.transform(source, {
    ast: false,
    comments: false,
    plugins: ['analyzeIdentifiers']
  })

  return output
}
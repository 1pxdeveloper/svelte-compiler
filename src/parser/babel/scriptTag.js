const babel = Babel
import {INVALIDATE_FUNC_NAME, PROPS_NAME, UPDATE_FUNC_NAME} from "./config.js"


let $reactive
let $props
let $propsTable
let $module_soruces
let $module_specifiers
let $code


const findLeftMost = (node) => {
  while (node.object) {
    node = node.object
  }
  return node
}

const findAssignmentsPath = (path) => {
  while (path.parentPath) {
    if (path.isAssignmentExpression()) return path
    path = path.parentPath
  }
}

const findReactivePathNode = (path) => {
  while (path.parentPath) {
    if (path.node.isReactive) return path.node
    path = path.parentPath
  }
}

const findLabeledPath = (path) => {
  while (path.parentPath) {
    if (path.node.type === "LabeledStatement" && path.node.label.name === "$") return path
    path = path.parentPath
  }
}

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

    node.isReactive = true
    return node
  }))
}

const transformInvalidate = (t, path, flag) => path.replaceWith(t.callExpression(t.identifier(INVALIDATE_FUNC_NAME), [path.node, t.numericLiteral(flag)]))

const transformLabeled = (t) => (path) => {
  path.replaceWith(
    t.expressionStatement(
      t.callExpression(t.identifier(UPDATE_FUNC_NAME), [
        t.arrowFunctionExpression([], t.isExpressionStatement(path.node.body) ? path.node.body.expression : t.blockStatement([path.node.body])),
        t.numericLiteral(path.mask)
      ])
    )
  )
}


function transformScriptPlugin({types: t}) {

  let props = t.objectExpression(Object.entries($propsTable).map(([key, value]) => {
    return t.objectProperty(t.identifier(key), t.numericLiteral(value))
  }))

  let context = t.returnStatement(t.arrayExpression([transformReactive(t)($reactive), props]))
  console.log(context)
  console.log("props!!!", props)

  let labels = []

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

      LabeledStatement(path) {
        if (path.node.label.name === "$") labels.push(path)
      },

      Program: {
        enter(path) {
          if (path.shouldSkip) return
          path.node.body.push(context)
        },

        exit(path) {
          if (path.shouldSkip) return

          const scope = path.scope
          const rootScopeUid = scope.uid
          const refs = Object.values(scope.bindings)
            .filter(binding => !binding.constant || binding.referenced)
            .sort((a, b) => b.constantViolations.length + b.references - a.constantViolations.length + a.references)


          // Scope를 통해 값이 변경되는 구간을 invalidate로 체크한다.
          refs.forEach((binding, index) => {
            const {referencePaths} = binding
            const flag = 1 << index // @FIXME: flag는 32개까지만 가능하다.

            /// [Reactivity / Statements]
            for (const constantViolation of binding.constantViolations) {
              if (!(findLabeledPath(constantViolation)) && constantViolation.scope.uid === rootScopeUid) continue
              const constantViolationPath = constantViolation.isAssignmentExpression() ? constantViolation : constantViolation.parentPath
              transformInvalidate(t, constantViolationPath, flag)
            }

            /// [Reactivity / Updating objects]
            for (const referencePath of referencePaths) {
              if (referencePath.scope.uid === rootScopeUid) continue
              const assignmentsPath = findAssignmentsPath(referencePath)
              if (!assignmentsPath) continue
              if (findLeftMost(assignmentsPath.node.left) === referencePath.node) {
                transformInvalidate(t, assignmentsPath, flag)
              }
            }

            // context ref mask
            for (const referencePath of referencePaths) {

              const node = findReactivePathNode(referencePath)
              if (node) {
                node.elements[1].value |= flag
              }

              const labeledPath = findLabeledPath(referencePath)
              if (labeledPath) {
                labeledPath.mask |= flag
              }
            }
          })


          /// [Reactivity / Statements]
          labels.forEach(transformLabeled(t))


          /// [Props]
          const makeProps = (kind, props) => {
            console.log(kind, props)

            return t.variableDeclaration(kind, [
              t.variableDeclarator(
                t.objectPattern(props.map(s => s[1] ? t.objectProperty(s[0], t.assignmentPattern(...s)) : t.objectProperty(s[0], s[0], false, true))),
                t.identifier(PROPS_NAME))
            ])
          }


          /*
          createInstance($$invalidate, $$props, $$update) {
            $$invalidate(x = 5, 1)
            return [[() => x], 1]
          }
           */
          const blocks = [
            t.functionDeclaration(
              t.identifier("createInstance"),
              [
                t.identifier(INVALIDATE_FUNC_NAME),
                t.identifier(PROPS_NAME),
                t.identifier(UPDATE_FUNC_NAME)
              ],

              t.blockStatement([
                ...Object.entries($props).map(([kind, props]) => makeProps(kind, props)),
                ...path.node.body.filter(node => !t.isImportDeclaration(node) && !t.isExportDeclaration(node)),
              ])),

            t.returnStatement(t.identifier($code))
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

babel.registerPlugin('transformScriptPlugin', transformScriptPlugin)

export function transformScript(source, reactive, code, propsTable) {
  $reactive = reactive
  $module_soruces = []
  $module_specifiers = []

  $props = Object.create(null)
  $propsTable = propsTable

  $code = code

  const output = babel.transform(source, {
    ast: false,
    comments: false,
    plugins: ['transformScriptPlugin']
  })

  return output
}
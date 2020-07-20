<script>
const babel = Babel

function getRootScope(scope) {
  while (scope.parent) {
    scope = scope.parent
  }
  return scope
}

function makeInvalidateExpression(t, key) {
  return t.expressionStatement(t.callExpression(t.identifier("invalidate"), [t.stringLiteral(key), t.identifier(key)]))
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
              t.functionDeclaration(t.identifier("createInstance"), [t.identifier("invalidate")], t.blockStatement(path.node.body.filter(node => !t.isImportDeclaration(node))))
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

window.babel = babel


// language=js
const input = `
  import {foo} from "./test"

  let pos = {x:10, y:20, z: {foo: "bar"}}

  pos.x = 200;
  pos.z.foo++;


  function test() {
    pos.y = 400;
    pos.z.foo = "ASdfasdfsadf"
  }
`


let ddd = `

import element from "svelte/node/element"
import attr from "svelte/node/attr"
import bind from "svelte/node/bind"

export default class UIComponent extends SvelteComponent {
  constructor() {
    super(createInstance, element("div", attr("style", "display:flex"),
      element("textarea", attr("cols", "80"), attr("rows", "45"), bind("value", [(text) => text), 'text']),
      element("div", attr("style", "padding: 10px")),
      element("pre", attr("style", "tab-size: 4"), text(({result}) => result)))
  }
}`


// language=
console.time("1")

const output = babel.transform(input, {
  plugins: ['makeInvalidate']
})

console.log("output", output)
console.log(output.code + ddd)
console.timeEnd("1")

</script>
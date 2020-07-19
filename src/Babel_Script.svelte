<script>
const babel = Babel

function makeInvalidate({types: t}) {
  return {
    visitor: {
      Program(path) {
        console.log("Program", path)
        console.log("scope", path.scope)

        console.log("bindings", path.scope.bindings)
      },

      AssignmentExpression(path) {
        if (path.shouldSkip) return

        let node = path.node
        let left = path.node.left.name

        // path.node.left.name
        path.replaceWith(
          t.expressionStatement(t.callExpression(t.identifier("invalidate"), [t.stringLiteral(left), path.node]))
        )
        path.shouldSkip = true
      }
    }
  }
}

babel.registerPlugin('makeInvalidate', makeInvalidate)

window.babel = babel


// language=js
const input = `

  import {foo} from "./test"

  let x = 100;
  let y = 200;

  const z = 500;


  function test() {

    let inner = 500;
    const iin = "asdfasfd";
  }
`


// language=
console.time("1")

const output = babel.transform(input, {
  plugins: ['makeInvalidate']
})

console.log("output", output)
console.log(output.code)
console.timeEnd("1")

</script>
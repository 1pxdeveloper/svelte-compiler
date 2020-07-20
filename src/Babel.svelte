<script>
const babel = Babel
window.babel = babel

function makeReactive({types: t}) {
  window.t = t

  return {
    visitor: {
      ExpressionStatement(path) {
        if (path.parentKey !== "body") return
        if (path.shouldSkip) return

        const keys = Object.keys(path.scope.globals)

        path.shouldSkip = true
        path.replaceWith(
          t.arrayExpression([
            t.arrowFunctionExpression(keys.map(key => t.identifier(key)), path.node.expression),
            ...keys.map(key => t.stringLiteral(key))
          ])
        )
      },
    }
  }
}

babel.registerPlugin('makeReactive', makeReactive)


// language=js
const input = `(event) => path.scope.globals + test(event)`


// language=
console.time("1")

const output = babel.transform(input, {
  plugins: ['makeReactive']
})

console.log("output", output)
if (output.ast.program.body[0].type !== "ExpressionStatement") {
  throw new Error("{...} must be expression.")
}

console.log(output.code)
console.timeEnd("1")
</script>
<script>
const babel = Babel;

function lolizer({types: t}) {
  return {
    visitor: {
      // Identifier(path) {
      //   path.node.name = 'LOL';
      // },

      AssignmentExpression(path) {
        console.log(path);

        if (path.parentPath.listKey !== "body") {
          return;
        }

        let node = path.node;
        let left = path.node.left.name;

        // path.node.left.name
        path.replaceWith(
          t.expressionStatement(t.callExpression(t.identifier("invalidate"), [t.stringLiteral(left), path.node]))
        );

      }
    }
  }
}

babel.registerPlugin('lolizer', lolizer);

window.babel = babel;


// language=JSX
const input = `

  let x = 100;
  let y = 200;
  // let z = 0;

  z = x + y;
`


const output = babel.transform(input,
  {plugins: ['lolizer']}
);


console.log(output.code);
</script>
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


// language=js
const input = `x + 100`


// language=
console.time("1");

const output = babel.transform(input, {
    "parserOpts": {
      "plugins": ["jsx"]
    },
    plugins: ['lolizer']
  }
);

console.log(output.code);

console.timeEnd("1");

</script>
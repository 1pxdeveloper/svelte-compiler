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


// language=HTML
const input = `
<component>
  <script>
    let x = 100;
    let y = 200;
    // let z = 0;

    let z = x + y;

    function test() {
      let x = 100;
       let z = "sadklfjasldfjlksafdSD";
    }
  </scr` + `ipt>

  <div class="abc" test={100}>
    <space size="2"/>
    <h1>sadklfj:sdkfjaslkdf{skdlfjs}</h1>
  </div>

  <style>{\`
   h1 {
   color: red;
\`}
</style>
</component>

`

// language=
const output = babel.transform(input, {
"parserOpts": {
"plugins": ["jsx"]
},
plugins: ['lolizer']
}
);

console.log(output.code);
</script>
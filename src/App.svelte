<script>
const _abc = () => {
}; //

const createEscapeOneLineRegexp = (open, close = open, ...blocks) => {
  return new RegExp(`${open}(?:${blocks.map(b => b + '|').join('')}\\\\.|[^\\\\${close}\n])*${close}`);
}

const string1 = createEscapeOneLineRegexp('"');
const string2 = createEscapeOneLineRegexp("'");
const string3 = createEscapeOneLineRegexp("`");
const regexp_bracket = createEscapeOneLineRegexp("\\[", "\\]");
const regexp = createEscapeOneLineRegexp("\\/", "\\/", regexp_bracket.source);
const identifier = /(?:[$_\p{ID_Start}])(?:[$_\u200C\u200D\p{ID_Continue}])*/u;
const tag_open = /<[^\s/>]+/;
const tag_close = /<\/\S+\s*>/;

const lex = [
  ["tag_open", tag_open],
  ["tag_close", tag_close],
  ["string", string1],
  ["string", string2],
  ["string", string3],
  ["regexp", regexp],
  ["operator", /\/>|[{}>]/],
]


const re = new RegExp(lex.map(([type, regexp]) => "(" + regexp.source + ")").join("|") + "|\s|.", "gu");

console.log(re);

let text = "";
let result = "";

$: {
  let res = [];
  let body = "";
  text.replace(re, (a, ...args) => {
    const index = args.indexOf(a)
    if (index < 0) {
      body += a;
      return a;
    }

    if (body.length) {
      // res.push("body\t\t\t" + body);
      body = "";
    }
    res.push(lex[index] && lex[index][0] + "\t\t\t" + a);
    return a;
  })

  result = res.join("\n\n");
}


const element = () => {

}

const attr = () => {

}

const bind = () => {

}

const _text = () => {

}


const render = (element, attr, text, bind, use, _in, _out) =>
  element("div", attr("style", "display:flex"),
    element("textarea", attr("cols", "80"), attr("rows", "45"), bind("value", ({text}) => text)),
    element("div", attr("style", "padding: 10px")),
    element("pre", attr("style", "tab-size: 4"), text(({result}) => result)),
  )


// <div style="display: flex">
//   <textarea cols="80" rows="45" bind:value={text}/>
//
//   <div style="padding: 10px"></div>
//
//   <pre style="tab-size: 4">{result}</pre>
// </div>


</script>


<div style="display: flex">
  <textarea cols="80" rows="45" bind:value={text}/>

  <div style="padding: 10px"></div>

  <pre style="tab-size: 4">{result}</pre>
</div>